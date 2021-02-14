const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require("MockToken")
const AMM = artifacts.require('AMM');

const { setupSystem, infinity } = require("./helpers/Utils")

contract('AMM', accounts => {

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

    

})