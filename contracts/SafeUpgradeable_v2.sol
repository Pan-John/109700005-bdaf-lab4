// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract is almost same as SafeUpgradeable, it is meant to let proxy test if it can update implementation
// the only difference is that the tax rate changes to 0.2%
contract SafeUpgradeable_v2{
    address public owner;
    bool public isInitialized=false;

    function initialize(address caller) public {
        require(!isInitialized, "already initialized");
        isInitialized = true;
        owner = caller;
    }

    mapping(address => mapping(address => uint256)) public _balances;
    mapping(address => uint256) public fee;

    function takeFee(address token) public {
        require(msg.sender==owner,"NOT owner!");
        ERC20(token).transfer(msg.sender, fee[token]);
        fee[token]=0;
    }

    function deposit(address token, uint256 amount) public {
        if(amount>=1000){
            _balances[msg.sender][token] += (amount * 998/1000);
            fee[token] += (amount * 2/1000);
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        else{
            _balances[msg.sender][token] += amount-2;
            fee[token] += 2;
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    function withdraw(address token, uint256 amount) public {
        require(_balances[msg.sender][token] >= amount, "Insufficent balance!");
        _balances[msg.sender][token] -= amount;
        ERC20(token).transfer(msg.sender, amount);
    }
}
