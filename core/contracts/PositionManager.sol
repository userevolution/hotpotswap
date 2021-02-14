pragma solidity ^0.6.0;  

import "./utility/SafeMath.sol";
import "./utility/Lockable.sol";
import "./utility/Ownable.sol";
import "./utility/Whitelist.sol";
import "./utility/SafeERC20.sol";
import "./utility/LibMathSigned.sol";
import "./utility/Types.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IAMM.sol";
import "./interfaces/IExpandedIERC20.sol";
import "./interfaces/IPositionManager.sol";
import "./interfaces/IPriceFeeder.sol";
import "./TokenFactory.sol";

contract PositionManager is Lockable, Whitelist, IPositionManager {
    using SafeMath for uint256;
    using LibMathSigned for int256;
    using SafeERC20 for IERC20;

    

    // Maps sponsor addresses to their positions. Each sponsor can have only one position.
    mapping(address => Types.PositionData) public positions;

    // Keep track of the total collateral and tokens across all positions
    uint256 public totalTokensOutstanding;
    // Keep track of the raw collateral across all positions
    int256 public rawTotalPositionCollateral;
    // Price feeder contract.
    IPriceFeeder public priceFeeder;
    // The collateral currency used to back the positions in this contract.
    IERC20 public collateralCurrency;
    // AMM address
    IAMM public amm;
    // pause state
    bool public paused = false;
    // withdraw disabled state
    bool public withdrawDisabled = false;
    // Status of perpetual
    Types.Status public status;
    // Total size
    uint256[3] internal totalSizes;
    // Socialloss
    int256[3] internal socialLossPerContracts;
    // Scaler helps to convert decimals
    int256 internal scaler;
    // Settment price replacing index price in settled status
    uint256 public settlementPrice;

    // Adjustable params
    uint256 public initialMarginRate = 100000000000000000; // 10%
    uint256 public maintenanceMarginRate = 50000000000000000; // 5%
    uint256 public liquidationPenaltyRate = 5000000000000000; // 0.5%
    uint256 public penaltyFundRate = 5000000000000000; // 0.5%
    int256 public takerDevFeeRate = 10000000000000000; // 1%
    int256 public makerDevFeeRate = 10000000000000000; // 1%
    uint256 public lotSize = 1;
    uint256 public tradingLotSize = 1;


    event CreatedPerpetual();
    event Paused(address indexed caller);
    event Unpaused(address indexed caller);
    event Deposit(address indexed trader, uint256 collateralAmount);
    event DisableWithdraw(address indexed caller);
    event EnableWithdraw(address indexed caller);

    // event UpdatePositionAccount(
    //     address indexed trader,
    //     Types.PositionData account,
    //     uint256 perpetualTotalSize,
    //     uint256 price
    // );

    constructor(
        address _collateralAddress,
        address _priceFeederAddress
    ) public nonReentrant() {
        priceFeeder = IPriceFeeder(_priceFeederAddress);
        collateralCurrency = IERC20(_collateralAddress);

        addAddress(msg.sender);

        emit CreatedPerpetual();
    }

    function pause() external onlyWhitelisted() {
        require(!paused, "already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyWhitelisted() {
        require(paused, "not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    function disableWithdraw() external onlyWhitelisted() {
        require(!withdrawDisabled, "already disabled");
        withdrawDisabled = true;
        emit DisableWithdraw(msg.sender);
    }

    function enableWithdraw() external onlyWhitelisted() {
        require(withdrawDisabled, "not disabled");
        withdrawDisabled = false;
        emit EnableWithdraw(msg.sender);
    }

    function setupAmm(address ammAddress) external onlyWhitelisted() {
        amm = IAMM(ammAddress);
        addAddress(ammAddress);
    }
    

    function deposit(uint256 collateralAmount) external {
        depositImplementation(msg.sender, collateralAmount);
    }

    function withdraw(uint256 collateralAmount) external {
        withdrawImplementation(msg.sender, collateralAmount);
    }

    function depositFor(address trader, uint256 collateralAmount)
        external
        onlyWhitelisted()
    {
        depositImplementation(trader, collateralAmount);
    }

    function totalSize(Types.Side side) public view returns (uint256) {
        return totalSizes[uint256(side)];
    }

    function socialLossPerContract(Types.Side side) public view returns (int256) {
        return socialLossPerContracts[uint256(side)];
    }

    function isSafeWithPrice(address trader, uint256 currentMarkPrice) public returns (bool) {
        return
            _marginBalanceWithPrice(trader, currentMarkPrice) >=
            _maintenanceMarginWithPrice(trader, currentMarkPrice).toInt256();
    }

    function depositImplementation(address trader, uint256 collateralAmount)
        internal
        onlyNotPaused()
        nonReentrant()
    {
        _checkDepositingParameter(collateralAmount);
        require(collateralAmount > 0, "amount must be greater than 0");
        require(trader != address(0), "cannot deposit to 0 address");

        Types.PositionData storage positionData = positions[trader];

        // Increase the position and global collateral balance by collateral amount.
        _incrementCollateralBalances(positionData, collateralAmount);

        emit Deposit(trader, collateralAmount);

        // FIXME: Use safeTransferFrom
        collateralCurrency.transferFrom(trader, address(this), collateralAmount);
    }

    function withdrawImplementation(address trader, uint256 collateralAmount) internal onlyNotPaused() nonReentrant() ammRequired() {
        require(!withdrawDisabled, "withdraw disabled");
        require(status == Types.Status.NORMAL, "wrong perpetual status");
        require(collateralAmount > 0, "amount must be greater than 0");
        require(trader != address(0), "cannot withdraw to 0 address");

        Types.PositionData storage positionData = positions[trader];

        uint256 currentMarkPrice = markPrice();
        require(isSafeWithPrice(trader, currentMarkPrice), "unsafe before withdraw");

        require(collateralAmount.toInt256() <= positionData.rawCollateral, "insufficient balance");
        
        _remargin(trader, currentMarkPrice);
        _decrementCollateralBalances(positionData, collateralAmount);

        require(isSafeWithPrice(trader, currentMarkPrice), "unsafe after withdraw");
        require(_availableMarginWithPrice(trader, currentMarkPrice) >= 0, "withdraw margin");

        // FIXME: Use safeTransferFrom
        collateralCurrency.transfer(trader, collateralAmount);
    }

    function markPrice() public ammRequired() returns (uint256) {
        return status == Types.Status.NORMAL ? amm.currentMarkPrice() : settlementPrice;
    }

    function totalRawCollateral(address trader)
        public
        view
        returns (int256 collateralAmount)
    {
        Types.PositionData storage positionData = positions[trader];
        return positionData.rawCollateral;
    }

    /****************************************
     *          INTERNAL FUNCTIONS          *
     ****************************************/

    // Check if system is current paused.
    modifier onlyNotPaused() {
        require(!paused, "system paused");
        _;
    }

    // Check if amm address is set.
    modifier ammRequired() {
        require(address(amm) != address(0), "no automated market maker is set");
        _;
    }

    modifier onlyCollateralizedPosition(address trader) {
        _onlyCollateralizedPosition(trader);
        _;
    }

    function _onlyCollateralizedPosition(address trader) internal view {
        require(
            (positions[trader].rawCollateral) > 0,
            "Position has no collateral"
        );
    }

    function _checkDepositingParameter(uint256 collateralAmount) internal view {
        bool isToken = _isTokenizedCollateral();
        require(msg.value == 0, "allow erc20 only");
        require((isToken && msg.value == 0) || (!isToken && msg.value == collateralAmount), "incorrect sent value");
    }

    function _isTokenizedCollateral() internal view returns (bool) {
        return address(collateralCurrency) != address(0);
    }

    function _incrementCollateralBalances(
        Types.PositionData storage positionData,
        uint256 collateralAmount
    ) internal {
        positionData.rawCollateral = positionData.rawCollateral.add(
            collateralAmount.toInt256()
        );
        rawTotalPositionCollateral = rawTotalPositionCollateral.add(
            collateralAmount.toInt256()
        );
    }

    function _decrementCollateralBalances(
        Types.PositionData storage positionData,
        uint256 collateralAmount
    ) internal {
        positionData.rawCollateral = positionData.rawCollateral.sub(collateralAmount.toInt256());
        rawTotalPositionCollateral = rawTotalPositionCollateral.sub(collateralAmount.toInt256());
    }

    function _availableMarginWithPrice(address trader, uint256 markPrice) internal returns (int256) {
        int256 marginBalance = _marginBalanceWithPrice(trader, markPrice);
        int256 margin = _marginWithPrice(trader, markPrice).toInt256();
        return marginBalance.sub(margin);
    }

    function _calculatePnl(Types.PositionData storage account, uint256 tradePrice, uint256 amount)
        internal
        returns (int256)
    {
        if (account.size == 0) {
            return 0;
        }
        int256 p1 = tradePrice.wmul(amount).toInt256();
        int256 p2;
        if (amount == account.size) {
            p2 = account.entryValue.toInt256();
        } else {
            p2 = account.entryValue.wfrac(amount, account.size).toInt256();
        }
        int256 profit = account.side == Types.Side.LONG ? p1.sub(p2) : p2.sub(p1);
        // prec error
        if (profit != 0) {
            profit = profit.sub(1);
        }
        int256 loss1 = _socialLossWithAmount(account, amount);
        int256 loss2 = _fundingLossWithAmount(account, amount);
        return profit.sub(loss1).sub(loss2);
    }

    function _marginBalanceWithPrice(address trader, uint256 markPrice) internal returns (int256) {
        return positions[trader].rawCollateral.add(_pnlWithPrice(trader, markPrice));
    }

    function _maintenanceMarginWithPrice(address trader, uint256 markPrice) internal view returns (uint256) {
        return positions[trader].size.wmul(markPrice).wmul(maintenanceMarginRate);
    }

    function _marginWithPrice(address trader, uint256 markPrice) internal view returns (uint256) {
        return positions[trader].size.wmul(markPrice).wmul(initialMarginRate);
    }

    function _pnlWithPrice(address trader, uint256 markPrice) internal returns (int256) {
        Types.PositionData storage account = positions[trader];
        return _calculatePnl(account, markPrice, account.size);
    }

    function _socialLossWithAmount(Types.PositionData storage account, uint256 amount)
        internal
        view
        returns (int256)
    {
        if (amount == 0) {
            return 0;
        }
        int256 loss = socialLossPerContract(account.side).wmul(amount.toInt256());
        if (amount == account.size) {
            loss = loss.sub(account.entrySocialLoss);
        } else {
            // loss = loss.sub(account.entrySocialLoss.wmul(amount).wdiv(account.size));
            loss = loss.sub(account.entrySocialLoss.wfrac(amount.toInt256(), account.size.toInt256()));
            // prec error
            if (loss != 0) {
                loss = loss.add(1);
            }
        }
        return loss;
    }

    function _fundingLossWithAmount(Types.PositionData storage account, uint256 amount) internal returns (int256) {
        if (amount == 0) {
            return 0;
        }
        int256 loss = amm.currentAccumulatedFundingPerContract().wmul(amount.toInt256());
        if (amount == account.size) {
            loss = loss.sub(account.entryFundingLoss);
        } else {
            // loss = loss.sub(account.entryFundingLoss.wmul(amount.toInt256()).wdiv(account.size.toInt256()));
            loss = loss.sub(account.entryFundingLoss.wfrac(amount.toInt256(), account.size.toInt256()));
        }
        if (account.side == Types.Side.SHORT) {
            loss = loss.neg();
        }
        if (loss != 0 && amount != account.size) {
            loss = loss.add(1);
        }
        return loss;
    }

    

    function _remargin(address trader, uint256 markPrice) internal {
        Types.PositionData storage account = positions[trader];
        if (account.size == 0) {
            return;
        }
        int256 rpnl = _calculatePnl(account, markPrice, account.size);
        account.rawCollateral = account.rawCollateral.add(rpnl);
        account.entryValue = markPrice.wmul(account.size);
        account.entrySocialLoss = socialLossPerContract(account.side).wmul(account.size.toInt256());
        account.entryFundingLoss = amm.currentAccumulatedFundingPerContract().wmul(account.size.toInt256());
        // emit UpdatePositionAccount(trader, account, totalSize(account.side), markPrice);
    }

}
