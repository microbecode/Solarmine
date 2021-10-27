pragma solidity ^0.8.0;

import "./IMyToken.sol";

contract Rewards {
    IMyToken private _underlying;

    constructor(address underlying) {
        _underlying = IMyToken(underlying);
    }

    function notifyRewards() public payable {
        address[] memory holders = _underlying.tokenHolders();
        for (uint256 a = 0; a < holders.length; a++) {
            // TODO: what if receiver reverts
            (bool success, ) = address(_underlying).call{value: a, gas: 3000}(
                ""
            );
        }
    }

    /*     function claim() public {
        uint256 myBalance = _underlying.balanceOf(msg.sender);
        uint256 total = _underlying.totalSupply();
        uint256 percentage = myBalance / total;

        uint256 currBalance = _rewardToken.balanceOf(address(this));
        if (currBalance > _prevBalance) {
            
        }
        _prevBalance = currBalance;
    } */
}
