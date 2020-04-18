pragma solidity ^0.5.0;

import "./Pausable.sol";

contract Killable is Pausable {

    event LogKilled(address indexed sender);
    event LogReturnFunds(address indexed sender, uint256 amount);
    
    bool private killed;

    constructor() public {}

    modifier whenKilled() {
        require(killed, "The contract is still running.");
        _;
    }

    modifier whenAlive() {
        require(!killed, "The contract has already been killed.");
        _;
    }

    function isKilled() public view returns(bool _killed) {
        return killed;
    }
     
    function kill() public onlyOwner whenPaused whenAlive {
        killed = true;
        emit LogKilled(msg.sender);
    }

    function returnTheFunds() external onlyOwner whenKilled {
        require(address(this).balance != 0, "No value in the contract");
        emit LogReturnFunds(msg.sender, address(this).balance);
        (bool success, ) = msg.sender.call.value(address(this).balance)("");
        require(success, "Refund failed");
    }
}