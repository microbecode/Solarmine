const hre = require("hardhat");

async function main() {

  const accounts = await hre.ethers.getSigners();

  const tokenFact = await ethers.getContractFactory("ERC20Mock");
  const token = await tokenFact.deploy(accounts[0].address, hre.ethers.utils.parseUnits("1000", 18));
  await token.deployed();

  const stakingFact = await ethers.getContractFactory("StakingRewards");
  const staking = await stakingFact.deploy(accounts[0].address, accounts[0].address, token.address);
  await staking.deployed();

  const minterFact = await ethers.getContractFactory("Minter");
  const minter = await minterFact.deploy(accounts[0].address);
  await minter.deployed();

  const nftFirstFact = await ethers.getContractFactory("NFTFirst");
  const nftFirst = await nftFirstFact.deploy(minter.address);
  await nftFirst.deployed();

  const nftSecondFact = await ethers.getContractFactory("NFTSecond");
  const nftSecond = await nftSecondFact.deploy(minter.address);
  await nftSecond.deployed();

  const nftThirdFact = await ethers.getContractFactory("NFTThird");
  const nftThird = await nftThirdFact.deploy(minter.address);
  await nftThird.deployed();

  await minter.setNFTAddresses(
    nftFirst.address,
    nftSecond.address,
    nftThird.address
  );

  console.log("staking deployed to:", staking.address, "minter at:", minter.address); 

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
