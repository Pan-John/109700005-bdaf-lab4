// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Safe{
    address public owner;

    // Constructor function to set the owner of the contract
    constructor(address caller){
        owner=caller;
    }

    // Mapping to store the balance of each user for each token
    mapping(address => mapping(address => uint256)) public _balances;

    // Mapping to store the fee collected for each token
    mapping(address => uint256) public fee;

    // Function to allow the owner to take the fee collected for a specific token
    function takeFee(address token) public {
        require(msg.sender==owner,"NOT owner!");
        ERC20(token).transfer(msg.sender, fee[token]);
        fee[token]=0;
    }

    // Function to deposit tokens into the contract
    function deposit(address token, uint256 amount) public {
        
        // If the amount is greater than or equal to 1000, deduct 1% as fee
        if(amount>=1000){
            _balances[msg.sender][token] += (amount * 999/1000);
            fee[token] += (amount * 1/1000);
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        // If the amount is less than 1000, deduct 1 token as fee
        else{
            _balances[msg.sender][token] += amount-1;
            fee[token] += 1;
            ERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

     // Function to allow users to withdraw tokens from the contract
    function withdraw(address token, uint256 amount) public {
        
         // Check if the user has sufficient balance to withdraw the amount
        require(_balances[msg.sender][token] >= amount, "Insufficent balance!");// not needed in 0.8.0 cuz safemath

        // Deduct the amount from the user's balance
        _balances[msg.sender][token] -= amount;

        // Transfer the tokens to the user's address
        ERC20(token).transfer(msg.sender, amount);
    }
}
