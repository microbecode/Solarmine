// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../MyToken.sol";

// mock class using ERC20, used by unit tests. Don't deploy in a real network
contract MyTokenMock is MyToken {
    constructor(uint256 initialBalance)
        payable
        MyToken(initialBalance, "Solarmine", "SM")
    {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function transferInternal(
        address from,
        address to,
        uint256 value
    ) public {
        _transfer(from, to, value);
    }

    function approveInternal(
        address owner,
        address spender,
        uint256 value
    ) public {
        _approve(owner, spender, value);
    }
}
