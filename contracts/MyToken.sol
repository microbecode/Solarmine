pragma solidity ^0.8.0;

import "./token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract MyToken is ERC20 {
    address[] internal _tokenHolders;
    mapping(address => bool) internal _tokenHolderExists;
    mapping(address => uint256) internal _tokenHolderArrayIndex;

    constructor(
        uint256 initialBalance,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _mint(_msgSender(), initialBalance);
        _addTokenHolder(_msgSender());
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        //console.log("transfer of %s", amount);
        if (amount > 0) {
            _addTokenHolder(to);
        }
        if (balanceOf(from) == 0) {
            _removeTokenHolder(from);
        }
    }

    // https://ethereum.stackexchange.com/a/12707/31933
    function _addTokenHolder(address tokenHolder) internal {
        //console.log("index %s", tokenHolderIndex[tokenHolder]);
        if (!_tokenHolderExists[tokenHolder]) {
            // doesn't exist
            _tokenHolders.push(tokenHolder);
            _tokenHolderExists[tokenHolder] = true;
            _tokenHolderArrayIndex[tokenHolder] = _tokenHolders.length - 1;
        }
    }

    function _removeTokenHolder(address tokenHolder) internal {
        if (_tokenHolderExists[tokenHolder]) {
            // exists

            address lastHolder = _tokenHolders[_tokenHolders.length - 1];
            // Move the last entry to replace this entry
            _tokenHolders[_tokenHolderArrayIndex[tokenHolder]] = lastHolder;
            _tokenHolders.pop(); // remove last entry

            // Update index for the moved holder
            _tokenHolderArrayIndex[lastHolder] = _tokenHolderArrayIndex[
                tokenHolder
            ];

            // Remove index
            delete _tokenHolderArrayIndex[tokenHolder];
            // Mark as non-existing
            _tokenHolderExists[tokenHolder] = false;
        }
    }

    function getHolders() public view returns (address[] memory) {
        return _tokenHolders;
    }
}
