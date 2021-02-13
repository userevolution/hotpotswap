const TokenFactory = artifacts.require('TokenFactory');
const SyntheticToken = artifacts.require("SyntheticToken")



contract('TokenFactory', accounts => {


    it('verify that the token being created is ok', async () => {
        const tokenFactory = await TokenFactory.new();

        const tx = await tokenFactory.createToken("Test Token", "TEST", 18)

        const tokenAddress = tx.logs[0].args['tokenAddress']
        const testToken = await SyntheticToken.at(tokenAddress)
        const name = await testToken.name()
        assert.equal(name, "Test Token")
        const symbol = await testToken.symbol()
        assert.equal(symbol, "TEST")
        const decimals = await testToken.decimals()
        assert.equal(decimals.toString(), "18")

    });

    // TODO : Verify other stuffs

})