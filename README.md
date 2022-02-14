# Reward platform for Solarmine

This repository contains codes for creating an ERC20 token and a rewards platform (frontend and contract) for the <a href='http://solarminecoin.com/'>Solarmine</a> project.

## Contents

This repository contains two main contracts and one website:
1. An ERC20 token with some added functionality
1. A reward contract
1. A web frontend for distributing rewards

## Technologies

This repository is implemented with Solidity on top of an Ethereum framework. The actual deployment of the contracts will happen to the BSC network.

### Used versions
* Solidity 0.8.x for contracts
* Hardhat for local execution and test environment
* Chai/Mocha/Waffle/Ethers for unit tests
* React.js for rewards frontend

### Installation

To start using this repository, you'll need to have `yarn` installed.
After that, you should be able to just go to the root directory and write `yarn` and it'll download the required packages.
Similarily, for the frontend, go to the `website` folder and write `yarn`.

## Smart contracts

### MyToken

This is an ERC-20 token with a few extra details. The basic token is from OpenZeppelin. The OpenZeppelin contract's hook `_afterTokenTransfer` is utilized to append custom functionality to keep track of token holders in an array.

The array is appended to when new addresses get tokens. When an address no longer has tokens, it's removed from the array. The array is provided to external contracts in a separate function.

The custom functionality does not interfere with the default token functionality, it's simply built on top of the default functionality.

### Rewards

This contract is used to distribute rewards to token holders. Every token holder gets a share of the given rewards. The size of the share depends on the amount of tokens the holder has.

The contract acts as a simple relayer which splits the given reward based on the provided distribution. The rewards are given in the native asset of the blockchain (for example, BNB in Binance Smart Chain). 

## Frontend

The web frontend is used to facilitate reward distribution. It takes care of the following aspects:

* Ask the user for the amount of rewards he wants to distribute
* Get all of the token holders
* Calculate how the tokens should be distributed to the holders, taking into account the blacklisted addresses
* Split the rewards into batches, which are of the right size to be sent to the rewards contract

Once the batches have been calculated, the user is presented with the option to start distributing the batches. They can be distributed sequentially - you have to wait for the previous batch to finish before distributing the next one.

You can also download an extract of the calculated rewards. The extract will also include transaction information for those addresses for which the rewards were already distributed.

IMPORTANT: **DO NOT REFRESH THE BROWSER DURING THE REWARD DISTRIBUTION**. Otherwise only some of the rewards get sent and there is no possibility to continue the process from some batch which is not the first one. If something goes wrong during reward distribution, download the extract and contact the developer.

### Blacklisted address

An arbitrary amount of addresses can be blacklisted and they are not considered when distributing rewards. At least the liquidity pool address is added in the blacklist so that rewards would not be distributed to that address.

### Example distribution

Let's say there are token holders with the following distribution:
* Owner1: 10%
* Owner2: 50%. This address is blacklisted
* Owner3: 15%
* Owner4: 25%

Let us further say that you want to distribute 100 rewards and the token's total supply is 1000.
First the frontend reduces the balance of the blacklisted addresses, so for the calculations the total supply is 500. Since we also don't give rewards to the blacklisted address, its share of the tokens is ignored. Therefore, the three remaining owners get rewards with the following distribution:
* Owner1: 20% of 100
* Owner3: 30% of 100
* Owner4: 50% of 100

The distribution is then divided into batches, unless it fits within a single batch.

## Deployment

Manual deployment is easiest with flattened contracts. You can get flattened contracts with: `npx hardhat flatten contracts/SimpleRewards.sol > rewards.sol.txt` (not using the direct .sol suffix because it would cause conflicting contract names).

If you are developmentally-oriented you can also deploy with the associated Hardhat deployment script.

## Verifying the contracts

Manually verifying the contracts is easiest if the flattened contract is used for deployment.

The problem with the flattener is that the licensing comments are also included, one per each contract file. This is not acceptable for deployment, so you will need to manually remove the licensing lines from the flattened file (all of them except the first one). So remove each line which looks something like this: `// SPDX-License-Identifier: MIT` - except the first one. After that, it should be acceptable for the verifier.

## Unit tests

All of the written contracts are covered with automated unit tests.
You can browse the tests in the *test* folder, and you can run them with Hardhat: `npx hardhat test`

