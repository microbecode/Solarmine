pragma solidity ^0.8.0;

import "./IMyToken.sol";
import "hardhat/console.sol";

// TODO: cleanup the code
contract Rewards {
    IMyToken private _underlying;
    address private _blacklisted; // the liquidity pool
    uint256 private _indexOfBlacklisted;

    event ReceiverRefusedReward(address indexed);

    constructor(address underlying, address blacklistAddress) {
        _underlying = IMyToken(underlying);
        _blacklisted = blacklistAddress;
    }

    function notifyRewards() public payable {
        uint256 toShare = address(this).balance;
        //console.log("black has %s", _underlying.balanceOf(_blacklisted));
        if (toShare > 0) {
            address[] memory holders = _underlying.getHolders();
            uint256 supply = _underlying.totalSupply();

            //uint256 startIndex = 0;
            /*             if (
                _indexOfBlacklisted > 0 &&
                holders[_indexOfBlacklisted] == _blacklisted
            ) {
                startIndex = _indexOfBlacklisted;
                console.log("Found index %s", _indexOfBlacklisted);
            } */

            // Remove the effect of the blacklisted address
            for (uint256 i = 0; i < holders.length; i++) {
                if (holders[i] == _blacklisted) {
                    // Set the address to someone who doesn't have tokens, so no rewards given
                    holders[i] = address(0x1);
                    // Ignore the amount of the blacklisted address
                    supply -= _underlying.balanceOf(_blacklisted);
                    //_indexOfBlacklisted = i;
                    break;
                }
            }

            //console.log("process for %s", holderAmount);

            for (uint256 i = 0; i < holders.length; i++) {
                uint256 bal = _underlying.balanceOf(holders[i]);
                // Relevant check only for the blacklisted address
                if (bal > 0) {
                    uint256 share = (toShare * bal) / supply;
                    //console.log("sharing %s", share);
                    (bool success, ) = holders[i].call{value: share, gas: 3000}(
                        ""
                    );
                    if (!success) {
                        emit ReceiverRefusedReward(holders[i]);
                    }
                }
            }
        }
    }

    // TODO: run in batches
}
