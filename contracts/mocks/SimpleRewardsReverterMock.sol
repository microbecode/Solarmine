// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../SimpleRewards.sol";

contract SimpleRewardsReverterMock is SimpleRewards {
    uint256 numOfDistribute;

    function distribute(address[] memory receivers, uint256[] memory values)
        public
        payable
        override
    {
        // Used to simulate failed batch transactions
        revert();
    }
}
