import { artifacts, ethers } from "hardhat";
import * as fs from "fs";

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

  await saveFrontendFiles(token.address);
}

async function saveFrontendFiles(tokenAddr: string) {
  const contractsDir = __dirname + "/../../src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify(
      {
        Token: tokenAddr,
      },
      undefined,
      2
    )
  );

  const TokenArtifact = artifacts.readArtifactSync("MyTokenMock");

  fs.writeFileSync(contractsDir + "/Token.json", JSON.stringify(TokenArtifact, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });