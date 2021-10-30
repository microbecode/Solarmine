pragma solidity ^0.8.0;

import "./IMyToken.sol";
import "./access/Ownable.sol";
import "hardhat/console.sol";

// TODO: cleanup the code
contract Rewards is Ownable {
    IMyToken internal _underlying;
    address internal _blacklisted; // the liquidity pool

    // Batch related variables
    uint256 internal _batchSize;
    address[] internal _batchHolders;
    mapping(address => uint256) _batchBalances;
    uint256 internal _batchSupply;
    uint256 internal _batchToShare;
    uint256 internal _batchCurrentIndex = 0;

    event ReceiverRefusedReward(address indexed);
    event BatchCompleted();

    constructor(address underlying, address blacklistAddress) {
        _underlying = IMyToken(underlying);
        _blacklisted = blacklistAddress;
    }

    /**
    @dev Initiates a new batch run: stores a snapshot of the current token data
    */
    function initiateBatch(uint256 batchSize) public payable {
        require(_batchSize == 0, "There is already a batch running");
        _batchToShare = address(this).balance;
        require(_batchToShare > 0, "There has to be some reward");
        //console.log("black has %s", _underlying.balanceOf(_blacklisted));

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
                // Ignore the amount of the blacklisted address
                _batchSupply -= _underlying.balanceOf(_blacklisted);
                // Set batch balance to zero, so no rewards given
                _batchBalances[_batchHolders[i]] = 0;
            }
        }
    }

    function processBatch() public {
        require(_batchSize > 0, "No batch running");
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
                /*       console.log(
                    "sharing %s to %s with balance %s",
                    share,
                    _batchHolders[_batchCurrentIndex],
                    bal
                ); */
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
            emit BatchCompleted();
        }
    }

    function resetBatch() private {
        delete _batchCurrentIndex;
        delete _batchSize;
        delete _batchHolders;
        //delete _batchBalances; // Not so trivial to delete, but also no need to delete
        delete _batchSupply;
        delete _batchToShare;
    }

    // TODO: recover bnb

    function notifyRewards() public payable {
        uint256 toShare = address(this).balance;
        //console.log("black has %s", _underlying.balanceOf(_blacklisted));
        require(toShare > 0, "There has to be some reward");
        address[] memory holders = _underlying.getHolders();
        uint256 supply = _underlying.totalSupply();

        // Remove the effect of the blacklisted address
        for (uint256 i = 0; i < holders.length; i++) {
            if (holders[i] == _blacklisted) {
                // Set the address to someone who doesn't have tokens, so no rewards given
                holders[i] = address(0x1);
                // Ignore the amount of the blacklisted address
                supply -= _underlying.balanceOf(_blacklisted);
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
                (bool success, ) = holders[i].call{value: share, gas: 3000}("");
                if (!success) {
                    emit ReceiverRefusedReward(holders[i]);
                }
            }
        }
    }
}
