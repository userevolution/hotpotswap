pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./utility/Lockable.sol";
import "./utility/SafeMath.sol";
import "./utility/LibMathSigned.sol";
import "./utility/Address.sol";
import "./utility/Whitelist.sol";
import "./utility/Types.sol";
import "./TokenFactory.sol";
import "./interfaces/IAMM.sol";
import "./interfaces/IPerpetual.sol";
import "./interfaces/IPriceFeeder.sol";

/**
 * @title AMM contract
 */

contract AMM is Lockable, Whitelist, IAMM {
    using SafeMath for uint256;
    using LibMathSigned for int256;
    using Address for address;

    // Version number
    uint16 public constant version = 1;

    uint256 private constant FUNDING_PERIOD = 28800; // 8 * 3600;
    Types.FundingState private fundingState;

    // Share token created by this contract.
    IExpandedIERC20 public shareToken;
    // Price feeder contract.
    IPriceFeeder public priceFeeder;
    // Perpetual contract.
    IPerpetual public perpetual;



    // Adjustable params
    uint256 public poolFeeRate = 10000000000000000; // 1%
    uint256 public poolDevFeeRate = 5000000000000000; // 0.5%
    uint256 public updatePremiumPrize = 1000000000000000000; // 1

    int256 public markPremiumLimit = 5000000000000000; // 0.5%

    int256 public emaAlpha = 3327787021630616; // 2 / (600 + 1)
    int256 public emaAlpha2 = 996672212978369384; // 10**18 - emaAlpha
    int256 public emaAlpha2Ln = -3333336419758231; // ln(emaAlpha2)
    int256 public fundingDampener = 500000000000000; // 0.05%
    
    event CreatedAMM();
    event UpdateFundingRate(Types.FundingState fundingState);

    constructor(
        string memory _poolName,
        string memory _poolSymbol,
        address _tokenFactoryAddress,
        address _priceFeederAddress,
        address _perpetualAddress
    ) public nonReentrant() {
        TokenFactory tf = TokenFactory(_tokenFactoryAddress);
        shareToken = tf.createToken(_poolName, _poolSymbol, 18);

        priceFeeder = IPriceFeeder(_priceFeederAddress);
        perpetual = IPerpetual(_perpetualAddress);

        addAddress(msg.sender);

        emit CreatedAMM();
    }

    // function testEmaAlpha() public view returns (int256 emaAlpha2, int256 emaAlpha2Ln) {
    //     emaAlpha2 = 10**18 - emaAlpha;
    //     emaAlpha2Ln = emaAlpha2.wln();
    // }

    function setPoolFeeRate(uint256 value) external onlyWhitelisted() {
        require(value != poolFeeRate, "duplicated value");
        poolFeeRate = value;
    }

    function setPoolDevFeeRate(uint256 value) external onlyWhitelisted() {
        require(value != poolDevFeeRate, "duplicated value");
        poolDevFeeRate = value;
    }

    function setUpdatePremiumPrize(uint256 value) external onlyWhitelisted() {
        require(value != updatePremiumPrize, "duplicated value");
        updatePremiumPrize = value;
    }

    function setMarkPremiumLimit(int256 value) external onlyWhitelisted() {
        require(value != markPremiumLimit, "duplicated value");
        markPremiumLimit = value;
    }

    function setEmaAlpha(int256 value) external onlyWhitelisted() {
        require(value != emaAlpha, "duplicated value");
        emaAlpha = value;
        emaAlpha2 = 10**18 - value;
        emaAlpha2Ln = value.wln();
    }

    function setFundingDampener(int256 value) external onlyWhitelisted() {
        require(value != fundingDampener, "duplicated value");
        fundingDampener = value;
    }

    /**
     * @dev Share token's ERC20 address.
     */
    function shareTokenAddress() public override view returns (address) {
        return address(shareToken);
    }

    /**
     * @dev Read the price
     */
    function indexPrice()
        public
        override
        view
        returns (uint256 price, uint256 timestamp)
    {
        price = priceFeeder.getValue();
        timestamp = priceFeeder.getTimestamp();

        require(price != 0, "index price error");
    }

    function currentMarkPrice() public override returns (uint256) {
        _funding();
        return _lastMarkPrice();
    }

    function lastFundingState() public view returns (Types.FundingState memory) {
        return fundingState;
    }

    function currentAccumulatedFundingPerContract() public override returns (int256) {
        _funding();
        return fundingState.accumulatedFundingPerContract;
    }

    function depositAndBuy(
        uint256 depositAmount,
        uint256 tradeAmount,
        uint256 limitPrice,
        uint256 deadline
    )
        public
    {
        if (depositAmount > 0) {
            perpetual.depositFor(msg.sender, depositAmount);
        }
        if (tradeAmount > 0) {
            buy(tradeAmount, limitPrice, deadline);
        }
    }

    function depositAndSell(
        uint256 depositAmount,
        uint256 tradeAmount,
        uint256 limitPrice,
        uint256 deadline
    )
        public
    {
        if (depositAmount > 0) {
            perpetual.depositFor(msg.sender, depositAmount);
        }
        if (tradeAmount > 0) {
            sell(tradeAmount, limitPrice, deadline);
        }
    }

    /**
     * @dev Buy/long with AMM.
     */
    function buy(
        uint256 amount,
        uint256 limitPrice,
        uint256 deadline
    ) public returns (uint256) {
        return _buyFrom(msg.sender, amount, limitPrice, deadline);
    }

    /**
     * @dev Sell/short with AMM.
     */
    function sell(
        uint256 amount,
        uint256 limitPrice,
        uint256 deadline
    ) public returns (uint256) {
        return _sellFrom(msg.sender, amount, limitPrice, deadline);
    }

    // INTERNAL FUCTIONS
    function _funding() internal {
        if (perpetual.status() != Types.Status.NORMAL) {
            return;
        }
        uint256 blockTime = _getBlockTimestamp();
        uint256 newIndexPrice;
        uint256 newIndexTimestamp;
        (newIndexPrice, newIndexTimestamp) = indexPrice();
        if (
            blockTime != fundingState.lastFundingTime || // condition 1
            newIndexPrice != fundingState.lastIndexPrice || // condition 2, especially when updateIndex and buy/sell are in the same block
            newIndexTimestamp > fundingState.lastFundingTime // condition 2
        ) {
            _forceFunding(blockTime, newIndexPrice, newIndexTimestamp);
        }

    } 

    function _lastMarkPrice() internal view returns (uint256) {
        int256 index = fundingState.lastIndexPrice.toInt256();
        int256 limit = index.wmul(markPremiumLimit);
        int256 p = index.add(_lastEMAPremium());
        p = p.min(index.add(limit));
        p = p.max(index.sub(limit));
        return p.max(0).toUint256();
    }

    function _lastEMAPremium() internal view returns (int256) {
        return fundingState.lastEMAPremium;
    }

    function _forceFunding() internal {
        require(perpetual.status() == Types.Status.NORMAL, "wrong perpetual status");
        uint256 blockTime = _getBlockTimestamp();
        uint256 newIndexPrice;
        uint256 newIndexTimestamp;
        (newIndexPrice, newIndexTimestamp) = indexPrice();
        _forceFunding(blockTime, newIndexPrice, newIndexTimestamp);
    }

    function _tradingAccount() internal view returns (address) {
        return address(perpetual);
    }

    function _forceFunding(uint256 blockTime, uint256 newIndexPrice, uint256 newIndexTimestamp) private {
        if (fundingState.lastFundingTime == 0) {
            // funding initialization required. but in this case, it's safe to just do nothing and return
            return;
        }
        Types.PositionData memory account = perpetual.positions(_tradingAccount());
        if (account.size == 0) {
            // empty pool. it's safe to just do nothing and return
            return;
        }

        if (newIndexTimestamp > fundingState.lastFundingTime) {
            // the 1st update
            _nextStateWithTimespan(account, newIndexPrice, newIndexTimestamp);
        }
        // the 2nd update;
        _nextStateWithTimespan(account, newIndexPrice, blockTime);

        emit UpdateFundingRate(fundingState);
    }

    function _getBlockTimestamp() internal view returns (uint256) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }

    function _buyFrom(
        address trader,
        uint256 amount,
        uint256 limitPrice,
        uint256 deadline
    )
        private
        returns (uint256) {
        require(perpetual.status() == Types.Status.NORMAL, "wrong perpetual status");
        require(perpetual.isValidTradingLotSize(amount), "amount must be divisible by tradingLotSize");

        uint256 price = _getBuyPrice(amount);
        require(limitPrice >= price, "price limited");
        require(_getBlockTimestamp() <= deadline, "deadline exceeded");
        (uint256 opened, ) = perpetual.tradePosition(trader, _tradingAccount(), Types.Side.LONG, price, amount);

        // uint256 value = price.wmul(amount);
        // uint256 fee = value.wmul(poolFeeRate);
        // uint256 devFee = value.wmul(poolDevFeeRate);
        // address devAddress = perpetual.devAddress();

        // perpetualProxy.transferCashBalance(trader, tradingAccount(), fee);
        // perpetualProxy.transferCashBalance(trader, devAddress, devFee);

        _forceFunding(); // x, y changed, so fair price changed. we need funding now
        _mustSafe(trader, opened);
        return opened;
    }

    function _sellFrom(
        address trader,
        uint256 amount,
        uint256 limitPrice,
        uint256 deadline
    ) private returns (uint256) {
        require(perpetual.status() == Types.Status.NORMAL, "wrong perpetual status");
        require(perpetual.isValidTradingLotSize(amount), "amount must be divisible by tradingLotSize");

        uint256 price = _getSellPrice(amount);
        require(limitPrice <= price, "price limited");
        require(_getBlockTimestamp() <= deadline, "deadline exceeded");
        (uint256 opened, ) = perpetual.tradePosition(trader, _tradingAccount(), Types.Side.SHORT, price, amount);

        // uint256 value = price.wmul(amount);
        // uint256 fee = value.wmul(governance.poolFeeRate);
        // uint256 devFee = value.wmul(governance.poolDevFeeRate);
        // address devAddress = perpetualProxy.devAddress();
        // perpetualProxy.transferCashBalance(trader, tradingAccount(), fee);
        // perpetualProxy.transferCashBalance(trader, devAddress, devFee);

        _forceFunding(); // x, y changed, so fair price changed. we need funding now
        _mustSafe(trader, opened);
        return opened;
    }

    function _getBuyPrice(uint256 amount) internal returns (uint256 price) {
        uint256 x;
        uint256 y;
        (x, y) = _currentXY();
        require(y != 0 && x != 0, "empty pool");
        return x.wdiv(y.sub(amount));
    }

    function _getSellPrice(uint256 amount) internal returns (uint256 price) {
        uint256 x;
        uint256 y;
        (x, y) = _currentXY();
        require(y != 0 && x != 0, "empty pool");
        return x.wdiv(y.add(amount));
    }

    function _currentXY() internal returns (uint256 x, uint256 y) {
        _funding();
        Types.PositionData memory account = perpetual.positions(_tradingAccount());
        x = _availableMarginFromPoolAccount(account);
        y = account.size;
    }

    function _mustSafe(address trader, uint256 opened) internal {
        // perpetual.markPrice is a little different from ours
        uint256 perpetualMarkPrice = perpetual.markPrice();
        if (opened > 0) {
            require(perpetual.isIMSafeWithPrice(trader, perpetualMarkPrice), "im unsafe");
        }
        require(perpetual.isSafeWithPrice(trader, perpetualMarkPrice), "sender unsafe");
        require(perpetual.isSafeWithPrice(_tradingAccount(), perpetualMarkPrice), "amm unsafe");
    }

    function _nextStateWithTimespan(
        Types.PositionData memory account,
        uint256 newIndexPrice,
        uint256 endTimestamp
    ) private {
        require(fundingState.lastFundingTime != 0, "funding initialization required");
        require(endTimestamp >= fundingState.lastFundingTime, "time steps (n) must be positive");

        // update ema
        if (fundingState.lastFundingTime != endTimestamp) {
            int256 timeDelta = endTimestamp.sub(fundingState.lastFundingTime).toInt256();
            int256 acc;
            (fundingState.lastEMAPremium, acc) = _getAccumulatedFunding(
                timeDelta,
                fundingState.lastEMAPremium,
                fundingState.lastPremium,
                fundingState.lastIndexPrice.toInt256() // ema is according to the old index
            );
            fundingState.accumulatedFundingPerContract = fundingState.accumulatedFundingPerContract.add(
                acc.div(FUNDING_PERIOD.toInt256())
            );
            fundingState.lastFundingTime = endTimestamp;
        }
        
        // always update
        fundingState.lastIndexPrice = newIndexPrice; // should update before premium()
        fundingState.lastPremium = _premiumFromPoolAccount(account);
    }

    function _premiumFromPoolAccount(Types.PositionData memory account) internal view returns (int256) {
        int256 p = _fairPriceFromPoolAccount(account).toInt256();
        p = p.sub(fundingState.lastIndexPrice.toInt256());
        return p;
    }

    function _fairPriceFromPoolAccount(Types.PositionData memory account) internal view returns (uint256) {
        uint256 y = account.size;
        require(y > 0, "funding initialization required");
        uint256 x = _availableMarginFromPoolAccount(account);
        return x.wdiv(y);
    }

    function _availableMarginFromPoolAccount(Types.PositionData memory account) internal view returns (uint256) {
        int256 available = account.rawCollateral;
        int256 socialLossPerContract = perpetual.socialLossPerContract(account.side);
        available = available.sub(account.entryValue.toInt256());
        available = available.sub(socialLossPerContract.wmul(account.size.toInt256()).sub(account.entrySocialLoss));
        available = available.sub(
            fundingState.accumulatedFundingPerContract.wmul(account.size.toInt256()).sub(account.entryFundingLoss)
        );
        return available.max(0).toUint256();
    }

    /**
     * @notice The intermediate variables required by getAccumulatedFunding. This is only used to move stack
     *         variables to storage variables.
     */
    struct AccumulatedFundingCalculator {
        int256 vLimit;
        int256 vDampener;
        int256 t1; // normal int, not WAD
        int256 t2; // normal int, not WAD
        int256 t3; // normal int, not WAD
        int256 t4; // normal int, not WAD
    }

    function timeOnFundingCurve(
        int256 y,
        int256 v0,
        int256 _lastPremium
    )
        internal
        view
        returns (
            int256 t // normal int, not WAD
        )
    {
        require(y != _lastPremium, "no solution 1 on funding curve");
        t = y.sub(_lastPremium);
        t = t.wdiv(v0.sub(_lastPremium));
        require(t > 0, "no solution 2 on funding curve");
        require(t < LibMathSigned.WAD(), "no solution 3 on funding curve");
        t = t.wln();
        t = t.wdiv(emaAlpha2Ln);
        t = t.ceil(LibMathSigned.WAD()) / LibMathSigned.WAD();
    }

    /**
     * @notice Sum emaPremium curve between [x, y)
     *
     * @param x Begin time. normal int, not WAD.
     * @param y End time. normal int, not WAD.
     * @param v0 LastEMAPremium.
     * @param _lastPremium LastPremium.
     */
    function integrateOnFundingCurve(
        int256 x,
        int256 y,
        int256 v0,
        int256 _lastPremium
    ) internal view returns (int256 r) {
        require(x <= y, "integrate reversed");
        r = v0.sub(_lastPremium);
        r = r.wmul(emaAlpha2.wpowi(x).sub(emaAlpha2.wpowi(y)));
        r = r.wdiv(emaAlpha);
        r = r.add(_lastPremium.mul(y.sub(x)));
    }

    function _getAccumulatedFunding(
        int256 n,
        int256 v0,
        int256 _lastPremium,
        int256 _lastIndexPrice
    )
        internal
        view
        returns (
            int256 vt, // new LastEMAPremium
            int256 acc
        )
    {
        require(n > 0, "we can't go back in time");
        AccumulatedFundingCalculator memory ctx;
        vt = v0.sub(_lastPremium);
        vt = vt.wmul(emaAlpha2.wpowi(n));
        vt = vt.add(_lastPremium);
        ctx.vLimit = markPremiumLimit.wmul(_lastIndexPrice);
        ctx.vDampener = fundingDampener.wmul(_lastIndexPrice);
        if (v0 <= -ctx.vLimit) {
            // part A
            if (vt <= -ctx.vLimit) {
                acc = (-ctx.vLimit).add(ctx.vDampener).mul(n);
            } else if (vt <= -ctx.vDampener) {
                ctx.t1 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                acc = (-ctx.vLimit).mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, n, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(n));
            } else if (vt <= ctx.vDampener) {
                ctx.t1 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                acc = (-ctx.vLimit).mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(ctx.t2));
            } else if (vt <= ctx.vLimit) {
                ctx.t1 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                acc = (-ctx.vLimit).mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(ctx.t2.sub(n).add(ctx.t3)));
            } else {
                ctx.t1 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                acc = (-ctx.vLimit).mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium));
                acc = acc.add(ctx.vLimit.mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(ctx.t2.sub(n).add(ctx.t3)));
            }
        } else if (v0 <= -ctx.vDampener) {
            // part B
            if (vt <= -ctx.vLimit) {
                ctx.t4 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t4, v0, _lastPremium);
                acc = acc.add((-ctx.vLimit).mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(n));
            } else if (vt <= -ctx.vDampener) {
                acc = integrateOnFundingCurve(0, n, v0, _lastPremium);
                acc = acc.add(ctx.vDampener.mul(n));
            } else if (vt <= ctx.vDampener) {
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.add(ctx.vDampener.mul(ctx.t2));
            } else if (vt <= ctx.vLimit) {
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.add(integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(ctx.t2.sub(n).add(ctx.t3)));
            } else {
                ctx.t2 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.add(integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium));
                acc = acc.add(ctx.vLimit.mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(ctx.t2.sub(n).add(ctx.t3)));
            }
        } else if (v0 <= ctx.vDampener) {
            // part C
            if (vt <= -ctx.vLimit) {
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium);
                acc = acc.add((-ctx.vLimit).mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3)));
            } else if (vt <= -ctx.vDampener) {
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium);
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3)));
            } else if (vt <= ctx.vDampener) {
                acc = 0;
            } else if (vt <= ctx.vLimit) {
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium);
                acc = acc.sub(ctx.vDampener.mul(n.sub(ctx.t3)));
            } else {
                ctx.t3 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium);
                acc = acc.add(ctx.vLimit.mul(n.sub(ctx.t4)));
                acc = acc.sub(ctx.vDampener.mul(n.sub(ctx.t3)));
            }
        } else if (v0 <= ctx.vLimit) {
            // part D
            if (vt <= -ctx.vLimit) {
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.add(integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium));
                acc = acc.add((-ctx.vLimit).mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3).sub(ctx.t2)));
            } else if (vt <= -ctx.vDampener) {
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.add(integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3).sub(ctx.t2)));
            } else if (vt <= ctx.vDampener) {
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t2, v0, _lastPremium);
                acc = acc.sub(ctx.vDampener.mul(ctx.t2));
            } else if (vt <= ctx.vLimit) {
                acc = integrateOnFundingCurve(0, n, v0, _lastPremium);
                acc = acc.sub(ctx.vDampener.mul(n));
            } else {
                ctx.t4 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                acc = integrateOnFundingCurve(0, ctx.t4, v0, _lastPremium);
                acc = acc.add(ctx.vLimit.mul(n.sub(ctx.t4)));
                acc = acc.sub(ctx.vDampener.mul(n));
            }
        } else {
            // part E
            if (vt <= -ctx.vLimit) {
                ctx.t1 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                ctx.t4 = timeOnFundingCurve(-ctx.vLimit, v0, _lastPremium);
                acc = ctx.vLimit.mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(integrateOnFundingCurve(ctx.t3, ctx.t4, v0, _lastPremium));
                acc = acc.add((-ctx.vLimit).mul(n.sub(ctx.t4)));
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3).sub(ctx.t2)));
            } else if (vt <= -ctx.vDampener) {
                ctx.t1 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                ctx.t3 = timeOnFundingCurve(-ctx.vDampener, v0, _lastPremium);
                acc = ctx.vLimit.mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(integrateOnFundingCurve(ctx.t3, n, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(n.sub(ctx.t3).sub(ctx.t2)));
            } else if (vt <= ctx.vDampener) {
                ctx.t1 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                ctx.t2 = timeOnFundingCurve(ctx.vDampener, v0, _lastPremium);
                acc = ctx.vLimit.mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, ctx.t2, v0, _lastPremium));
                acc = acc.add(ctx.vDampener.mul(-ctx.t2));
            } else if (vt <= ctx.vLimit) {
                ctx.t1 = timeOnFundingCurve(ctx.vLimit, v0, _lastPremium);
                acc = ctx.vLimit.mul(ctx.t1);
                acc = acc.add(integrateOnFundingCurve(ctx.t1, n, v0, _lastPremium));
                acc = acc.sub(ctx.vDampener.mul(n));
            } else {
                acc = ctx.vLimit.sub(ctx.vDampener).mul(n);
            }
        }
    } // getAccumulatedFunding

}
