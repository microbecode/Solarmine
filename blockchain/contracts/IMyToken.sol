// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMyToken is IERC20 {
    function getHolders() external view returns (address[] memory);

    function getHolderAmount() external view returns (uint256);

    function getPagedHolders(uint256, uint256)
        external
        view
        returns (address[] memory);

    function getOwner() external view returns (address);
}
