
const AMM = artifacts.require('AMM');
const PriceFeeder = artifacts.require('PriceFeeder')
const Perpetual = artifacts.require('Perpetual')
const MockToken = artifacts.require('MockToken')

module.exports = async (deployer, network, accounts) => {

    if (network === "development" || network === "kovan") {
        
        const admin = accounts[0]

        const priceFeeder = await PriceFeeder.at(PriceFeeder.address)
        const amm = await AMM.at(AMM.address)
        const perpetual = await Perpetual.at(Perpetual.address)
        const token = await MockToken.at(MockToken.address)

        // set index price
        await priceFeeder.updateValue(web3.utils.toWei("30000"), { from: admin });
        await priceFeeder.confirmValueUpdate({ from: admin });
        
        // create a pool
        await token.approve( perpetual.address , '9999999999999999999999999999', {from :admin})

        // await perpetual.deposit(web3.utils.toWei("700"), { from: admin })
        // await amm.createPool(web3.utils.toWei("0.01"), {
        //     from: admin
        // });

        await perpetual.deposit(web3.utils.toWei("70000"), { from: admin })
        await amm.createPool(web3.utils.toWei("1"), {
            from: admin
        });

        
    }

}