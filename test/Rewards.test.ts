import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
//import { deployContract } from "waffle";
require("@nomiclabs/hardhat-waffle");

describe("Rewards", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let token: Contract;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];

    const tokenFact = await ethers.getContractFactory("MyToken");
    token = await tokenFact.deploy(); //"", "", owner.address, ethers.utils.parseUnits("1000", 18));
    await token.deployed();

    const rewardsFact = await ethers.getContractFactory("Rewards");
    rewards = await rewardsFact.deploy(token.address);
    await rewards.deployed();
  });

  it("Initial check", async function () {
    //await rewards.notifyRewards({ value: 5000000 });
    token.transfer(token.address, 10);
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
