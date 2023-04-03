// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Safe.sol";
import "./SafeProxy.sol";

contract Safefactory{
    //bytes32 private constant CURRENT_ADDRESS = bytes32(uint(keccak256("Store.current.address")) - 1);
    //address public SAFE_ADDRESS;
    address public proxy_address;
    address public current_address; 
    address public owner;
    //address public newimp;

    constructor(){
        owner=msg.sender;
    }

    function deploySafe()public returns(address) {
        Safe safe = new Safe(msg.sender);
        //SAFE_ADDRESS = address(safe);
        //StorageSlot.getAddressSlot(CURRENT_ADDRESS).value = address(safe);
        current_address=address(safe);
        return address(safe);////////where??????????/
    }    

    function deploySafeProxy()public returns(address){
        SafeProxy safeproxy = new SafeProxy(msg.sender, current_address);
        //SafeProxy safeproxy = new SafeProxy(msg.sender,StorageSlot.getAddressSlot(CURRENT_ADDRESS).value );
        //require(current_address!=address(0),"haven't deploy imp yet");/////////not checked
        proxy_address=address(safeproxy);
        return address(safeproxy);
    }

    function updateImplementation(address newImp) public{
        require(msg.sender==owner,"NOT owner!");
        //StorageSlot.getAddressSlot(CURRENT_ADDRESS).value =newImp;
        current_address=newImp;
    }
}