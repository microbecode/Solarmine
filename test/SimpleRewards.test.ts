import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, ContractReceipt, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

describe("Reward calculations", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let reverter: Contract;

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  let currentCreatedAddressNumber: number = 0; // so that each test creates their own addresses

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];

    const rewardsFact = await ethers.getContractFactory("SimpleRewards");
    rewards = await rewardsFact.deploy();
    await rewards.deployed();

    const reverterFact = await ethers.getContractFactory("ReverterMock");
    reverter = await reverterFact.deploy();
    await reverter.deployed();
  });

  /* it("Estimate gas costs", async function () {
    const amount = 500;
    const addrs = getAddresses(amount);
    const amounts = [...Array(amount).keys()].map((i) => i + 1);

    const totalAmounts = amounts.reduce((prev, curr) => (prev = prev + curr));

    console.log("total", totalAmounts);

    await rewards.distribute(addrs, amounts, { value: totalAmounts });
  }); */

  it("Single receiver, not enough balance", async function () {
    const addrs = getAddresses(1);
    const amounts = [2];

    await expect(
      rewards.distribute(addrs, amounts, { value: 1 })
    ).to.be.revertedWith("Not enough balance");
  });

  it("Single receiver", async function () {
    const addrs = getAddresses(1);
    const amounts = [1];

    await rewards.distribute(addrs, amounts, { value: 1 });

    const balance = await ethers.provider.getBalance(addrs[0]);

    expect(balance).to.equal(1);
  });

  it("Multiple receivers", async function () {
    const addrs = getAddresses(3);
    const amounts = [1, 2, 3];

    await rewards.distribute(addrs, amounts, { value: 6 });

    const balance1 = await ethers.provider.getBalance(addrs[0]);
    const balance2 = await ethers.provider.getBalance(addrs[1]);
    const balance3 = await ethers.provider.getBalance(addrs[2]);

    expect(balance1).to.equal(1);
    expect(balance2).to.equal(2);
    expect(balance3).to.equal(3);
  });

  it("Multiple receivers, middle reverts", async function () {
    const addrs = getAddresses(3);
    const amounts = [1, 2, 3];

    addrs[1] = reverter.address;

    await rewards.distribute(addrs, amounts, { value: 6 });

    const balance1 = await ethers.provider.getBalance(addrs[0]);
    const balance2 = await ethers.provider.getBalance(addrs[1]);
    const balance3 = await ethers.provider.getBalance(addrs[2]);

    expect(balance1).to.equal(1);
    expect(balance2).to.equal(0);
    expect(balance3).to.equal(3);
  });

  const getAddresses = (amount: number): string[] => {
    let prefixNum = ethers.BigNumber.from("10").pow(38);
    const addrs: string[] = [];
    for (let i = 0; i < amount; i++) {
      const addr =
        "0x7" + prefixNum.add(currentCreatedAddressNumber++).toString();
      addrs.push(addr);
    }
    return addrs;
  };
});
