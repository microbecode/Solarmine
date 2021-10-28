import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
//import { deployContract } from "waffle";
require("@nomiclabs/hardhat-waffle");

describe("Token", function () {
  /*let accounts: SignerWithAddress[];
  let rewards: Contract;
  let token: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const tokenSupply = 1000;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];

    const tokenFact = await ethers.getContractFactory("MyToken");
    token = await tokenFact.deploy(tokenSupply, "", "");
    await token.deployed();
  });

  it("Initial data", async function () {
    const holders = await token.getHolders();
    expect(holders.length).to.equal(1);
  });

  it("Add users to holder list", async function () {
    await token.transfer(user1.address, 1);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(2);

    await token.transfer(user2.address, 1);
    holders = await token.getHolders();

    expect(holders.length).to.equal(3);
  });

  it("No double adding", async function () {
    await token.transfer(user1.address, 1);
    await token.transfer(user1.address, 2);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(2);
  });

  it("Remove a user", async function () {
    await token.transfer(user1.address, 1);
    await token.connect(user1).transfer(owner.address, 1);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(1);
    expect(holders[0]).to.equal(owner.address);
  });

  it("Transfer to self keeps you on the list", async function () {
    await token.transfer(user1.address, 1);
    await token.connect(user1).transfer(user1.address, 1);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(2);
  });

  it("Transferring only part keeps you on the list", async function () {
    await token.transfer(user1.address, 3);
    await token.connect(user1).transfer(owner.address, 1);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(2);
  });

  it("You can get readded", async function () {
    await token.transfer(user1.address, 3);
    await token.connect(user1).transfer(owner.address, 3);
    expect((await token.getHolders()).length).to.equal(1);
    await token.transfer(user1.address, 5);
    expect((await token.getHolders()).length).to.equal(2);
  });

  it("Many transfers, you're out when you reach zero", async function () {
    await token.transfer(user1.address, 3);

    await token.connect(user1).transfer(owner.address, 1);
    expect((await token.getHolders()).length).to.equal(2);

    await token.connect(user1).transfer(owner.address, 1);
    expect((await token.getHolders()).length).to.equal(2);

    await token.connect(user1).transfer(owner.address, 1);
    expect((await token.getHolders()).length).to.equal(1);
  });

  it("Also transferFrom works, with sending to self", async function () {
    await token.approve(user1.address, 5);
    await token.connect(user1).transferFrom(owner.address, user1.address, 5);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(2);
  });

  it("Also transferFrom works, with sending back", async function () {
    await token.approve(user1.address, 5);
    await token.connect(user1).transferFrom(owner.address, owner.address, 5);
    let holders = await token.getHolders();

    expect(holders.length).to.equal(1);
  });

  it("Transferring around", async function () {
    await token.transfer(user1.address, 3);
    await token.transfer(user2.address, 4);
    expect((await token.getHolders()).length).to.equal(3);
    await token.transfer(user3.address, 5);
    expect((await token.getHolders()).length).to.equal(4);

    await token.connect(user2).transfer(user1.address, 3); // transfer some to existing
    expect((await token.getHolders()).length).to.equal(4);

    await token.connect(user1).transfer(user2.address, 6); // transfer all to existing
    expect((await token.getHolders()).length).to.equal(3);

    let holders = await token.getHolders();
    expect(holders[0]).to.equal(owner.address);
    expect(holders[1]).to.equal(user3.address);
    expect(holders[2]).to.equal(user2.address);

    await token.connect(user3).transfer(user2.address, 5); // transfer all to existing
    expect((await token.getHolders()).length).to.equal(2);

    await token.connect(user2).transfer(user1.address, 4); // transfer some to new
    expect((await token.getHolders()).length).to.equal(3);

    await token.connect(user2).transfer(user3.address, 1); // transfer all to new
    expect((await token.getHolders()).length).to.equal(4);

    await token.connect(user3).transfer(user2.address, 1); // transfer all to existing
    expect((await token.getHolders()).length).to.equal(3);

    await token.connect(user1).transfer(owner.address, 4); // transfer all to existing
    expect((await token.getHolders()).length).to.equal(2);

    await token.connect(owner).transfer(user1.address, 4); // transfer some to new
    expect((await token.getHolders()).length).to.equal(3);

    await token.connect(user2).transfer(user1.address, 8); // transfer all to existing
    expect((await token.getHolders()).length).to.equal(2);

    holders = await token.getHolders();
    // no tokens lost on the way
    expect((await token.balanceOf(holders[0])).add(await token.balanceOf(holders[1]))).to.equal(tokenSupply);
  });*/
});

describe("Rewards", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let token: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let initialBalanceOwner: BigNumber;
  let initialBalanceUser1: BigNumber;
  let initialBalanceUser2: BigNumber;
  let initialBalanceUser3: BigNumber;
  const zero = ethers.BigNumber.from("0") as BigNumber;
  const tokenSupply = 600;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];

    const tokenFact = await ethers.getContractFactory("MyToken");
    token = await tokenFact.deploy(tokenSupply, "", "", { gasPrice: 0 });
    await token.deployed();

    const rewardsFact = await ethers.getContractFactory("Rewards");
    rewards = await rewardsFact.deploy(token.address, { gasPrice: 0 });
    await rewards.deployed();

    initialBalanceOwner = await ethers.provider.getBalance(owner.address);
    initialBalanceUser1 = await ethers.provider.getBalance(user1.address);
    initialBalanceUser2 = await ethers.provider.getBalance(user2.address);
    initialBalanceUser3 = await ethers.provider.getBalance(user3.address);
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
  /* 
  it("No access", async function () {
    await expect(
      minter
        .connect(staker1)
        .setNFTAddresses(nftFirst.address, nftSecond.address, nftThird.address)
    ).to.be.revertedWith("Only the contract owner may perform this action");

    await expect(
      minter.connect(staker1).whitelist(1, owner.address)
    ).to.be.revertedWith("Only the contract owner may perform this action");

    await expect(
      nftFirst.connect(owner).mint(owner.address)
    ).to.be.revertedWith("Only minting contract can mint");

    await expect(
      nftFirst.connect(staker1).mint(owner.address)
    ).to.be.revertedWith("Only minting contract can mint");

    await expect(
      nftSecond.connect(staker1).mint(owner.address)
    ).to.be.revertedWith("Only minting contract can mint");

    await expect(
      nftThird.connect(staker1).mint(owner.address)
    ).to.be.revertedWith("Only minting contract can mint");
  });

  it("No claiming without whitelist", async function () {
    await minter.claimNFTs();
    await expectInitial();

    const amIEligible = await minter.amIEligible();
    const amIEligible2 = await minter.connect(staker1).amIEligible();
    expect(amIEligible).to.equal(false);
    expect(amIEligible2).to.equal(false);
  });
 */
});
