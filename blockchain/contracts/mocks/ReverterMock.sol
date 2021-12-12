// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// mock class, used by unit tests. Don't deploy in a real network
contract ReverterMock {
    receive() external payable {
        revert();
    }
}
