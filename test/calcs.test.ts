import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, ContractReceipt, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import {
  calcFullDistribution,
  splitDistribution,
} from "../website/src/utils/calcs";
import { SendBatch } from "../website/src/components/types";

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

  const dummyUpdater = (
    holderAmount: number,
    holderBalanceAmount: number,
    total: number,
    totalHoldersToCheck: number
  ) => {};

  it("Single holder, gets all rewards", async function () {
    const giveRewards = BigNumber.from("1000");
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(owner.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Single new holder, gets all rewards", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(user1.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Two equal holders divide the reward equally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 2);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(2);
    hasItems(dist.addresses, [owner.address, user1.address]);
    expect(dist.amounts.length).to.equal(2);
    expect(dist.amounts[0]).to.equal(giveRewards.div(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(2));
  });

  it("Three equal holders leave dust", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 3);
    await token.transfer(user2.address, tokenSupply / 3);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(3);
    hasItems(dist.addresses, [owner.address, user1.address, user2.address]);
    expect(dist.amounts.length).to.equal(3);
    expect(dist.amounts[0]).to.equal(giveRewards.div(3));
    expect(dist.amounts[1]).to.equal(giveRewards.div(3));
    expect(dist.amounts[2]).to.equal(giveRewards.div(3));
    expect(dist.amounts[0].add(dist.amounts[1]).add(dist.amounts[2])).to.lt(
      giveRewards
    );
  });

  it("Two inequal holders divide the reward inequally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 3);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(2);
    hasItems(dist.addresses, [owner.address, user1.address]);
    expect(dist.amounts.length).to.equal(2);
    expect(dist.amounts[0]).to.equal(giveRewards.div(3).mul(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(3));
  });

  it("Three inequal holders divide the reward inequally", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 5);
    await token.transfer(user2.address, (tokenSupply / 10) * 3);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(3);
    hasItems(dist.addresses, [owner.address, user1.address, user2.address]);
    expect(dist.amounts.length).to.equal(3);
    expect(dist.amounts[0]).to.equal(giveRewards.div(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(5));
    expect(dist.amounts[2]).to.equal(giveRewards.div(10).mul(3));
  });

  it("Single blacklisted holder", async function () {
    const giveRewards = BigNumber.from("1000");
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [{ address: owner.address, title: "" }],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(0);
    expect(dist.amounts.length).to.equal(0);
  });

  it("One blacklisted is removed", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 2);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [{ address: user1.address, title: "" }],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(owner.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Multiple blacklisted are removed", async function () {
    const giveRewards = BigNumber.from("1000");
    await token.transfer(user1.address, tokenSupply / 10);
    await token.transfer(user2.address, tokenSupply / 5);
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [
        { address: user1.address, title: "" },
        { address: user2.address, title: "" },
      ],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(1);
    expect(dist.addresses[0]).to.equal(owner.address);
    expect(dist.amounts.length).to.equal(1);
    expect(dist.amounts[0]).to.equal(giveRewards);
  });

  it("Correct ratios are withheld with blacklist", async function () {
    const giveRewards = BigNumber.from("1000");

    await token.transfer(user1.address, tokenSupply / 20); // 5%
    await token.transfer(user2.address, tokenSupply / 5); // 20%
    await token.transfer(user3.address, tokenSupply / 4); // 25%
    // owner 50%
    const dist = await calcFullDistribution(
      token,
      giveRewards,
      [
        { address: user1.address, title: "" },
        { address: user2.address, title: "" },
      ],
      dummyUpdater
    );

    expect(dist.totalAmount).to.equal(giveRewards);
    expect(dist.addresses.length).to.equal(2);
    expect(dist.addresses[0]).to.equal(owner.address);
    expect(dist.addresses[1]).to.equal(user3.address);
    expect(dist.amounts.length).to.equal(2);
    expect(dist.amounts[0]).to.equal(giveRewards.div(3).mul(2));
    expect(dist.amounts[1]).to.equal(giveRewards.div(3));
  });

  // Enable if testing performance. Takes 18 seconds, 80% of it in token minting
  /*   it("No issues with bigger token holder amounts", async function () {
    const giveRewards = BigNumber.from("10000");

    await giveTokens(1000, 1000);
    const dist = await calcFullDistribution(token, giveRewards, [user1.address, user2.address]);

    expect(dist.amounts.length).to.equal(1001);
  }); */

  // Generate addresses and send them tokens
  const giveTokens = async (holders: number, totalAmount: number) => {
    let prefixNum = ethers.BigNumber.from("10").pow(38);
    for (let i = 0; i < holders; i++) {
      const addr =
        "0x5" + prefixNum.add(currentCreatedAddressNumber++).toString();
      await token.mint(addr, totalAmount / holders, { gasPrice: 0 });
    }
  };
});

describe("Reward list splitting", function () {
  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    user4 = accounts[4];
    user5 = accounts[5];
  });

  it("No splitting needed", async function () {
    var params: SendBatch = {
      addresses: ["a"],
      amounts: [getNum(1)],
      totalAmount: BigNumber.from("0"),
    };
    /*    let params: SendParams = {
      
    }; */
    const split = splitDistribution(params, 50);
    expect(split.length).to.equal(1);
    expect(split[0].addresses.length).to.equal(1);
    expect(split[0].amounts.length).to.equal(1);
  });

  it("Equal split", async function () {
    const addresses = ["a", "b", "c", "d", "e", "f"];
    const amounts = [
      getNum(1),
      getNum(2),
      getNum(3),
      getNum(4),
      getNum(5),
      getNum(6),
    ];
    let params: SendBatch = {
      addresses: addresses,
      amounts: amounts,
      totalAmount: BigNumber.from("21"),
    };
    const split = splitDistribution(params, 2);
    const flatAddresses = split
      .map((s) => s.addresses)
      .reduce((a, b) => a.concat(b));

    expect(split.length).to.equal(3);

    expect(split[0].totalAmount).to.equal(BigNumber.from("3"));
    expect(split[1].totalAmount).to.equal(BigNumber.from("7"));
    expect(split[2].totalAmount).to.equal(BigNumber.from("11"));

    expect(split[0].addresses.length).to.equal(2);
    expect(split[0].amounts.length).to.equal(2);
    expect(split[1].addresses.length).to.equal(2);
    expect(split[1].amounts.length).to.equal(2);
    expect(split[2].addresses.length).to.equal(2);
    expect(split[2].amounts.length).to.equal(2);

    hasItems(flatAddresses, addresses);
    expect(split[1].amounts[1]).to.eq(getNum(4)); // random pick
  });

  it("Inequal split", async function () {
    const addresses = ["a", "b", "c", "d", "e"];
    const amounts = [getNum(1), getNum(2), getNum(3), getNum(4), getNum(5)];
    let params: SendBatch = {
      addresses: addresses,
      amounts: amounts,
      totalAmount: BigNumber.from("15"),
    };
    const split = splitDistribution(params, 3);
    const flatAddresses = split
      .map((s) => s.addresses)
      .reduce((a, b) => a.concat(b));

    expect(split.length).to.equal(2);

    expect(split[0].totalAmount).to.equal(BigNumber.from("6"));
    expect(split[1].totalAmount).to.equal(BigNumber.from("9"));

    expect(split[0].addresses.length).to.equal(3);
    expect(split[0].amounts.length).to.equal(3);
    expect(split[1].addresses.length).to.equal(2);
    expect(split[1].amounts.length).to.equal(2);

    hasItems(flatAddresses, addresses);
    expect(split[1].amounts[0]).to.eq(getNum(4)); // random pick
  });

  const getNum = (num: number): BigNumber => {
    return BigNumber.from(num.toString());
  };
});

const hasItems = (list: string[], hasAddresses: string[]) => {
  hasAddresses.forEach((a) => {
    expect(list.indexOf(a) > -1).to.equal(true);
  });
};
