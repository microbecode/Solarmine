import { artifacts, ethers } from "hardhat";
import * as fs from "fs";
import { BigNumber, Contract } from "ethers";

const giveTokens = async (
  token: Contract,
  holders: number,
  totalAmount: number
) => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);
  for (let i = 0; i < holders; i++) {
    const addr = "0x5" + prefixNum.add(i).toString();
    await token.transfer(addr, totalAmount / holders, { gasPrice: 0 });
  }
};

async function main() {
  const supplyNum = 1000;
  const tokenSupply = BigNumber.from(supplyNum);
  const blacklisted = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // dummy address

  const tokenFact = await ethers.getContractFactory("MyToken");
  const token = await tokenFact.deploy(tokenSupply, "", "", { gasPrice: 0 });
  await token.deployed();

  const rewardsFact = await ethers.getContractFactory("SimpleRewards");
  const rewards = await rewardsFact.deploy({
    gasPrice: 0,
  });
  await rewards.deployed();

  console.log(
    "Token deployed to:",
    token.address,
    "rewards at:",
    rewards.address
  );

  await giveTokens(token, 2, supplyNum);

  await saveFrontendFiles(token.address, rewards.address);
}

async function saveFrontendFiles(tokenAddr: string, rewardAddr: string) {
  const contractsDir = __dirname + "/../website/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify(
      {
        Token: tokenAddr,
        Rewards: rewardAddr,
      },
      undefined,
      2
    )
  );

  const TokenArtifact = artifacts.readArtifactSync("MyTokenMock");
  const RewardsArtifact = artifacts.readArtifactSync("SimpleRewards");

  fs.writeFileSync(
    contractsDir + "/Token.json",
    JSON.stringify(TokenArtifact, null, 2)
  );

  fs.writeFileSync(
    contractsDir + "/Rewards.json",
    JSON.stringify(RewardsArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
