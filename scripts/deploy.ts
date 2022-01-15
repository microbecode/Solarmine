import { artifacts, ethers } from "hardhat";
import * as fs from "fs";
import { BigNumber, Contract } from "ethers";

const useReverterRewards = false;
const useRewards = useReverterRewards
  ? "SimpleRewardsReverterMock" // Used for simulating failed batches
  : "SimpleRewards";

const giveTokens = async (
  token: Contract,
  holders: number,
  totalAmount: BigNumber
) => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);
  for (let i = 0; i < holders; i++) {
    const addr = "0x5" + prefixNum.add(i).toString();
    await token.transfer(addr, totalAmount.div(holders));
  }
};

async function main() {
  const tokenSupply = BigNumber.from(10000).mul(BigNumber.from("10").pow("18"));

  const tokenFact = await ethers.getContractFactory("MyTokenMock");
  const token = await tokenFact.deploy(tokenSupply);
  await token.deployed();

  const rewardsFact = await ethers.getContractFactory(useRewards);
  const rewards = await rewardsFact.deploy();
  await rewards.deployed();

  console.log(
    "Token deployed to:",
    token.address,
    "rewards at:",
    rewards.address
  );

  await giveTokens(token, 10, tokenSupply);

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
