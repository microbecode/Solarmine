pragma solidity ^0.8.0;

import "./token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("", "") {
        _mint(_msgSender(), 100);
    }

    function a() public {}
}
