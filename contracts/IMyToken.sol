pragma solidity ^0.8.0;

import "./token/ERC20/IERC20.sol";

interface IMyToken is IERC20 {
    function getHolders() external returns (address[] memory);
}
