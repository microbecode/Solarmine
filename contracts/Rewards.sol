pragma solidity ^0.8.0;

import "./IMyToken.sol";
import "./access/Ownable.sol";
import "hardhat/console.sol";

// TODO: cleanup the code
contract Rewards is Ownable {
    IMyToken private _underlying;
    address private _blacklisted; // the liquidity pool
    uint256 private _indexOfBlacklisted;

    uint256 private _batchSize;
    address[] private _batchHolders;
    mapping(address => uint256) _batchBalances;
    uint256 private _batchSupply;
    uint256 private _batchToShare;
    uint256 private _batchCurrentIndex = 0;

    event ReceiverRefusedReward(address indexed);

    constructor(address underlying, address blacklistAddress) {
        _underlying = IMyToken(underlying);
        _blacklisted = blacklistAddress;
    }

    function initiateBatch(uint256 batchSize) public payable onlyOwner {
        _batchToShare = address(this).balance;
        //console.log("black has %s", _underlying.balanceOf(_blacklisted));
        if (_batchToShare > 0) {
            _batchSize = batchSize;
            _batchHolders = _underlying.getHolders();
            _batchSupply = _underlying.totalSupply();

            for (uint256 i; i < _batchHolders.length; i++) {
                // Set user balances
                _batchBalances[_batchHolders[i]] = _underlying.balanceOf(
                    _batchHolders[i]
                );
                // Remove the effect of the blacklisted address
                if (_batchHolders[i] == _blacklisted) {
                    _batchHolders[i] = address(0x1);
                    // Ignore the amount of the blacklisted address
                    _batchSupply -= _underlying.balanceOf(_blacklisted);
                    _batchBalances[_batchHolders[i]] = 0;
                }
            }
        }
    }

    function notifyBatchRewards() public onlyOwner {
        // If we have batch ongoing
        if (_batchSize > 0) {
            uint256 currentStart = _batchCurrentIndex;
            for (
                _batchCurrentIndex;
                _batchCurrentIndex < _batchHolders.length &&
                    _batchCurrentIndex < currentStart + _batchSize;
                _batchCurrentIndex++
            ) {
                uint256 bal = _batchBalances[_batchHolders[_batchCurrentIndex]];
                // Relevant check only for the blacklisted address
                if (bal > 0) {
                    uint256 share = (_batchToShare * bal) / _batchSupply;
                    //console.log("sharing %s", share);
                    (bool success, ) = _batchHolders[_batchCurrentIndex].call{
                        value: share,
                        gas: 3000
                    }("");
                    if (!success) {
                        emit ReceiverRefusedReward(
                            _batchHolders[_batchCurrentIndex]
                        );
                    }
                }
            }
            // Check if all is done
            if (_batchCurrentIndex == _batchHolders.length) {
                resetBatch();
            }
        }
    }

    function resetBatch() private {
        delete _batchCurrentIndex;
        delete _batchSize;
        delete _batchHolders;
        //delete _batchBalances; // TODO: figure out whether this is needed
        delete _batchSupply;
        delete _batchToShare;
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

    /* function distribute(
        address[] memory holders,
        uint256 toShare,
        uint256 supply
    ) internal {
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 bal = _underlying.balanceOf(holders[i]);
            // Relevant check only for the blacklisted address
            if (bal > 0) {
                uint256 share = (toShare * bal) / supply;
                //console.log("sharing %s", share);
                (bool success, ) = holders[i].call{value: share, gas: 3000}("");
                if (!success) {
                    emit ReceiverRefusedReward(holders[i]);
                }
            }
        }
    } */

    // TODO: run in batches
}
