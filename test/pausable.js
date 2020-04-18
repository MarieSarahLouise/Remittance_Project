const Remittance = artifacts.require("Remittance");
const assert = require("assert");
const truffleAssert = require("truffle-assertions");
const chai = require("chai");
const { toWei, toBN } = web3.utils;

contract("Remittance", (accounts) => {
   
    const [alice, bob, carol, notOwner] = accounts;
    let contractInstance;
     beforeEach("create new instance", async function() {
        contractInstance = await Remittance.new( { from: alice } );
    });

    it("The contract should be paused when the pause() function is called.", async function() {
        await contractInstance.pause({ from: alice });
        chai.assert.isTrue(await contractInstance.isPaused());
    });

    it("The contract should only be paused by the Owner.", async function() {
        await truffleAssert.reverts(
            contractInstance.pause({ from: notOwner }), 
            "Only the owner can call this function.")
    });

    it("The contract should not be paused twice.", async function(){
        await contractInstance.pause({ from: alice });
        await truffleAssert.reverts(
            contractInstance.pause({ from: alice }), 
            "The contract is paused.")
    });

    /*it("Alice shouldn't be able to send ether when the contract is paused.", async function() {
        const amount = toWei(toBN("1"), "Gwei");
        await contractInstance.pause({ from: alice });
        await truffleAssert.reverts(
            contractInstance.split(bob, carol, { from: alice, value: amount }),
            "The contract is paused."
        );
    });*/

    it("The contract should start again, if the resume function is called.", async function() {
        await contractInstance.pause({ from: alice });
        await contractInstance.resume({ from: alice });
        assert.strictEqual(await contractInstance.isPaused(), false);
    });

    it("Only the ownwe should resume th contract.", async function() {
        await contractInstance.pause({ from: alice });
        await truffleAssert.reverts(
            contractInstance.resume({ from: notOwner }), 
            "Only the owner can call this function.")
    })

});