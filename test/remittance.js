const Remittance = artifacts.require("Remittance");
const assert = require("assert");
const chai = require("chai");
const truffleAssert = require("truffle-assertions");
const { toWei, toBN } = web3.utils;


contract("Remittance", (accounts) => {
   
    const [alice, carol, notOwner] = accounts;
    let contractInstance;
     beforeEach("create new instance", async function() {
        contractInstance = await Remittance.new( { from: alice } );
    });

    it("Remit should not work if you send no value.", async function(){
        await truffleAssert.reverts(
            contractInstance.remit(carol, { from: alice, value: 0 }), 
            "You need to send value.")
    });

    it("Only the owner can call remit.", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        await truffleAssert.reverts(
            contractInstance.remit(carol, { from: notOwner, value: amount }), 
            "Only the owner can call this function.")
    });

    it("Remit emits the proper event", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        const remitObj = await contractInstance.remit(carol, { from: alice, value: amount});
        const { logs } = remitObj;
        assert.strictEqual(logs.length, 1);
        const remitEvent = remitObj.logs[0];
        assert.strictEqual(remitEvent.event, "LogAmountSent");
        assert.strictEqual(remitEvent.args.from, alice);
        assert.strictEqual(remitEvent.args.carol, carol);
        assert.strictEqual(remitEvent.args.amount.toString(), amount.toString());
    });

    it("Carols internal balance after remit should be right.", async function() {
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.remit(carol, { from: alice, value: amount});
        const balanceAfter = await contractInstance.getBalance(carol);
        assert.strictEqual(balanceAfter.toString(), amount.toString());
    });

    it("Carols internal balance after withdraw should be 0.", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await contractInstance.remit(carol, { from: alice, value: amount });
        
        await contractInstance.withdraw("0x123", "0x456", { from: carol });
        const carolsBalance = await contractInstance.getBalance(carol);
        assert.strictEqual(carolsBalance.toString(), "0");
    });

    it("Withdraw should emit the expected event.", async function() {
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await contractInstance.remit(carol, { from: alice, value: amount });
        const withdrawObj = await contractInstance.withdraw("0x123", "0x456", { from: carol });
        const { logs } = withdrawObj;
        assert.strictEqual(logs.length, 1);
        const withdrawEvent = withdrawObj.logs[0];
        assert.strictEqual(withdrawEvent.event, "LogAmountWithdrawn", "The right event was not emitted.");
        assert.strictEqual(withdrawEvent.args.from, carol, "Carols address is not right.");
        assert.strictEqual(withdrawEvent.args.amount.toString(), amount.toString(), "The right amount was not emitted.");
    });

    it("Withdraw should not work if Bobs password is wrong.", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await contractInstance.remit(carol, { from: alice, value: amount });
        await truffleAssert.reverts(
            contractInstance.withdraw("0x321", "0x456", { from: carol }), 
            "Bobs password is incorrect!");
    });
    
    it("Withdraw should not work if Carols password is wrong.", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await contractInstance.remit(carol, { from: alice, value: amount });
        await truffleAssert.reverts(
            contractInstance.withdraw("0x123", "0x654", { from : carol}), 
            "Carols password is incorrect!");
    });

    it("Withdraw should not work if remit() hasn't been called before.", async function(){
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await truffleAssert.reverts(
            contractInstance.withdraw("0x123", "0x456", { from: carol}), 
            "You don't have funds to withdraw!");
    });

    it("Carols balance should not be reset after each remit.", async function(){
        const amount1 = toWei(toBN("1"), "Gwei");
        const amount2 = toWei(toBN("2"), "Gwei");
        await contractInstance.remit(carol, { from: alice, value: amount1 });
        await contractInstance.remit(carol, { from: alice, value: amount2 });
        const carolsBalance = await contractInstance.getBalance(carol);

        assert.strictEqual(carolsBalance.toString(), toBN(amount1).add(toBN(amount2)).toString());
        
    });

    it("Carols balance after withdraw should be right.", async function(){
        const amount = toWei(toBN("1"), "Gwei");
        const balanceBefore = await web3.eth.getBalance(carol);
        await contractInstance.makePasswords("0x123", "0x456", { from: alice });
        await contractInstance.remit(carol, { from: alice, value: amount });
        const txObj = await contractInstance.withdraw("0x123", "0x456", { from: carol })
        const tx = await web3.eth.getTransaction(txObj.tx);
        const receipt = txObj.receipt;
        const balanceAfter = await web3.eth.getBalance(carol);
        const gasCost = toBN(tx.gasPrice).mul(toBN(receipt.gasUsed));
        const expectedBalanceAfter = toBN(balanceBefore).sub(toBN(gasCost)).add(toBN(amount));

        assert.strictEqual(balanceAfter.toString(), expectedBalanceAfter.toString());
    });

    it("Remittance should start un-paused.", async function(){
        chai.assert.isFalse(await contractInstance.isPaused());
    });
});
