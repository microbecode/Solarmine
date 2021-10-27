pragma solidity ^0.8.0;

import "./token/ERC20/IERC20.sol";

interface IMyToken is IERC20 {
    function tokenHolders() external returns (address[] calldata);
}
