pragma solidity ^0.8.0;

import "./token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract MyToken is ERC20 {
    address[] public tokenHolders;
    mapping(address => bool) internal tokenHolderKnown;

    constructor() ERC20("", "") {
        _mint(_msgSender(), 10000);
        scalableAddTokenHolder(_msgSender());
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        console.log("transfer of %s", amount);
        scalableAddTokenHolder(to);
    }

    // https://ethereum.stackexchange.com/a/12707/31933
    function scalableAddTokenHolder(address tokenHolder) internal {
        if (!tokenHolderKnown[tokenHolder]) {
            tokenHolders.push(tokenHolder);
            tokenHolderKnown[tokenHolder] = true;
        }
    }
}
