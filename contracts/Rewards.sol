pragma solidity ^0.8.0;

import "./token/ERC20/IERC20.sol";

contract Rewards {
    IERC20 private _underlying;

    constructor(address underlying) {
        _underlying = IERC20(underlying);
    }

    function notifyRewards() public payable {
        for (uint256 a = 0; a < 500; a++) {
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
