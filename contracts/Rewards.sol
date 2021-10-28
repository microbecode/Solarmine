pragma solidity ^0.8.0;

import "./IMyToken.sol";
import "hardhat/console.sol";

contract Rewards {
    IMyToken private _underlying;

    constructor(address underlying) {
        _underlying = IMyToken(underlying);
    }

    function notifyRewards() public payable {
        uint256 toShare = address(this).balance;
        if (toShare > 0) {
            address[] memory holders = _underlying.getHolders();
            uint256 supply = _underlying.totalSupply();
            for (uint256 i = 0; i < holders.length; i++) {
                uint256 bal = _underlying.balanceOf(holders[i]);
                uint256 share = (toShare * bal) / supply;
                console.log("sharing %s", share);
                // TODO: what if receiver reverts
                (bool success, ) = holders[i].call{value: share, gas: 3000}("");
            }
        }
    }

    // TODO: run in batches
}
