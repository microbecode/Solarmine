// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Rewards.sol";

contract RewardsMock is Rewards {
    constructor(address underlying, address blacklistAddress)
        Rewards(underlying, blacklistAddress)
    {}

    function getBatchHolders() public view returns (address[] memory) {
        return _batchHolders;
    }
}
