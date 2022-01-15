import { artifacts, ethers } from "hardhat";
import * as fs from "fs";
import { BigNumber, Contract } from "ethers";

const useReverterRewards = false;
const useRewards = useReverterRewards
  ? "SimpleRewardsReverterMock" // Used for simulating failed batches
  : "SimpleRewards";

const mintBatch = 50;

interface Holder {
  address: string;
  amount: BigNumber;
}

const giveTokens = async (
  token: Contract,
  holders: number,
  totalAmount: BigNumber
) => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);

  let receivers: Holder[] = [];

  let divider = 100;
  if (holders > 1000) {
    divider = 1000;
  }
  let shared = BigNumber.from("0");
  for (let i = 0; i < holders; i++) {
    const addr = "0x6" + prefixNum.add(i).toString();
    const percent = totalAmount.sub(shared).div(divider);
    shared = shared.add(percent);
    const holder: Holder = {
      address: addr,
      amount: percent,
    };
    receivers.push(holder);

    if (receivers.length % mintBatch == 0 && receivers.length > 0) {
      const addrs = receivers.map((r) => r.address);
      const amounts = receivers.map((r) => r.amount);
      console.log("minting ", i);
      await token.mintMany(addrs, amounts);
      receivers = [];
    }
  }

  await token.mintMany(
    receivers.map((r) => r.address),
    receivers.map((r) => r.amount)
  );

  for (let i = 0; i < receivers.length; i++) {}
};

async function main() {
  const tokenSupply = BigNumber.from(10000).mul(BigNumber.from("10").pow("18"));

  const tokenFact = await ethers.getContractFactory("MyTokenMock");
  const token = await tokenFact.deploy(BigNumber.from("0"));
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

  await giveTokens(token, 105, tokenSupply);

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
