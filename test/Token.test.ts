import { ethers, network, waffle } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
require("@nomiclabs/hardhat-waffle");

describe("Token", function () {
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

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    user4 = accounts[4];
    user5 = accounts[5];

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
  });

  it("Paged holder list, size 1", async function () {
    await token.transfer(user1.address, tokenSupply / 3);
    await token.transfer(user2.address, tokenSupply / 3);
    await token.transfer(user3.address, tokenSupply / 3);

    let allHolders: any[] = [];
    allHolders = allHolders.concat(await token.getPagedHolders(1, 0));
    allHolders = allHolders.concat(await token.getPagedHolders(1, 1));
    allHolders = allHolders.concat(await token.getPagedHolders(1, 2));

    expect(allHolders.length).to.equal(3);
    expect(allHolders.indexOf(user1.address)).to.gt(-1);
    expect(allHolders.indexOf(user2.address)).to.gt(-1);
    expect(allHolders.indexOf(user3.address)).to.gt(-1);
    expect(allHolders.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });

  it("Paged holder list, size 2", async function () {
    await token.transfer(user1.address, tokenSupply / 5);
    await token.transfer(user2.address, tokenSupply / 5);
    await token.transfer(user3.address, tokenSupply / 5);
    await token.transfer(user4.address, tokenSupply / 5);
    await token.transfer(user5.address, tokenSupply / 5);

    let allHolders: any[] = [];
    allHolders = allHolders.concat(await token.getPagedHolders(2, 0));
    allHolders = allHolders.concat(await token.getPagedHolders(2, 2));
    allHolders = allHolders.concat(await token.getPagedHolders(2, 4));

    expect(allHolders.length).to.equal(5);
    expect(allHolders.indexOf(user1.address)).to.gt(-1);
    expect(allHolders.indexOf(user2.address)).to.gt(-1);
    expect(allHolders.indexOf(user3.address)).to.gt(-1);
    expect(allHolders.indexOf(user4.address)).to.gt(-1);
    expect(allHolders.indexOf(user5.address)).to.gt(-1);
    expect(allHolders.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });

  it("Paged holder list, size 3, odd holder list size", async function () {
    await token.transfer(user1.address, tokenSupply / 5);
    await token.transfer(user2.address, tokenSupply / 5);
    await token.transfer(user3.address, tokenSupply / 5);
    await token.transfer(user4.address, tokenSupply / 5);
    await token.transfer(user5.address, tokenSupply / 5);

    let allHolders: any[] = [];
    allHolders = allHolders.concat(await token.getPagedHolders(3, 0));
    allHolders = allHolders.concat(await token.getPagedHolders(3, 3));

    expect(allHolders.length).to.equal(5);
    expect(allHolders.indexOf(user1.address)).to.gt(-1);
    expect(allHolders.indexOf(user2.address)).to.gt(-1);
    expect(allHolders.indexOf(user3.address)).to.gt(-1);
    expect(allHolders.indexOf(user4.address)).to.gt(-1);
    expect(allHolders.indexOf(user5.address)).to.gt(-1);
    expect(allHolders.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });

  it("Paged holder list, size 3, even holder list size", async function () {
    await token.transfer(user1.address, tokenSupply / 6);
    await token.transfer(user2.address, tokenSupply / 6);
    await token.transfer(user3.address, tokenSupply / 6);
    await token.transfer(user4.address, tokenSupply / 6);
    await token.transfer(user5.address, tokenSupply / 6);

    let allHolders: any[] = [];
    allHolders = allHolders.concat(await token.getPagedHolders(3, 0));
    allHolders = allHolders.concat(await token.getPagedHolders(3, 3));

    expect(allHolders.length).to.equal(6);
    expect(allHolders.indexOf(user1.address)).to.gt(-1);
    expect(allHolders.indexOf(user2.address)).to.gt(-1);
    expect(allHolders.indexOf(user3.address)).to.gt(-1);
    expect(allHolders.indexOf(user4.address)).to.gt(-1);
    expect(allHolders.indexOf(user5.address)).to.gt(-1);
    expect(allHolders.indexOf(owner.address)).to.gt(-1);
    expect(allHolders.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });

  it("Too big offset reverts", async function () {
    await token.transfer(user1.address, tokenSupply / 3);
    await token.transfer(user2.address, tokenSupply / 3);
    await token.transfer(user3.address, tokenSupply / 3);

    await expect(token.getPagedHolders(2, 10)).to.be.revertedWith("Invalid offset");
  });

  it("Getting just last item, with big offset, works", async function () {
    await token.transfer(user1.address, tokenSupply / 3);
    await token.transfer(user2.address, tokenSupply / 3);
    await token.transfer(user3.address, tokenSupply / 3);

    const lastHolder = await token.getPagedHolders(20, 2);
    expect(lastHolder.length).to.equal(1);
    expect(lastHolder.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });

  it("Getting all items at once works", async function () {
    await token.transfer(user1.address, tokenSupply / 5);
    await token.transfer(user2.address, tokenSupply / 5);
    await token.transfer(user3.address, tokenSupply / 5);
    await token.transfer(user4.address, tokenSupply / 5);
    await token.transfer(user5.address, tokenSupply / 5);

    const allHolders = await token.getPagedHolders(20, 0);
    expect(allHolders.length).to.equal(5);
    expect(allHolders.indexOf(ethers.constants.AddressZero)).to.equal(-1);
  });
});
