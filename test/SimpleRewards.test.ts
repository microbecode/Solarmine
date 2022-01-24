import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, ContractReceipt, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

describe("Reward calculations", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];

    const rewardsFact = await ethers.getContractFactory("SimpleRewards");
    rewards = await rewardsFact.deploy();
    await rewards.deployed();
  });

  it("Estimate gas costs", async function () {
    const amount = 500;
    const addrs = getAddresses(amount);
    const amounts = [...Array(amount).keys()].map((i) => i + 1);

    await rewards.distribute(addrs, amounts);
  });
});

const getAddresses = (amount: number): string[] => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);
  const addrs: string[] = [];
  for (let i = 0; i < amount; i++) {
    const addr = "0x7" + prefixNum.add(i).toString();
    addrs.push(addr);
  }
  return addrs;
};
