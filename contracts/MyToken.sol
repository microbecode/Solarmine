pragma solidity ^0.8.0;

import "./token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract MyToken is ERC20 {
    address[] public tokenHolders;
    mapping(address => bool) internal tokenHolderExists;
    mapping(address => uint256) internal tokenHolderArrayIndex;

    constructor(
        uint256 initialBalance,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _mint(_msgSender(), initialBalance);
        scalableAddTokenHolder(_msgSender());
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        //console.log("transfer of %s", amount);
        if (amount > 0) {
            scalableAddTokenHolder(to);
        }
        if (balanceOf(from) == 0) {
            removeTokenHolder(from);
        }
    }

    // https://ethereum.stackexchange.com/a/12707/31933
    function scalableAddTokenHolder(address tokenHolder) internal {
        //console.log("index %s", tokenHolderIndex[tokenHolder]);
        if (!tokenHolderExists[tokenHolder]) {
            // doesn't exist
            tokenHolders.push(tokenHolder);
            tokenHolderExists[tokenHolder] = true;
            tokenHolderArrayIndex[tokenHolder] = tokenHolders.length - 1;
        }
    }

    function removeTokenHolder(address tokenHolder) internal {
        if (tokenHolderExists[tokenHolder]) {
            // exists

            address lastHolder = tokenHolders[tokenHolders.length - 1];
            // Move the last entry to replace this entry
            tokenHolders[tokenHolderArrayIndex[tokenHolder]] = lastHolder;
            tokenHolders.pop(); // remove last entry

            // Update index for the moved holder
            tokenHolderArrayIndex[lastHolder] = tokenHolderArrayIndex[
                tokenHolder
            ];

            // Remove index
            delete tokenHolderArrayIndex[tokenHolder];
            // Mark as non-existing
            tokenHolderExists[tokenHolder] = false;
        }
    }

    function getHolders() public view returns (address[] memory) {
        return tokenHolders;
    }
}
