# Score Milk staking project

This repository includes the codes for a staking platform project for Score Milk (https://scoremilk.com/).

## Contents

This project contains three contracts:
* A staking contract (in file contracts/StakingRewards.sol)
* A minter contract (in file contracts/Minter.sol)
* A bunch of ERC-721 NFT contracts (in files contracts/NFT*.sol)

## Technologies

This repository is implemented with Solidity on top of an Ethereum framework. The actual deployment of the contracts will happen to the Tron network - the deployment settings in this repository will not be valid for Tron.

### Used versions
* Solidity 0.5.x for contracts
* Hardhat for local execution and test environment
* Chai/Mocha/Waffle/Ethers for unit tests

## Smart contracts

The contracts are documented in detail <a href='./contracts/README.md'>in the contracts folder</a>.

## Deployment

To deploy the contracts, you need to do the following things:
1. Have your staking token ready
1. Deploy the staking contract
1. Deploy the minter contract
1. Deploy the three NFT contracts
1. Set the NFT addresses in the minter contract

There is an example deployment script in *scripts/deploy.js*. If you have Hardhat installed, you can run it (locally) with: * npx hardhat run scripts/deploy.js --network hardhat*.

## Verifying the contracts

If the contracts need to be verified in some external service it's easiest to first create a flattened file of all of the contracts. This can be done with Hardhat: *npx hardhat flatten > flat.sol.txt* (not using the direct .sol suffix because it would cause conflicting contract names).

## Unit tests

All of the written contracts are covered with automated unit tests.
You can browse the tests in the *test* folder, and you can run them with Hardhat: *npx hardhat test*

