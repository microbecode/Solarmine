import { BigNumber, ethers } from "ethers";
import { Env, SendParams } from "../components/types";
import Token from "../contracts/Token.json";

export const calcDistribution = async (
  provider: ethers.providers.Provider,
  tokenAddress: string,
  amount: BigNumber,
  env: string
): Promise<SendParams[]> => {
  const list: SendParams[] = [];

  const full = await calcFullDistribution(provider, tokenAddress, amount, env);

  list.push({
    addresses: ["a1", "b1"],
    amounts: [BigNumber.from("10"), BigNumber.from("20")],
    env: env,
  });
  //list.push({ addresses: ["a2", "b2"], amounts: [1002, 2002], env: env });
  return list;
};

const calcFullDistribution = async (
  provider: ethers.providers.Provider,
  tokenAddress: string,
  totalRewards: BigNumber,
  env: string
): Promise<SendParams> => {
  const contract = new ethers.Contract(tokenAddress, Token.abi, provider);

  const supply = BigNumber.from(await contract.totalSupply());
  const holders = (await contract.getHolders()) as string[];

  const adjustedSupply = supply; // TODO remove blacklisted balances
  const adjustedHolders = holders; // TODO remove blacklisted holders

  console.log(
    "calculating for ",
    totalRewards.toString(),
    adjustedSupply.toString(),
    adjustedHolders.length
  );

  const tempMultiplier = BigNumber.from("10").pow(BigNumber.from("15"));

  const amounts: BigNumber[] = [];
  const addresses: string[] = [];

  for (let i = 0; i < adjustedHolders.length; i++) {
    const balance = await contract.balanceOf(adjustedHolders[i]);

    const rewardAmount = balance
      .mul(tempMultiplier)
      .div(adjustedSupply)
      .mul(totalRewards)
      .div(tempMultiplier);

    addresses.push(adjustedHolders[i]);
    amounts.push(rewardAmount);
  }

  const ret: SendParams = {
    addresses: addresses,
    amounts: amounts,
    env: env,
  };
  console.log(
    "result",
    ret,
    ret.amounts.map((r) => r.toString())
  );
  return ret;
  //console.log("contr", supply.toString(), contract);
};
