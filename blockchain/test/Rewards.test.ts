import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
require("@nomiclabs/hardhat-waffle");

describe("Rewards", function () {
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
  const tokenSupply = 600;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    blacklisted = accounts[4];

    const tokenFact = await ethers.getContractFactory("MyToken");
    token = await tokenFact.deploy(tokenSupply, "", "", { gasPrice: 0 });
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

  it("Requires some reward", async function () {
    await expect(rewards.notifyRewards({ value: 0, gasPrice: 0 })).to.be.revertedWith("There has to be some reward");
  });

  it("Single holder, gets all rewards", async function () {
    const reward = 10000;
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    expect(ownerBal).to.equal(initialBalanceOwner);
  });

  it("Two equal holders divide the reward equally", async function () {
    const reward = 10000;
    await token.transfer(user1.address, tokenSupply / 2, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(reward / 2));
    expect(user1Bal).to.equal(initialBalanceUser1.add(reward / 2));
  });

  it("Three equal holders leave dust", async function () {
    const reward = 10000;
    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(user2.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);
    const user2Bal = await ethers.provider.getBalance(user2.address);
    const contrBal = await ethers.provider.getBalance(rewards.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(BigNumber.from((reward / 3).toFixed(0))));
    expect(user1Bal).to.equal(initialBalanceUser1.add((reward / 3).toFixed(0)));
    expect(user2Bal).to.equal(initialBalanceUser2.add((reward / 3).toFixed(0)));

    expect(contrBal).to.gt(zero);
  });

  it("Dust is reused", async function () {
    const reward = 10000;
    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(user2.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);
    const user2Bal = await ethers.provider.getBalance(user2.address);
    const contrBal = await ethers.provider.getBalance(rewards.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward * 3).add(BigNumber.from(reward.toFixed(0))));
    expect(user1Bal).to.equal(initialBalanceUser1.add(reward.toFixed(0)));
    expect(user2Bal).to.equal(initialBalanceUser2.add(reward.toFixed(0)));

    expect(contrBal).to.eq(zero);
  });

  it("User removed, no longer gets rewards", async function () {
    const reward = 10000;
    const third = parseInt((reward / 3).toFixed(0));
    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(user2.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });
    await token.connect(user1).transfer(user2.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);
    const user2Bal = await ethers.provider.getBalance(user2.address);
    const contrBal = await ethers.provider.getBalance(rewards.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward * 2).add(third * 2));
    expect(user1Bal).to.equal(initialBalanceUser1.add(third));
    expect(user2Bal).to.equal(initialBalanceUser2.add(third + parseInt(((reward / 3) * 2).toFixed(0))));

    expect(contrBal).to.gt(zero);
  });

  it("Blacklisting skips with two", async function () {
    const reward = 10000;
    await token.transfer(blacklisted.address, tokenSupply / 2, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const blackBal = await ethers.provider.getBalance(blacklisted.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(reward));
    expect(blackBal).to.equal(initialBalanceBlacklist);
  });

  it("Blacklisting skips with multiple", async function () {
    const reward = 10000;
    await token.transfer(blacklisted.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const blackBal = await ethers.provider.getBalance(blacklisted.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(reward / 2));
    expect(blackBal).to.equal(initialBalanceBlacklist);
    expect(user1Bal).to.equal(initialBalanceUser1.add(reward / 2));
  });

  it("Blacklisting skips with multiple, different order", async function () {
    const reward = 10000;

    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(blacklisted.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const blackBal = await ethers.provider.getBalance(blacklisted.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(reward / 2));
    expect(blackBal).to.equal(initialBalanceBlacklist);
    expect(user1Bal).to.equal(initialBalanceUser1.add(reward / 2));
  });

  it("Using a reverter address simply ignores the revert", async function () {
    const reward = 10000;
    const third = parseInt((reward / 3).toFixed(0));
    await token.transfer(reverter.address, tokenSupply / 3, { gasPrice: 0 });
    await token.transfer(user1.address, tokenSupply / 3, { gasPrice: 0 });
    await rewards.notifyRewards({ value: reward, gasPrice: 0 });

    const ownerBal = await ethers.provider.getBalance(owner.address);
    const reverterBal = await ethers.provider.getBalance(reverter.address);
    const user1Bal = await ethers.provider.getBalance(user1.address);
    const contrBal = await ethers.provider.getBalance(rewards.address);

    expect(ownerBal).to.equal(initialBalanceOwner.sub(reward).add(third));
    expect(reverterBal).to.equal(initialBalanceReverter);
    expect(user1Bal).to.equal(initialBalanceUser1.add(third));
    expect(contrBal).to.be.closeTo(BigNumber.from(third.toString()), 1);
  });
});