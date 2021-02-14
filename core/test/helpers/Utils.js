const MockToken = artifacts.require("MockToken")
const TokenFactory = artifacts.require('TokenFactory')
const PriceFeeder = artifacts.require('PriceFeeder');



const web3 = require("web3")

module.exports.infinity = '9999999999999999999999999999'

module.exports.setupSystem = async (accounts) => {

    const admin = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]

    const tokenFactory = await TokenFactory.new({ from: admin })
    const mock = await MockToken.new("Stablecoin", "COIN", { from: admin })
    const priceFeeder = await PriceFeeder.new({ from: admin });

    await mock.transfer(alice, web3.utils.toWei("10000"))
    await mock.transfer(bob, web3.utils.toWei("10000"))

    return {
        tokenFactoryAddress: tokenFactory.address,
        mockTokenAddress: mock.address,
        priceFeederAddress: priceFeeder.address
    }

}