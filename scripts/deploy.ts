import { artifacts, ethers, network } from "hardhat";
import * as fs from "fs";
import { BigNumber, Contract } from "ethers";
const hre = require("hardhat");

const useReverterRewards = false;
const useRewards = useReverterRewards
  ? "SimpleRewardsReverterMock" // Used for simulating failed batches
  : "SimpleRewards";

const mintBatch = 50;
const holderAmount = 100;

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
      console.log("minting... ", i + 1);
      await token.mintMany(addrs, amounts);
      receivers = [];
    }
  }

  if (receivers.length > 0) {
    await token.mintMany(
      receivers.map((r) => r.address),
      receivers.map((r) => r.amount)
    );
  }
};

const giveFew = async (token: Contract, amounts: BigNumber[]) => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);
  for (let i = 0; i < amounts.length; i++) {
    const addr = "0x6" + prefixNum.add(i).toString();
    await token.mint(addr, amounts[i]);
  }
};

const giveTokensForSpeficicTesting = async (
  token: Contract
) => {
  let prefixNum = ethers.BigNumber.from("10").pow(38);

  const exp = BigNumber.from("10").pow(18);

  let receivers: Holder[] = [];

  const lpAmount = BigNumber.from("25").mul(exp);

  // wannabe-LP tokens
  await token.mint("0x6" + prefixNum.toString(), lpAmount, { gasLimit: BigNumber.from("10").pow(BigNumber.from("7")) });

  console.log("minting for " + "0x6" + prefixNum.toString() + " amount " + lpAmount.toString());

  for (let a = 0; a < 4; a++) {
    for (let i = 1; i < 26; i++) {
      const addr = "0x6" + prefixNum.add(i + (a * 100)).toString();
      const amount = BigNumber.from((10 * (a + 1)).toString()).mul(exp);

      receivers.push({address: addr, amount: amount});

      console.log("minting for " + addr + " amount " + amount.toString());
    }
  }

  const addrs = receivers.map((r) => r.address);
  const amounts = receivers.map((r) => r.amount);

  await token.mintMany(addrs, amounts, { gasLimit: BigNumber.from("10").pow(BigNumber.from("7")) });
  
};

async function main() {
  const accounts = await hre.ethers.getSigners();

  const mintableSupply = BigNumber.from(10000).mul(
    BigNumber.from("10").pow("18")
  );
  const zero = BigNumber.from("0");
  const initialSupply = BigNumber.from(1).mul(BigNumber.from("10").pow("18"));

  const tokenFact = await ethers.getContractFactory("MyTokenMock");
  const token = await tokenFact.deploy(initialSupply);
  await token.deployed();

  const rewardsFact = await ethers.getContractFactory(useRewards);
  const rewards = await rewardsFact.deploy();
  await rewards.deployed();

  await saveFrontendFiles(token.address, rewards.address);

  await verifyContracts(token.address, initialSupply, rewards.address);


  await token.burn(accounts[0].address, initialSupply); // burn his tokens so totalSupply is zero

  //await giveTokens(token, holderAmount, mintableSupply);
  await giveTokensForSpeficicTesting(token);

   const holders = await token.getHolderAmount();

  /*   
  await token.mint(
    "0x6100000000000000000000000000000000000008",
    BigNumber.from("3")
  ); // give some tokens for a blacklisted address
  await giveFew(token, [BigNumber.from("1"), BigNumber.from("2")]); */

  console.log(
    "All done. Token deployed to:",
    token.address,
    "rewards at:",
    rewards.address,
    "holder amount",
    holders.toString()
  );
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

const verifyContracts = async (
  tokenAddr: string,
  tokenArgs: BigNumber,
  rewardAddr: string
) => {
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for the contracts to be distributed in BSCscan...");

    await delay(30000);

    try {
      await hre.run("verify:verify", {
        address: tokenAddr,
        constructorArguments: [tokenArgs],
      });
    } catch (ex: any) {
      if (ex.toString().indexOf("Already Verified") == -1) {
        throw ex;
      }
    }

    try {
      await hre.run("verify:verify", {
        address: rewardAddr,
        constructorArguments: [],
      });
    } catch (ex: any) {
      if (ex.toString().indexOf("Already Verified") == -1) {
        throw ex;
      }
    }

    console.log("Verification done");
  }
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
