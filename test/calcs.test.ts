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

  it("Initial data", async function () {
    const giveRewards = BigNumber.from("1000");
    const dist = await calcFullDistribution(token, giveRewards);
    expect(dist.addresses.length).to.equal(1);
  });

  // Generate addresses and send them tokens
  const giveTokens = async (holders: number, totalAmount: number) => {
    let prefixNum = ethers.BigNumber.from("10").pow(38);
    for (let i = 0; i < holders; i++) {
      const addr = "0x5" + prefixNum.add(currentCreatedAddressNumber++).toString();
      await token.mint(addr, totalAmount / holders, { gasPrice: 0 });
    }
  };
});
