const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require("MockToken")
const AMM = artifacts.require('AMM');

const { setupSystem, infinity } = require("./helpers/Utils")

contract('Perpetual', accounts => {

    const admin = accounts[0]
    const alice = accounts[1]
    const bob = accounts[1]

    let perpetualInstance
    let mockTokenInstance
    let ammInstance

    before(async () => {

        const { tokenFactoryAddress, mockTokenAddress, priceFeederAddress } = await setupSystem(accounts)

        mockTokenInstance = await MockToken.at(mockTokenAddress)

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

    it('can deposit and withdraw on Perpetual contract', async () => {

        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: admin })
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: alice })
        await mockTokenInstance.approve(perpetualInstance.address, infinity, { from: bob })
        await perpetualInstance.deposit(web3.utils.toWei("1100"), { from: alice })

        const collateralAmountAlice = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(collateralAmountAlice, web3.utils.toWei("1100"))

        // Only admin can proceed DepositFor()
        try {
            await perpetualInstance.depositFor(alice, web3.utils.toWei("500"), { from: bob })
        } catch (error) {
            assert.ok(error.message.includes("caller is not the owner"));
        }

        await perpetualInstance.depositFor(alice, web3.utils.toWei("500"), { from: admin })
        const collateralAmountAlice2 = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(collateralAmountAlice2, web3.utils.toWei("1600"))

        await perpetualInstance.withdraw(web3.utils.toWei("600"), { from: alice })

        const collateralAmountAlice3 = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(collateralAmountAlice3, web3.utils.toWei("1000"))

        // Only admin can proceed WithdrawFor()
        try {
            await perpetualInstance.withdrawFor(alice, web3.utils.toWei("100"), { from: bob })
        } catch (error) {
            assert.ok(error.message.includes("caller is not the owner"));
        }
        await perpetualInstance.withdrawFor(alice, web3.utils.toWei("100"), { from: admin })
        const collateralAmountAlice4 = await perpetualInstance.totalRawCollateral(alice)
        assert.equal(collateralAmountAlice4, web3.utils.toWei("900"))

    });


})