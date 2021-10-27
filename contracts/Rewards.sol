pragma solidity ^0.8.0;

import "./token/ERC20/IERC20.sol";

contract Rewards {
    address private _rewardToken;

    constructor(address rewardToken) {
        _rewardToken = rewardToken;
    }

    function inputRewards() public {}
}
