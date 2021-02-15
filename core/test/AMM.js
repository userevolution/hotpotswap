const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require("MockToken")
const PriceFeeder = artifacts.require("PriceFeeder")
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
    const bob = accounts[1]

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

        await ammInstance.setPoolFeeRate(0, { from: admin })
        await ammInstance.setPoolDevFeeRate(0, { from: admin })

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

        await ammInstance.setPoolFeeRate(0, { from: admin })
        await ammInstance.setPoolDevFeeRate(0, { from: admin })

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


})