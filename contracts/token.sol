// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Ptc is ERC20 {
    constructor() ERC20('PTC', 'PeTeCoin') {
         _mint(msg.sender, 5000);
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}