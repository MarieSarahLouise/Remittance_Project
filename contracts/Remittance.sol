pragma solidity ^0.5.0;

import "./Killable.sol";
import "./SafeMath.sol";

contract Remittance is Killable {

    mapping (address => uint) public balances;
    event LogAmountSent(address indexed from, address indexed carol, uint256 amount);
    event LogAmountWithdrawn(address indexed from, uint256 amount);
    bytes32 public alicesPassword1;
    bytes32 public alicesPassword2;
    using SafeMath for uint256; 

    constructor() public {} 

    function makePasswords(bytes32 password1, bytes32 password2) public whenRunning whenAlive onlyOwner returns(bytes32 _alicesPassword1, bytes32 _alicesPassword2) {
        alicesPassword1 = keccak256(abi.encodePacked(password1));
        alicesPassword2 = keccak256(abi.encodePacked(password2));

        return (alicesPassword1, alicesPassword2);
    }

    function remit(address carol) public payable whenRunning whenAlive onlyOwner returns(bool success) {
        require(msg.value != 0, "You need to send value.");
        require(carol != address(0x0), "You need to pass a valid address.");
        uint256 amount = msg.value;

        balances[carol] = balances[carol].add(amount);
        emit LogAmountSent(msg.sender, carol, amount);

        return true;
    }

    function withdraw(bytes32 passwordBob, bytes32 passwordCarol) public whenRunning whenAlive returns(bool success) {
        uint256 toWithdraw = balances[msg.sender];
        require(toWithdraw != 0, "You don't have funds to withdraw!");
        bytes32 _passwordBob = keccak256(abi.encodePacked(passwordBob)); 
        bytes32 _passwordCarol = keccak256(abi.encodePacked(passwordCarol));
        require(_passwordBob == alicesPassword1, "Bobs password is incorrect!");
        require(_passwordCarol == alicesPassword2, "Carols password is incorrect!");
        
        balances[msg.sender] = 0;
        emit LogAmountWithdrawn(msg.sender, toWithdraw);

        (success, ) = msg.sender.call.value(toWithdraw)("");
        require(success, "No value was transfered to your account.");
    }

    function getBalance(address _key) public view returns(uint) {
        return balances[_key];
    }

}