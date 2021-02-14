const MockSafeMath = artifacts.require("MockSafeMath")

// Testing fixed-point wmul() & wdiv that been added to SafeMath library

contract('SafeMath', accounts => {

    let instance

    before(async () => {
        instance = await MockSafeMath.new();
    });

    it('basic wmul', async () => {
        const result1 = await instance.wmul(0, web3.utils.toWei("1"))
        assert.equal( result1, 0 )
        const result2 = await instance.wmul(web3.utils.toWei("1"), web3.utils.toWei("1"))
        assert.equal( result2, web3.utils.toWei("1") )
        const result3 = await instance.wmul(web3.utils.toWei("2"), web3.utils.toWei("1"))
        assert.equal( result3, web3.utils.toWei("2") )
    });

    it('basic wdiv', async () => {

        const result1 = await instance.wdiv(0, web3.utils.toWei("1"))
        assert.equal( result1, 0 )
        const result2 = await instance.wdiv(web3.utils.toWei("2"), web3.utils.toWei("1"))
        assert.equal( result2, web3.utils.toWei("2") )
        const result3 = await instance.wdiv(web3.utils.toWei("1"), web3.utils.toWei("2"))
        assert.equal( result3, web3.utils.toWei("0.5") )

    });

    it('division by zero fails', async () => {

        try {
            await instance.wdiv(web3.utils.toWei("1"), 0 )
        } catch (e) {
            assert.ok(e.message.includes("invalid opcode"));
        }

    });


})