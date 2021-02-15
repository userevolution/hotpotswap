const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require("MockToken")
const PriceFeeder = artifacts.require("PriceFeeder")
const FundingCalculator = artifacts.require('FundingCalculator');
const AMM = artifacts.require('AMM');

const { setupSystem, infinity } = require("./helpers/Utils")

const Side = {
    FLAT: 0,
    SHORT: 1,
    LONG: 2,
}

contract('AMM', accounts => {

    const admin = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const charlie = accounts[3]

    let perpetualInstance
    let mockTokenInstance
    let ammInstance
    let priceFeederInstance

    const deploy = async () => {
        const { tokenFactoryAddress, mockTokenAddress, priceFeederAddress } = await setupSystem(accounts)

        mockTokenInstance = await MockToken.at(mockTokenAddress)
        priceFeederInstance = await PriceFeeder.at(priceFeederAddress)

        perpetualInstance = await Perpetual.new(
            mockTokenAddress,
            priceFeederAddress,
            {
                from: admin
            })

        ammInstance = await AMM.new(
            "Dow Jones Index Perpetual Share Token",
            "DJI-PERP",
            tokenFactoryAddress,
            priceFeederAddress,
            perpetualInstance.address,
            {
                from: admin
            })

            const fundingCalculator = await FundingCalculator.new(ammInstance.address)
            await ammInstance.setFundingCalculator(fundingCalculator.address)

        await perpetualInstance.setupAmm(ammInstance.address, { from: admin })
    }

    before(async () => {

        await deploy()

    });

    it('can execute depositAndBuy & depositAndSell ', async () => {

        // set index price
        await priceFeederInstance.updateValue(web3.utils.toWei("7000"), { from: admin });
        await priceFeederInstance.confirmValueUpdate({ from: admin });
        const indexPrice = await ammInstance.indexPrice();
        assert.equal(web3.utils.fromWei(indexPrice.price), "7000");

        // Approve
        await mockTokenInstance.transfer(alice, web3.utils.toWei("24000"), { from: admin });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: alice });

        // depositAndBuy
        await ammInstance.depositAndBuy(web3.utils.toWei("1"), 0, web3.utils.toWei("10000"), infinity, { from: alice });
        const collateralAmountAlice = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(web3.utils.fromWei(collateralAmountAlice), "1");

        // depositAndSell
        await ammInstance.depositAndSell(0, 0, 0, infinity, { from: alice });
        await ammInstance.depositAndSell(web3.utils.toWei("1"), 0, 0, infinity, { from: alice });
        const collateralAmountAlice2 = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(web3.utils.fromWei(collateralAmountAlice2), "2");

    })

    it('alice can check her available margin ', async () => {

        // re-deploy all contracts
        await deploy()


        // set index price
        await priceFeederInstance.updateValue(web3.utils.toWei("7000"), { from: admin });
        await priceFeederInstance.confirmValueUpdate({ from: admin });
        const indexPrice = await ammInstance.indexPrice();
        assert.equal(web3.utils.fromWei(indexPrice.price), "7000");

        // Approve
        await mockTokenInstance.transfer(alice, web3.utils.toWei("1470000"), { from: admin });
        await mockTokenInstance.transfer(bob, web3.utils.toWei("24000"), { from: admin });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: alice });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: bob });

        const availableBefore = await ammInstance.currentAvailableMargin.call()
        assert.equal(availableBefore, 0);

        await ammInstance.setAccumulatedFundingPerContract(web3.utils.toWei("50"));

        await perpetualInstance.deposit(web3.utils.toWei("1470000"), { from: alice })
        await ammInstance.createPool(web3.utils.toWei("100"), {
            from: alice
        });
        await perpetualInstance.deposit(web3.utils.toWei("24000"), { from: bob })

        const availableAfter = await ammInstance.currentAvailableMargin.call()
        assert.equal(web3.utils.fromWei(availableAfter), "700000");

    })

    it('verify that AMM being deployed stores correct configuration ', async () => {

        // re-deploy all contracts
        await deploy()


        // set index price
        await priceFeederInstance.updateValue(web3.utils.toWei("7000"), { from: admin });
        await priceFeederInstance.confirmValueUpdate({ from: admin });
        const indexPrice = await ammInstance.indexPrice();
        assert.equal(web3.utils.fromWei(indexPrice.price), "7000");

        // Approve
        await mockTokenInstance.transfer(alice, web3.utils.toWei("21000"), { from: admin });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: alice });

        // Check positions
        await perpetualInstance.deposit(web3.utils.toWei("14700"), { from: alice })
        await ammInstance.createPool(web3.utils.toWei("1"), {
            from: alice
        });

        assert.equal(web3.utils.fromWei(await ammInstance.positionSize()), "1")

        const shareTokenAddress = await ammInstance.shareTokenAddress()
        const shareTokenInstance = await MockToken.at(shareTokenAddress)

        assert.equal(web3.utils.fromWei(await shareTokenInstance.totalSupply()), "1")
        assert.equal(web3.utils.fromWei(await ammInstance.currentAvailableMargin.call()), "7000")

        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionSize(alice)), "1")
        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionSize(perpetualInstance.address)), "1")

        assert.equal(await perpetualInstance.getPositionSide(alice), Side.SHORT)
        assert.equal(await perpetualInstance.getPositionSide(perpetualInstance.address), Side.LONG)

        // Check perpetual
        assert.equal(await perpetualInstance.isSafe.call(alice), true)
        assert.equal(await perpetualInstance.isSafe.call(perpetualInstance.address), true)
        assert.equal(await perpetualInstance.isBankrupt.call(alice), false)
        assert.equal(await perpetualInstance.isBankrupt.call(perpetualInstance.address), false)

        assert.equal(web3.utils.fromWei(await perpetualInstance.availableMargin.call(alice)), "0")
        assert.equal(web3.utils.fromWei(await perpetualInstance.availableMargin.call(perpetualInstance.address)), `${7000 * 2 - 7000 * 0.1}`)  // amm.x

        assert.equal(web3.utils.fromWei(await perpetualInstance.pnl.call(alice)), "0")
        assert.equal(web3.utils.fromWei(await perpetualInstance.pnl.call(perpetualInstance.address)), "0")

        assert.equal(web3.utils.fromWei(await perpetualInstance.totalRawCollateral(alice)), `${7000 * 0.1}`)
        assert.equal(web3.utils.fromWei(await perpetualInstance.totalRawCollateral(perpetualInstance.address)), `${7000 * 2}`)

        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionEntryValue(alice)), `${7000}`)
        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionEntryValue(perpetualInstance.address)), `${7000}`)

        assert.equal(web3.utils.fromWei(await perpetualInstance.positionMargin.call(alice)), "700")
        assert.equal(web3.utils.fromWei(await perpetualInstance.positionMargin.call(perpetualInstance.address)), "700")

        assert.equal(web3.utils.fromWei(await perpetualInstance.maintenanceMargin.call(alice)), "350")
        assert.equal(web3.utils.fromWei(await perpetualInstance.maintenanceMargin.call(perpetualInstance.address)), "350")

    })

    it('can open short/long position ', async () => {
        // re-deploy all contracts
        await deploy()

        // set index price
        await priceFeederInstance.updateValue(web3.utils.toWei("7000"), { from: admin });
        await priceFeederInstance.confirmValueUpdate({ from: admin });
        const indexPrice = await ammInstance.indexPrice();
        assert.equal(web3.utils.fromWei(indexPrice.price), "7000");

        // Approve
        await mockTokenInstance.transfer(alice, web3.utils.toWei(`${7000 * 10 * 2.1}`), { from: admin });
        await mockTokenInstance.transfer(bob, web3.utils.toWei(`${7000 * 3}`), { from: admin });
        await mockTokenInstance.transfer(charlie, web3.utils.toWei(`${7000 * 3}`), { from: admin });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: alice });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: bob });
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: charlie });

        // create amm
        await perpetualInstance.deposit(web3.utils.toWei(`${7000 * 10 * 2.1}`), { from: alice })
        await ammInstance.createPool(web3.utils.toWei("10"), {
            from: alice
        });

        const shareTokenAddress = await ammInstance.shareTokenAddress()
        const shareTokenInstance = await MockToken.at(shareTokenAddress)

        // add and remove liquidity - no position on removing liqudity
        await perpetualInstance.deposit(web3.utils.toWei(`${7000 * 3}`), {
            from: bob
        });
        await ammInstance.addLiquidity(web3.utils.toWei("1"), {
            from: bob
        });

        assert.equal(web3.utils.fromWei(await perpetualInstance.totalRawCollateral(bob)), `${7000}`)
        assert.equal(web3.utils.fromWei(await shareTokenInstance.balanceOf(bob)), "1")

        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionSize(bob)), "1")
        assert.equal(await perpetualInstance.getPositionSide(bob), Side.SHORT)
        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionEntryValue(bob)), `${7000}`)

        // price == 7700
        await ammInstance.buy(web3.utils.toWei("1"), web3.utils.toWei('10000'), infinity, {
            from: bob
        });

        // assert.equal(web3.utils.fromWei(await perpetualInstance.totalRawCollateral(bob)), `${(6300 )}`) //7000 - 700 - 115.5
        assert.equal(web3.utils.fromWei(await shareTokenInstance.balanceOf(bob)), "1")
        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionSize(bob)), "0")
        assert.equal(await perpetualInstance.getPositionSide(bob), Side.FLAT)
        assert.equal(web3.utils.fromWei(await perpetualInstance.getPositionEntryValue(bob)), "0") // trade price * position

        await shareTokenInstance.approve(ammInstance.address, infinity, {
            from: bob
        });
        assert.equal(web3.utils.fromWei(await shareTokenInstance.balanceOf(bob)), "1")
        await ammInstance.removeLiquidity(web3.utils.toWei("1"), {
            from: bob
        });

        // price == 8477.7 * amount == 7707
        // assert.equal(web3.utils.fromWei(await perpetualInstance.totalRawCollateral(bob)), "21700")
        assert.equal(web3.utils.fromWei(await shareTokenInstance.balanceOf(bob)), "0")
        assert.equal(await perpetualInstance.getPositionSide(bob), Side.LONG)

        

    })

})