const TokenFactory = artifacts.require('TokenFactory')
const PriceFeeder = artifacts.require('PriceFeeder')
const MockToken = artifacts.require("MockToken")
const Perpetual = artifacts.require('Perpetual')
const FundingCalculator = artifacts.require('FundingCalculator');
const AMM = artifacts.require('AMM');

const fs = require("fs");

module.exports = async (deployer, network, accounts) => {



    if (network === "development") {

        const admin = accounts[0]
        const alice = accounts[1]
        const bob = accounts[2]

        // Setup account factory
        await deployer.deploy(TokenFactory, {
            from: admin
        });
        // Setup Colleteral Token
        await deployer.deploy(
            MockToken,
            "Binance USD",
            "BUSD",
            {
                from: admin
            })

        const tokenInstance = await MockToken.at(MockToken.address);
        await tokenInstance.transfer(alice, web3.utils.toWei("20000"), { from: admin })
        await tokenInstance.transfer(bob, web3.utils.toWei("20000"), { from: admin })

        // Setup Oracle
        await deployer.deploy(
            PriceFeeder,
            "Dow Jones Index",
            {
                from: admin
            })

        // Setup Perpetual Contract
        await deployer.deploy(
            Perpetual,
            MockToken.address,
            PriceFeeder.address,
            {
                from: admin
            })

        const perpetualInstance = await Perpetual.at(Perpetual.address)

        // Setup AMM
        await deployer.deploy(
            AMM,
            "Dow Jones Index Perpetual Share Token",
            "DJI-BUSD",
            TokenFactory.address,
            PriceFeeder.address,
            Perpetual.address,
            {
                from: admin
            })

        // Setup Funding Calculator
        await deployer.deploy(
            FundingCalculator,
            AMM.address,
            {
                from: admin
            })

        const ammInstance = await AMM.at(AMM.address);
        await ammInstance.setFundingCalculator(FundingCalculator.address, { from: admin })

        await perpetualInstance.setupAmm(AMM.address, { from: admin })


        await fs.writeFileSync(
            "../client/.env",
`
REACT_APP_COLLATERAL_TOKEN_ADDRESS=${MockToken.address}
REACT_APP_PERPETUAL_ADDRESS=${Perpetual.address}
REACT_APP_AMM_ADDRESS=${AMM.address}
`
        );

    }


}