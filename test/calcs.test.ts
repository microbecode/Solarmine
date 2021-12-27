import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, ContractReceipt, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { calcFullDistribution } from "../src/utils/calcs";

describe("Reward calculations", function () {
  let accounts: SignerWithAddress[];
  let rewards: Contract;
  let token: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  const tokenSupply = 1200;

  let currentCreatedAddressNumber: number = 0; // so that each test creates their own addresses

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    user4 = accounts[4];
    user5 = accounts[5];

    const tokenFact = await ethers.getContractFactory("MyTokenMock");
    token = await tokenFact.deploy(tokenSupply);
    await token.deployed();
  });

  it("Single holder, gets all rewards", async function () {
    const giveRewards = BigNumber.from("1000");
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(owner.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Single new holder, gets all rewards", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply);
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(user1.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Two equal holders divide the reward equally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 2);
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(2);
    hasAddresses(dist.addresses, [owner.address, user1.address]);
    expect(dist.amounts.length).to.equal(2);
    expect(dist.amounts[0]).to.equal(giveRewards.div(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(2));
  });

  it("Three equal holders leave dust", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 3);
    await token.transfer(user2.address, tokenSupply / 3);
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(3);
    hasAddresses(dist.addresses, [owner.address, user1.address, user2.address]);
    expect(dist.amounts.length).to.equal(3);
    expect(dist.amounts[0]).to.equal(giveRewards.div(3));
    expect(dist.amounts[1]).to.equal(giveRewards.div(3));
    expect(dist.amounts[2]).to.equal(giveRewards.div(3));
    expect(dist.amounts[0].add(dist.amounts[1]).add(dist.amounts[2])).to.lt(giveRewards);
  });

  it("Two inequal holders divide the reward inequally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 3);
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(2);
    hasAddresses(dist.addresses, [owner.address, user1.address]);
    expect(dist.amounts.length).to.equal(2);
    expect(dist.amounts[0]).to.equal(giveRewards.div(3).mul(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(3));
  });

  it("Three inequal holders divide the reward inequally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 5);
    await token.transfer(user2.address, (tokenSupply / 10) * 3);
    const dist = await calcFullDistribution(token, giveRewards);

    expect(dist.addresses.length).to.equal(3);
    hasAddresses(dist.addresses, [owner.address, user1.address, user2.address]);
    expect(dist.amounts.length).to.equal(3);
    expect(dist.amounts[0]).to.equal(giveRewards.div(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(5));
    expect(dist.amounts[2]).to.equal(giveRewards.div(10).mul(3));
  });

  // TODO test: dust is reused

  // TODO tests: blacklist

  // TODO tests: reverter

  const hasAddresses = (list: string[], hasAddresses: string[]) => {
    hasAddresses.forEach((a) => {
      expect(list.indexOf(a) > -1).to.equal(true);
    });
  };

  // Generate addresses and send them tokens
  const giveTokens = async (holders: number, totalAmount: number) => {
    let prefixNum = ethers.BigNumber.from("10").pow(38);
    for (let i = 0; i < holders; i++) {
      const addr = "0x5" + prefixNum.add(currentCreatedAddressNumber++).toString();
      await token.mint(addr, totalAmount / holders, { gasPrice: 0 });
    }
  };
});
