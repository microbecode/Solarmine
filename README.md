# Reward platform for Solarmine

This repository contains codes for creating an ERC20 token and a rewards platform for the <a href='http://solarminecoin.com/'>Solarmine</a> project.

## Contents

This repository contains two main contracts:
1. An ERC20 token with some added functionality
1. A rewarding contract

## Technologies

This repository is implemented with Solidity on top of an Ethereum framework. The actual deployment of the contracts will happen to the BSC network - the deployment settings in this repository will not be valid for BSC.

### Used versions
* Solidity 0.8.x for contracts
* Hardhat for local execution and test environment
* Chai/Mocha/Waffle/Ethers for unit tests

## Smart contracts

### MyToken

This is an ERC-20 token with a few extra details. The basic token is from OpenZeppelin. The OpenZeppelin contract's hook `_afterTokenTransfer` is utilized to append custom functionality to keep track of token holders in an array.

The array is appended to, when new addresses get tokens. When an address no longer has tokens, it's removed from the array. The array is provided to external contracts in a separate function.

The custom functionality does not interfere with the default token functionality, it's simply built on top of the default functionality.

### Rewards

This contract is used to distribute rewards to token holders. Every token holder gets a share of the given rewards. The size of the share depends on the amount of tokens.

The rewards are given in the native asset of the blockchain (for example, BNB in Binance Smart Chain).

#### Blacklisted address

One address is blacklisted and is not considered when distributing rewards. For the sake of the reward calculations, token balance of the blacklisted address is deducted from the total token supply. The blacklisted address is the liquidity pool which contains a big portion of the tokens.

#### Example distribution

Let's say there are token holders with the following distribution:
* Owner1: 10%
* Owner2: 50%. This address is blacklisted
* Owner3: 15%
* Owner4: 25%

Let us further say that the contract is sent 100 rewards and the token's total supply is 1000.
First we reduce the balance of the blacklisted address, so for the calculations the total supply is 500. Since we also don't give rewards to the blacklisted address, its share of the tokens is ignored. Therefore, the three remaining owners get rewards with the following distribution:
* Owner1: 20% of 500
* Owner3: 30% of 500
* Owner4: 50% of 500

#### Batch reward sending

Since we are looping through all of the token holders, the solution doesn't fully scale if there are too many holders. Once a certain holder amount is reached, the distribution can't be executed anymore since its gas requirements are above the blockchain's block gas limit.

To mitigate this issue, the rewards can be sent in batches.

TODO: write documentation, and not implemented yet.

## Deployment

To deploy the contracts, you need to do the following things:
1. Deploy the token `MyToken`
1. Deploy the reward contract

There is an example deployment script in *scripts/deploy.js*. If you have Hardhat installed, you can run it (locally) with: `npx hardhat run scripts/deploy.js --network hardhat`.
If you use the example deployment script, remember the following things:
* Before deploying the token, remember to change the `tokenSupply`
* After deploying the token, you need to create the liquidity pool with it
* Once you have the liquidity pool setup, get its address and supply that as a parameter to the reward contract, upon deployment

So, in reality, you can't deploy everything with just the script, since you need to go create the LP after token deployment, but before rewards deployment.

## Verifying the contracts

If the contracts need to be verified in some external service it's easiest to first create a flattened file of all of the contracts. This can be done with Hardhat: *npx hardhat flatten > flat.sol.txt* (not using the direct .sol suffix because it would cause conflicting contract names).

## Unit tests

All of the written contracts are covered with automated unit tests.
You can browse the tests in the *test* folder, and you can run them with Hardhat: *npx hardhat test*

