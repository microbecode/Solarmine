const hre = require("hardhat");

async function main() {
  const tokenSupply = ethers.utils.parseUnits("100", 18);
  const blacklisted = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // dummy address

  const tokenFact = await ethers.getContractFactory("MyToken");
  const token = await tokenFact.deploy(tokenSupply, "", "", { gasPrice: 0 });
  await token.deployed();

  const rewardsFact = await ethers.getContractFactory("Rewards");
  const rewards = await rewardsFact.deploy(token.address, blacklisted, { gasPrice: 0 });
  await rewards.deployed();

  console.log("Token deployed to:", token.address, "rewards at:", rewards.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
