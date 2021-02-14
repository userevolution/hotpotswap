const PriceFeeder = artifacts.require('PriceFeeder');

let instance;

contract('PriceFeeder' , accounts => {
    before(async () => {
        instance  = await PriceFeeder.new();
    });
        

    it('verifies that the value has been updated', async () => {

        await instance.updateValue((0.5 * 1000000));

        await instance.confirmValueUpdate();

        const value = await instance.getValue();

        assert.equal( value.toNumber() / 1000000 , 0.5);
    });

    it('has timestamp value', async () => {

        const timestamp = await instance.getTimestamp();
        assert.notEqual(Number(timestamp), 0);
    });

})