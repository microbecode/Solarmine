pragma solidity ^0.8.0;

import "./token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract MyToken is ERC20 {
    address[] public tokenHolders;
    mapping(address => uint256) internal tokenHolderIndex; // plus one, to avoid using zero as first index

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
        if (tokenHolderIndex[tokenHolder] == 0) {
            // doesn't exist
            tokenHolders.push(tokenHolder);
            tokenHolderIndex[tokenHolder] = tokenHolders.length;
        }
    }

    function removeTokenHolder(address tokenHolder) internal {
        if (tokenHolderIndex[tokenHolder] > 0) {
            // doesn't exist
            // Move the last entry to replace this entry
            tokenHolders[tokenHolderIndex[tokenHolder] - 1] = tokenHolders[
                tokenHolders.length - 1
            ];
            tokenHolders.pop(); // remove last entry
            delete tokenHolderIndex[tokenHolder];
        }
    }

    function getHolders() public view returns (address[] memory) {
        return tokenHolders;
    }
}
