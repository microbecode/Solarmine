import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
require("@nomiclabs/hardhat-waffle");

describe("Batch rewards", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let token: Contract;
  let reverter: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let blacklisted: SignerWithAddress;
  let initialBalanceOwner: BigNumber;
  let initialBalanceUser1: BigNumber;
  let initialBalanceUser2: BigNumber;
  let initialBalanceBlacklist: BigNumber;
  let initialBalanceReverter: BigNumber;
  const zero = ethers.BigNumber.from("0") as BigNumber;
  const tokenSupply = 60000;
  let currentCreatedAddressNumber: number = 0; // so that each test creates their own addresses

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    blacklisted = accounts[4];

    const tokenFact = await ethers.getContractFactory("MyTokenMock");
    token = await tokenFact.deploy(tokenSupply, { gasPrice: 0 });
    await token.deployed();

    const rewardsFact = await ethers.getContractFactory("Rewards");
    rewards = await rewardsFact.deploy(token.address, blacklisted.address, { gasPrice: 0 });
    await rewards.deployed();

    const reverterFact = await ethers.getContractFactory("ReverterMock");
    reverter = await reverterFact.deploy({ gasPrice: 0 });
    await reverter.deployed();

    initialBalanceOwner = await ethers.provider.getBalance(owner.address);
    initialBalanceUser1 = await ethers.provider.getBalance(user1.address);
    initialBalanceUser2 = await ethers.provider.getBalance(user2.address);
    initialBalanceBlacklist = await ethers.provider.getBalance(blacklisted.address);
    initialBalanceReverter = await ethers.provider.getBalance(reverter.address);
  });

  // Generate addresses and send them tokens
  const giveTokens = async (holders: number, totalAmount: number) => {
    let prefixNum = ethers.BigNumber.from("10").pow(38);
    for (let i = 0; i < holders; i++) {
      const addr = "0x5" + prefixNum.add(currentCreatedAddressNumber++).toString();
      await token.transfer(addr, totalAmount / holders, { gasPrice: 0 });
    }
  };

  it("Token holders generated correctly", async function () {
    const holderAmount = 100;
    await giveTokens(holderAmount, tokenSupply);

    const holders = await token.getHolders();

    const user0Amount = await token.balanceOf(holders[0]);
    const user50Amount = await token.balanceOf(holders[50]);
    const userLastAmount = await token.balanceOf(holders[holders.length - 1]);

    expect(holders.length).to.equal(holderAmount);
    expect(user0Amount).to.equal(tokenSupply / holderAmount);
    expect(user50Amount).to.equal(tokenSupply / holderAmount);
    expect(userLastAmount).to.equal(tokenSupply / holderAmount);
  });

  it("Batch requires some reward", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);

    await expect(rewards.initiateBatch(100, { value: 0, gasPrice: 0 })).to.be.revertedWith(
      "There has to be some reward"
    );
  });

  it("Try to run a batch when none is running", async function () {
    await expect(rewards.processBatch({ gasPrice: 0 })).to.be.revertedWith("No batch running");
  });

  it("One batch", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    await rewards.initiateBatch(100, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    const holders = await token.getHolders();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    const userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(reward / holderAmount);
    expect(userLastRewards).to.equal(reward / holderAmount);
    expect(contrBalance).to.equal(0);
  });

  it("Batch size 1", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    await rewards.initiateBatch(1, { value: reward, gasPrice: 0 });
    for (let i = 0; i < 10; i++) {
      await rewards.processBatch();
    }

    const holders = await token.getHolders();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    const userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(reward / holderAmount);
    expect(userLastRewards).to.equal(reward / holderAmount);
    expect(contrBalance).to.equal(0);
  });

  it("Three uneven batches", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    const holders = await token.getHolders();

    await rewards.initiateBatch(4, { value: reward, gasPrice: 0 });
    await rewards.processBatch();
    await rewards.processBatch();
    await rewards.processBatch();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    const userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(reward / holderAmount);
    expect(userLastRewards).to.equal(reward / holderAmount);
    expect(contrBalance).to.equal(0);
  });

  it("Three uneven batches, status between batches", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    const holders = await token.getHolders();

    await rewards.initiateBatch(4, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    let user0Rewards = await ethers.provider.getBalance(holders[0]);
    let userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    let userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    let contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(0);
    expect(userLastRewards).to.equal(0);
    expect(contrBalance).to.equal(reward - 4000);

    await rewards.processBatch();

    user0Rewards = await ethers.provider.getBalance(holders[0]);
    userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(reward / holderAmount);
    expect(userLastRewards).to.equal(0);
    expect(contrBalance).to.equal(reward - 8000);
  });

  it("One batch, start a new one with the same holders", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    const holders = await token.getHolders();

    await rewards.initiateBatch(100, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    await rewards.initiateBatch(100, { value: reward * 2, gasPrice: 0 });
    await rewards.processBatch();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    const userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal((reward / holderAmount) * 3);
    expect(userMiddleRewards).to.equal((reward / holderAmount) * 3);
    expect(userLastRewards).to.equal((reward / holderAmount) * 3);
    expect(contrBalance).to.equal(0);
  });

  it("One batch, start a new one with different holders", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);

    await rewards.initiateBatch(100, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    await token.mint(owner.address, tokenSupply);
    await giveTokens(holderAmount, tokenSupply);
    const holders = await token.getHolders();

    await rewards.initiateBatch(100, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userPastMiddlePointRewards = await ethers.provider.getBalance(holders[(holders.length / 5) * 3]);
    const userLastRewards = await ethers.provider.getBalance(holders[holders.length - 1]);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount + reward / (holderAmount * 2));
    expect(userPastMiddlePointRewards).to.equal(reward / (holderAmount * 2));
    expect(userLastRewards).to.equal(reward / (holderAmount * 2));
    expect(contrBalance).to.equal(0);
  });

  it("Try to start a new batch before previous has finished", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);

    await rewards.initiateBatch(4, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    await expect(rewards.initiateBatch(100, { value: reward, gasPrice: 0 })).to.be.revertedWith(
      "There is already a batch running"
    );
  });

  it("Ignore blacklisted", async function () {
    const holderAmount = 10;
    const reward = 10000;
    await giveTokens(holderAmount, tokenSupply);
    // doesn't matter how many tokens we mint for the blacklisted
    await token.mint(blacklisted.address, tokenSupply * 5);

    await rewards.initiateBatch(100, { value: reward, gasPrice: 0 });
    await rewards.processBatch();

    const holders = await token.getHolders();

    const user0Rewards = await ethers.provider.getBalance(holders[0]);
    const userMiddleRewards = await ethers.provider.getBalance(holders[holderAmount / 2]);
    const userAlmostLastRewards = await ethers.provider.getBalance(holders[holders.length - 2]);
    const blacklistedRewards = await ethers.provider.getBalance(blacklisted.address);
    const contrBalance = await ethers.provider.getBalance(rewards.address);

    expect(user0Rewards).to.equal(reward / holderAmount);
    expect(userMiddleRewards).to.equal(reward / holderAmount);
    expect(userAlmostLastRewards).to.equal(reward / holderAmount);
    expect(blacklistedRewards).to.equal(initialBalanceBlacklist);
    expect(contrBalance).to.equal(0);
  });
});
