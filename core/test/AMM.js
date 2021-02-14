const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require("MockToken")
const PriceFeeder = artifacts.require("PriceFeeder")
const AMM = artifacts.require('AMM');

const { setupSystem, infinity } = require("./helpers/Utils")

contract('AMM', accounts => {

    const admin = accounts[0]
    const alice = accounts[1]
    const bob = accounts[1]

    let perpetualInstance
    let mockTokenInstance
    let ammInstance
    let priceFeederInstance

    before(async () => {

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

    });

    it('can execute depositAndBuy & depositAndSell ', async () => {

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



})