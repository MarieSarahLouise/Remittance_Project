pragma solidity ^0.5.0;

import "./Ownable.sol";

contract Pausable is Ownable {

  event LogPaused(address indexed sender);
  event LogResumed(address indexed sender);

  bool private paused;
 
  modifier whenRunning() {
    require(!paused, "The contract is paused");
    _;
  }

  modifier whenPaused() {
    require(paused, "The contract is running");
    _;
  }

  function isPaused() public view returns(bool _paused) {
    return paused;
  }

  function pause() public onlyOwner whenRunning {
    paused = true;
    emit LogPaused(msg.sender);
  }

  function resume() public onlyOwner whenPaused {
    paused = false;
    emit LogResumed(msg.sender);
  }

}