import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
//import { deployContract } from "waffle";
require("@nomiclabs/hardhat-waffle");

describe("Milestone eligibility", function () {
  let accounts: SignerWithAddress[];
  let staking: Contract;
  let stakeToken: Contract;
  let owner: SignerWithAddress;
  let staker1: SignerWithAddress;
  let staker2: SignerWithAddress;
  let rewardDistributer: SignerWithAddress;
  const oneToken = ethers.utils.parseUnits("1", 6);
  const twoTokens = ethers.utils.parseUnits("2", 6);
  const twentyTokens = ethers.utils.parseUnits("20", 6);
  const hundredTokens = ethers.utils.parseUnits("100", 6);
  const thousandTokens = ethers.utils.parseUnits("1000", 6);
  const zero = ethers.BigNumber.from("0") as BigNumber;
  const justAboveZero = ethers.BigNumber.from("1");
  const rewardsDuration = 60 * 60 * 24 * 7; // 7 days

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    staker1 = accounts[1];
    staker2 = accounts[2];
    rewardDistributer = accounts[4];

    const stakeTokenFact = await ethers.getContractFactory("ERC20Mock");
    stakeToken = await stakeTokenFact.deploy(owner.address, thousandTokens);
    await stakeToken.deployed();

    stakeToken.transfer(staker1.address, hundredTokens);
    stakeToken.transfer(staker2.address, hundredTokens);

    const stakingFact = await ethers.getContractFactory("StakingRewards");
    staking = await stakingFact.deploy(
      owner.address,
      rewardDistributer.address,
      stakeToken.address
    );
    await staking.deployed();
  });

  const expectMilestoneBN = async (
    addr: string,
    amount: BigNumber,
    duration: number,
    shouldBeEligible: boolean
  ) => {
    const eligible = await staking.checkMilestoneEligibility(
      addr,
      amount,
      duration
    );
    expect(eligible).to.equal(shouldBeEligible);
  };

  const expectMilestone = async (
    addr: string,
    amount: number,
    duration: number,
    shouldBeEligible: boolean
  ) => {
    const eligible = await staking.checkMilestoneEligibility(
      addr,
      amount,
      duration
    );
    expect(eligible).to.equal(shouldBeEligible);
  };

  it("No stake, no milestone", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration * 3);

    await expectMilestone(staker1.address, 0, 0, false);
    await expectMilestone(staker1.address, 1, 0, false);
    await expectMilestone(staker1.address, 0, 2, false);
    await expectMilestone(staker1.address, 1, 2, false);
  });

  it("Single stake, check durations", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await stakeToken
      .connect(staker1)
      .approve(staking.address, 5, { gasPrice: 0 });
    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await expectMilestone(staker1.address, 1, 0, true);
    await expectMilestone(staker1.address, 1, 500, false);

    await increaseTime(100);

    await expectMilestone(staker1.address, 1, 50, true);

    await increaseTime(200);

    await expectMilestone(staker1.address, 1, 50, true);
    await expectMilestone(staker1.address, 1, 500, false);

    await increaseTime(300);

    await expectMilestone(staker1.address, 1, 500, true);
  });

  it("Only adding stake, check amounts", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await expectMilestone(staker1.address, 1, 0, false);

    await stakeToken
      .connect(staker1)
      .approve(staking.address, 50, { gasPrice: 0 });
    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await expectMilestone(staker1.address, 1, 0, true);
    await expectMilestone(staker1.address, 10, 0, false);

    await increaseTime(100);

    await expectMilestone(staker1.address, 1, 0, true);
    await expectMilestone(staker1.address, 10, 0, false);

    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await expectMilestone(staker1.address, 10, 0, true);
    await expectMilestone(staker1.address, 20, 0, false);

    await staking.connect(staker1).stake(10, { gasPrice: 0 });

    await expectMilestone(staker1.address, 15, 0, true);
  });

  it("Only adding, check combinations", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await stakeToken
      .connect(staker1)
      .approve(staking.address, 500, { gasPrice: 0 });
    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await increaseTime(100);

    await expectMilestone(staker1.address, 1, 0, true);
    await expectMilestone(staker1.address, 1, 500, false);
    await expectMilestone(staker1.address, 10, 50, false);

    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await expectMilestone(staker1.address, 1, 500, false);
    await expectMilestone(staker1.address, 10, 50, false);

    await increaseTime(600);

    await expectMilestone(staker1.address, 10, 500, true);

    await staking.connect(staker1).stake(5, { gasPrice: 0 });

    await expectMilestone(staker1.address, 15, 100, false);

    await increaseTime(150);

    await expectMilestone(staker1.address, 15, 100, true);
  });

  it("Adding and removing", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await stakeToken
      .connect(staker1)
      .approve(staking.address, 500, { gasPrice: 0 });

    await staking.connect(staker1).stake(50, { gasPrice: 0 });

    await increaseTime(100);

    await staking.connect(staker1).withdraw(40, { gasPrice: 0 });

    await expectMilestone(staker1.address, 50, 0, true);
    await expectMilestone(staker1.address, 50, 80, true);
    await expectMilestone(staker1.address, 10, 150, false);

    await increaseTime(100);
    await expectMilestone(staker1.address, 10, 150, true);
    await expectMilestone(staker1.address, 20, 180, false);

    await staking.connect(staker1).stake(50, { gasPrice: 0 });

    await expectMilestone(staker1.address, 60, 0, true);
    await expectMilestone(staker1.address, 60, 1, false);
    await expectMilestone(staker1.address, 70, 0, false);

    await increaseTime(100);

    await expectMilestone(staker1.address, 60, 90, true);
    await expectMilestone(staker1.address, 10, 250, true);
    await expectMilestone(staker1.address, 10, 350, false);

    await staking.connect(staker1).withdraw(40, { gasPrice: 0 });
    await expectMilestone(staker1.address, 20, 900, false);
    await expectMilestone(staker1.address, 50, 80, true);
    await increaseTime(1000);

    await expectMilestone(staker1.address, 20, 900, true);
    await expectMilestone(staker1.address, 10, 150, true);
  });

  it("Adding and removing, multiple stakers", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await stakeToken
      .connect(staker1)
      .approve(staking.address, 500, { gasPrice: 0 });

    await stakeToken
      .connect(staker2)
      .approve(staking.address, 500, { gasPrice: 0 });

    await staking.connect(staker1).stake(50, { gasPrice: 0 });
    await staking.connect(staker2).stake(30, { gasPrice: 0 });

    await increaseTime(100);

    await expectMilestone(staker1.address, 50, 100, true);
    await expectMilestone(staker2.address, 50, 100, false);

    await staking.connect(staker1).withdraw(40, { gasPrice: 0 });

    await increaseTime(100);

    await expectMilestone(staker1.address, 60, 10, false);
    await expectMilestone(staker2.address, 30, 150, true);
  });

  it("Adding and removing, realistic numbers", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await stakeToken
      .connect(staker1)
      .approve(staking.address, twentyTokens, { gasPrice: 0 });

    await staking.connect(staker1).stake(twoTokens, { gasPrice: 0 });

    await expectMilestoneBN(staker1.address, twoTokens, 0, true);
    await expectMilestoneBN(
      staker1.address,
      twoTokens,
      rewardsDuration / 8,
      false
    );
    await increaseTime(rewardsDuration / 7);
    await expectMilestoneBN(
      staker1.address,
      twoTokens,
      rewardsDuration / 8,
      true
    );

    await staking.connect(staker1).withdraw(oneToken, { gasPrice: 0 });

    await increaseTime(rewardsDuration / 2);

    await expectMilestoneBN(
      staker1.address,
      twoTokens,
      rewardsDuration / 5,
      false
    );

    await expectMilestoneBN(
      staker1.address,
      oneToken,
      rewardsDuration / 3,
      true
    );
  });
});

describe("Staking", function () {
  let accounts: SignerWithAddress[];
  let staking: Contract;
  let stakeToken: Contract;
  let owner: SignerWithAddress;
  let staker1: SignerWithAddress;
  let staker2: SignerWithAddress;
  let staker3: SignerWithAddress;
  let rewardDistributer: SignerWithAddress;
  let initialBalanceOwner: BigNumber;
  let initialBalanceStaker1: BigNumber;
  let initialBalanceStaker2: BigNumber;
  const oneToken = ethers.utils.parseUnits("1", 18);
  const twoTokens = ethers.utils.parseUnits("2", 18);
  const twentyTokens = ethers.utils.parseUnits("20", 18);
  const thousandTokens = ethers.utils.parseUnits("1000", 18);
  const initialNativeBalance = twentyTokens;
  const stakeTokenstotal = twentyTokens;
  const zero = ethers.BigNumber.from("0") as BigNumber;
  const justAboveZero = ethers.BigNumber.from("1");
  const rewardsDuration = 60 * 60 * 24 * 7; // 7 days

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    staker1 = accounts[1];
    staker2 = accounts[2];
    staker3 = accounts[3];
    rewardDistributer = accounts[4];

    const stakeTokenFact = await ethers.getContractFactory("ERC20Mock");
    stakeToken = await stakeTokenFact.deploy(owner.address, thousandTokens);
    await stakeToken.deployed();

    stakeToken.transfer(staker1.address, twentyTokens);
    stakeToken.transfer(staker2.address, twentyTokens);
    stakeToken.transfer(staker3.address, twentyTokens);

    const stakingFact = await ethers.getContractFactory("StakingRewards");
    staking = await stakingFact.deploy(
      owner.address,
      rewardDistributer.address,
      stakeToken.address
    );
    await staking.deployed();

    initialBalanceOwner = await ethers.provider.getBalance(owner.address);
    initialBalanceStaker1 = await ethers.provider.getBalance(staker1.address);
    initialBalanceStaker2 = await ethers.provider.getBalance(staker2.address);
  });

  const expectInitial = async () => {
    const balanceOwner = await ethers.provider.getBalance(owner.address);
    const balanceStaker1 = await ethers.provider.getBalance(staker1.address);
    const balanceStaker2 = await ethers.provider.getBalance(staker2.address);
    const stakeBalance = await staking.balanceOf(owner.address);
    const stakeReward = await staking.earned(owner.address);
    const updateTime = await staking.lastUpdateTime();
    const periodFinish = await staking.periodFinish();

    expect(balanceOwner).to.equal(initialBalanceOwner);

    expect(balanceStaker1).to.equal(initialBalanceStaker1);
    expect(balanceStaker2).to.equal(initialBalanceStaker2);

    expect(stakeBalance).to.equal(zero);
    expect(stakeReward).to.equal(zero);
    expect(updateTime).to.equal(zero);
    expect(periodFinish).to.equal(zero);
  };

  it("initial data is correct", async function () {
    await expectInitial();
  });

  it("No access", async function () {
    await expect(
      staking.connect(staker1).setRewardsDuration(oneToken)
    ).to.be.revertedWith("Only the contract owner may perform this action");

    await expect(
      staking.connect(staker1).recoverERC20(staker2.address, oneToken)
    ).to.be.revertedWith("Only the contract owner may perform this action");

    await expect(
      staking.connect(owner).notifyRewardAmount({ value: oneToken })
    ).to.be.revertedWith("Caller is not RewardsDistribution contract");
  });

  it("Unstaking without stake reverts", async function () {
    await expect(staking.withdraw(zero)).to.be.revertedWith(
      "Cannot withdraw 0"
    );
  });

  it("Staking with zero reverts", async function () {
    await expect(staking.stake(zero)).to.be.revertedWith("Cannot stake 0");
  });

  it("Immediate unstake returns original state", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, oneToken, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking.connect(staker1).withdraw(oneToken, { gasPrice: 0 });
    await expectInitial();
  });

  it("Immediate unstake after double stake returns original state", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking.connect(staker1).withdraw(twoTokens, { gasPrice: 0 });
    await expectInitial();
  });

  it("Staking without rewards gives nothing", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });

    await increaseTime(rewardsDuration);

    await staking.connect(staker1).exit({ gasPrice: 0 });
    await expectInitial();
  });

  it("Reward insertion updates variables", async function () {
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    const update = await staking.lastUpdateTime();
    const periodFinish = await staking.periodFinish();

    const currBlock = await ethers.provider.getBlock(
      await ethers.provider.getBlockNumber()
    );
    expect(update).to.gt(zero);
    expect(periodFinish).to.equal(update.add(rewardsDuration));
    expect(update).to.equal(currBlock.timestamp);
  });

  it("Single staking gives all rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration);
    await staking.connect(staker1).exit({ gasPrice: 0 });
    const rewardBalance = await ethers.provider.getBalance(staker1.address);

    expect(rewardBalance.sub(initialBalanceStaker1)).to.be.closeTo(
      twoTokens,
      10e5
    );
  });

  it("Single staking retains reward after staking period", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration * 3);
    const earnedFirst = await staking.earned(staker1.address);
    await increaseTime(rewardsDuration);
    const earnedSecond = await staking.earned(staker1.address);

    expect(earnedFirst).to.eq(earnedSecond);
    expect(earnedFirst).to.be.gt(0);
  });

  it("Single staking, different staking period, retains the rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });

    await staking.setRewardsDuration(rewardsDuration * 2);

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration * 3);
    const earnedFirst = await staking.earned(staker1.address);
    await increaseTime(rewardsDuration);
    const earnedSecond = await staking.earned(staker1.address);

    expect(earnedFirst).to.eq(earnedSecond);
    expect(earnedFirst).to.be.gt(0);
  });

  it("Single staking, different staking period, influences rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration * 2);
    const earnedFirst = await staking.earned(staker1.address);

    await staking.setRewardsDuration(rewardsDuration * 2);
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration);
    const earnedSecond = await staking.earned(staker1.address);

    // Earnings during second period should be half of what they are in the first period,
    // since we only stake until halfway of the second period
    expect(earnedFirst).to.eq(earnedSecond.sub(earnedFirst).mul(2));
    expect(earnedFirst).to.be.gt(0);
  });

  it("Single user, multiple stakes gives all rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration / 2);
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await increaseTime(rewardsDuration / 2);

    await staking.connect(staker1).exit({ gasPrice: 0 });
    const rewardBalance = await ethers.provider.getBalance(staker1.address);

    expect(rewardBalance.sub(initialBalanceStaker1)).to.be.closeTo(
      twoTokens,
      10e5
    );
  });

  it("Two equal stakers, gives equal rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await stakeToken
      .connect(staker2)
      .approve(staking.address, twoTokens, { gasPrice: 0 });

    await setAutoMine(false);
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking.connect(staker2).stake(oneToken, { gasPrice: 0 });
    await setAutoMine(true);
    await network.provider.send("evm_mine");

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration / 2);

    await setAutoMine(false);
    await staking.connect(staker1).exit({ gasPrice: 0 });
    await staking.connect(staker2).exit({ gasPrice: 0 });
    await setAutoMine(true);

    const rewardBalance1 = await ethers.provider.getBalance(staker1.address);
    const rewardBalance2 = await ethers.provider.getBalance(staker2.address);

    expect(rewardBalance1).to.be.gt(0);
    expect(rewardBalance1.sub(initialBalanceStaker1)).to.eq(
      rewardBalance2.sub(initialBalanceStaker2)
    );
  });

  it("Two inequal stakers, gives inequal rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await stakeToken
      .connect(staker2)
      .approve(staking.address, oneToken, { gasPrice: 0 });

    await setAutoMine(false);
    await staking.connect(staker1).stake(twoTokens, { gasPrice: 0 });
    await staking.connect(staker2).stake(oneToken, { gasPrice: 0 });
    await setAutoMine(true);

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    await increaseTime(rewardsDuration / 4);

    // Increase rewards
    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: oneToken });
    await increaseTime(rewardsDuration / 2);

    await setAutoMine(false);
    await staking.connect(staker1).exit({ gasPrice: 0 });
    await staking.connect(staker2).exit({ gasPrice: 0 });
    await setAutoMine(true);

    const rewardBalance1 = await ethers.provider.getBalance(staker1.address);
    const rewardBalance2 = await ethers.provider.getBalance(staker2.address);

    expect(rewardBalance1.sub(initialBalanceStaker1)).to.eq(
      rewardBalance2.sub(initialBalanceStaker2).mul(2)
    );
    expect(rewardBalance1).to.be.gt(0);
  });

  it("Two inequal stakers, one enters halfway, gives inequal rewards", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, oneToken, { gasPrice: 0 });
    await stakeToken
      .connect(staker2)
      .approve(staking.address, oneToken, { gasPrice: 0 });

    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });
    await setAutoMine(true);
    await increaseTime(rewardsDuration / 2);

    await staking.connect(staker2).stake(oneToken, { gasPrice: 0 });

    await increaseTime(rewardsDuration / 2);

    await setAutoMine(false);
    await staking.connect(staker1).exit({ gasPrice: 0 });
    await staking.connect(staker2).exit({ gasPrice: 0 });
    await setAutoMine(true);

    const rewardBalance1 = await ethers.provider.getBalance(staker1.address);
    const rewardBalance2 = await ethers.provider.getBalance(staker2.address);

    //console.log("bal", rewardBalance1.toString(), rewardBalance2.toString());
    expect(rewardBalance1.sub(initialBalanceStaker1)).to.be.closeTo(
      rewardBalance2.sub(initialBalanceStaker2).mul(3),
      10e13
    );
    expect(rewardBalance1).to.be.gt(0);
  });

  it("Two stakers for multiple reward periods", async function () {
    await stakeToken
      .connect(staker1)
      .approve(staking.address, twoTokens, { gasPrice: 0 });
    await stakeToken
      .connect(staker2)
      .approve(staking.address, twoTokens, { gasPrice: 0 });

    await setAutoMine(false);
    await staking.connect(staker1).stake(oneToken, { gasPrice: 0 });
    await staking.connect(staker2).stake(oneToken, { gasPrice: 0 });
    await setAutoMine(true);

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: twoTokens });

    // Make the first reward period end for sure
    await increaseTime(rewardsDuration + 100);

    const rewardBalance1First = await staking.earned(staker1.address);
    const rewardBalance2First = await staking.earned(staker2.address);

    await staking
      .connect(rewardDistributer)
      .notifyRewardAmount({ value: oneToken });

    // Proceed with second reward period for some time
    await increaseTime(rewardsDuration / 2);

    const rewardBalance1Second = await staking.earned(staker1.address);
    const rewardBalance2Second = await staking.earned(staker2.address);

    expect(rewardBalance1First).to.eq(rewardBalance2First);
    expect(rewardBalance1First).to.be.gt(0);
    expect(rewardBalance1Second).to.eq(rewardBalance2Second);
    expect(rewardBalance1Second).to.be.gt(0);
  });

  const setAutoMine = async (on: boolean) => {
    await network.provider.send("evm_setAutomine", [on]);
    if (on) {
      await network.provider.send("evm_mine");
    }
  };
});

const increaseTime = async (seconds: number) => {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
};
