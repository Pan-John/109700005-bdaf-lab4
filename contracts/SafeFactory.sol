// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Safe.sol";
import "./SafeProxy.sol";

contract Safefactory{
    address public owner;

    // Constructor function to set the owner of the contract
    constructor(){
        owner=msg.sender;
    }

    // save Safe contract address
    address public safe_address; 

    // save Proxy contract address
    address public proxy_address;

    // deploy Safe contract
    function deploySafe()public returns(address) {

        // set the owner as the deploySafe's caller
        Safe safe = new Safe(msg.sender);
        
        // store the address and return it 
        safe_address=address(safe);
        return address(safe);
    }    

    // deploy Proxy contract
    function deploySafeProxy()public returns(address){
        
        //set the owner as the deploySafe's caller, point it to current Safe contract address
        SafeProxy safeproxy = new SafeProxy(msg.sender, safe_address);

        // store the address and return it 
        proxy_address=address(safeproxy);
        return address(safeproxy);
    }

    // update the implementation address
    function updateImplementation(address newImp) public{

        // only owner can update
        require(msg.sender==owner,"NOT owner!");

        // set safe_address as new implementation's address
        safe_address=newImp;
    }
}
