pragma solidity ^0.8.0;

import "./IMyToken.sol";
import "hardhat/console.sol";

contract Rewards {
    IMyToken private _underlying;
    address private _blacklisted; // the liquidity pool
    uint256 private _indexOfBlacklisted;

    constructor(address underlying, address blacklistAddress) {
        _underlying = IMyToken(underlying);
        _blacklisted = blacklistAddress;
    }

    function notifyRewards() public payable {
        uint256 toShare = address(this).balance;
        if (toShare > 0) {
            address[] memory holders = _underlying.getHolders();
            uint256 supply = _underlying.totalSupply();
            uint256 holderAmount = holders.length;

            uint256 startIndex = 0;
            /*             if (
                _indexOfBlacklisted > 0 &&
                holders[_indexOfBlacklisted] == _blacklisted
            ) {
                startIndex = _indexOfBlacklisted;
                console.log("Found index %s", _indexOfBlacklisted);
            } */

            // Remove the effect of the blacklisted address
            for (startIndex; startIndex < holderAmount; startIndex++) {
                if (holders[startIndex] == _blacklisted) {
                    // replace the entry with the last entry
                    holders[startIndex] = holders[holders.length - 1];
                    holderAmount--; // don't process the last one
                    // Ignore the amount of the blacklisted address
                    supply -= _underlying.balanceOf(_blacklisted);
                    _indexOfBlacklisted = startIndex;
                    break;
                }
            }

            //console.log("process for %s", holderAmount);

            for (uint256 i = 0; i < holderAmount; i++) {
                /*    if (holders[i] == _blacklisted) {
                    continue;
                } */
                uint256 bal = _underlying.balanceOf(holders[i]);
                uint256 share = (toShare * bal) / supply;
                //console.log("sharing %s", share);
                // TODO: what if receiver reverts
                (bool success, ) = holders[i].call{value: share, gas: 3000}("");
            }
        }
    }

    // TODO: run in batches
}
