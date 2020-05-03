pragma solidity ^0.5.0;

import "./Killable.sol";
import "./SafeMath.sol";

contract Remittance is Killable {

    mapping (address => uint) public balances;
    event LogAmountSent(address indexed from, address indexed carol, uint256 amount);
    event LogAmountWithdrawn(address indexed from, uint256 amount);
    using SafeMath for uint256; 
    bytes32 hashedPassword1; 
    bytes32 hashedPassword2;
    constructor() public {} 

    function makePasswords(bytes32 plainPassword1, bytes32 plainPassword2) public view whenRunning whenAlive onlyOwner returns(bytes32 _hashedPassword1, bytes32 _hashedPassword2) {
        return (keccak256(abi.encodePacked(plainPassword1)), keccak256(abi.encodePacked(plainPassword2)));
    }

    function remit(address carol, bytes32 _hashedPassword1, bytes32 _hashedPassword2) public payable whenRunning whenAlive onlyOwner returns(bool success) {
        require(msg.value != 0, "You need to send value.");
        require(carol != address(0x0), "You need to pass a valid address.");

        hashedPassword1 = _hashedPassword1;
        hashedPassword2 = _hashedPassword2; 

        uint256 amount = msg.value;

        balances[carol] = balances[carol].add(amount);
        emit LogAmountSent(msg.sender, carol, amount);

        return true;
    }

    function withdraw(bytes32 plainPasswordBob, bytes32 plainPasswordCarol) public whenRunning whenAlive returns(bool success) {
        uint256 toWithdraw = balances[msg.sender];
        require(toWithdraw != 0, "You don't have funds to withdraw!");

        bytes32 hashedPasswordBob = keccak256(abi.encodePacked(plainPasswordBob)); 
        bytes32 hashedPasswordCarol = keccak256(abi.encodePacked(plainPasswordCarol));
        
        require(hashedPasswordBob == hashedPassword1, "Bobs password is incorrect!");
        require(hashedPasswordCarol == hashedPassword2, "Carols password is incorrect!");
        
        balances[msg.sender] = 0;
        emit LogAmountWithdrawn(msg.sender, toWithdraw);

        (success, ) = msg.sender.call.value(toWithdraw)("");
        require(success, "No value was transfered to your account.");
    }
}