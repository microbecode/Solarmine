// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./IMyToken.sol";

contract MyToken is ERC20, IMyToken {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal _tokenHolders;
    address private _bep20deployer;

    event HolderAdded(address indexed holder);
    event HolderRemoved(address indexed holder);

    constructor(
        uint256 initialBalance,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _mint(_msgSender(), initialBalance);
        _addTokenHolder(_msgSender());
        _bep20deployer = _msgSender();
    }

    /**
     * @dev Triggered after a token transfer has occurred
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (amount > 0) {
            _addTokenHolder(to);
        }
        if (balanceOf(from) == 0) {
            _removeTokenHolder(from);
        }
    }

    /**
     * @dev Add a token holder to the array (if not yet exists). Fully scalable
     */
    function _addTokenHolder(address tokenHolder) internal {
        if (_tokenHolders.add(tokenHolder)) {
            emit HolderAdded(tokenHolder);
        }
        emit HolderAdded(tokenHolder);
    }

    /**
     * @dev Remove a token holder from the array (if exists). Fully scalable
     */
    function _removeTokenHolder(address tokenHolder) internal {
        if (_tokenHolders.remove(tokenHolder)) {
            emit HolderRemoved(tokenHolder);
        }
    }

    /**
     * @dev Get all token holders. Doesn't scale well
     */
    function getHolders() public view override returns (address[] memory) {
        return _tokenHolders.values();
    }

    /**
     * @dev Get holder amount
     */
    function getHolderAmount() public view override returns (uint256) {
        return _tokenHolders.length();
    }

    /**
     * @dev Get all token holders, per page
     * @param itemsToGet How many holders to return
     * @param offset How many holders to skip in the list before starting list gathering
     */
    function getPagedHolders(uint256 itemsToGet, uint256 offset)
        public
        view
        override
        returns (address[] memory)
    {
        uint256 total = _tokenHolders.length();
        require(total > offset, "Invalid offset");

        uint256 len = itemsToGet + offset > total ? total - offset : itemsToGet;
        address[] memory result = new address[](len);

        for (uint256 i = 0; i < itemsToGet && i + offset < total; i++) {
            result[i] = _tokenHolders.at(i + offset);
        }

        return result;
    }

    /**
     * @dev To make the token fully BEP-20 compatible. No real usage
     */
    function getOwner() external view override returns (address) {
        return _bep20deployer;
    }
}
