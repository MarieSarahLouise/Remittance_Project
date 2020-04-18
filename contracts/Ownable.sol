pragma solidity ^0.5.0;

contract Ownable {

    address private owner;

    event LogChangedOwner(address indexed oldOwner, address indexed newOwner);
    constructor() public { owner = msg.sender; }

    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only the owner can call this function."
        );
        _;
    }

    function changedOwner(address newOwner) public onlyOwner {
        require (newOwner != address(0x0), "You need to pass a valid address");
        owner = newOwner;
        emit LogChangedOwner(msg.sender, newOwner);
    }

    function getOwner() public view returns(address _owner) {
        return owner;
    }

}