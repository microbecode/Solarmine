pragma solidity ^0.8.0;

import "./IMyToken.sol";

contract Rewards {
    IMyToken private _underlying;

    constructor(address underlying) {
        _underlying = IMyToken(underlying);
    }

    function notifyRewards() public payable {
        address[] memory holders = _underlying.getHolders();
        uint256 supply = _underlying.totalSupply();
        uint256 toShare = address(this).balance;
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 bal = _underlying.balanceOf(holders[i]);
            uint256 share = toShare * (bal / supply);
            // TODO: what if receiver reverts
            (bool success, ) = holders[i].call{value: share, gas: 3000}("");
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
