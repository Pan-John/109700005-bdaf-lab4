// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SafeUpgradeable{
    address public owner;
    bool private isInitialized=false;

    // Set the owner once and only once.
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
            _balances[msg.sender][token] += (amount * 999/1000);
            fee[token] += (amount * 1/1000);
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        else{
            _balances[msg.sender][token] += amount-1;
            fee[token] += 1;
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    function withdraw(address token, uint256 amount) public {// don't need to change
        require(_balances[msg.sender][token] >= amount, "Insufficent balance!");// not needed in 0.8.0 cuz safemath
        _balances[msg.sender][token] -= amount;
        ERC20(token).transfer(msg.sender, amount);
    }
}