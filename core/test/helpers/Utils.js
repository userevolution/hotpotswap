const MockToken = artifacts.require("MockToken")
const TokenFactory = artifacts.require('TokenFactory')
const PriceFeeder = artifacts.require('PriceFeeder');

// const Web3 = require('web3');

module.exports.infinity = '9999999999999999999999999999'

module.exports.setupSystem = async (accounts) => {

    const admin = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]

    const tokenFactory = await TokenFactory.new({ from: admin })
    const mock = await MockToken.new("Stablecoin", "COIN", { from: admin })
    const priceFeeder = await PriceFeeder.new("Down Jones Index",{ from: admin });

    await mock.transfer(alice, web3.utils.toWei("10000"))
    await mock.transfer(bob, web3.utils.toWei("10000"))

    return {
        tokenFactoryAddress: tokenFactory.address,
        mockTokenAddress: mock.address,
        priceFeederAddress: priceFeeder.address
    }

}


module.exports.increaseEvmBlock = async () => {
    
    const id = Date.now() + Math.floor(Math.random() * 100000000);
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: id,
        }, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}