import { BigNumber, ethers } from "ethers";
import { Env, SendParams } from "../components/types";

export const splitDistribution = async (params: SendParams, chunkSize: number): Promise<SendParams[]> => {
  const list: SendParams[] = [];

  list.push(params);
  //list.push({ addresses: ["a2", "b2"], amounts: [1002, 2002], env: env });
  return list;
};

export const calcFullDistribution = async (contract: ethers.Contract, totalRewards: BigNumber): Promise<SendParams> => {
  const supply = BigNumber.from(await contract.totalSupply());
  const holders = (await contract.getHolders()) as string[];

  const adjustedSupply = supply; // TODO remove blacklisted balances
  const adjustedHolders = holders; // TODO remove blacklisted holders

  console.log("calculating for ", totalRewards.toString(), adjustedSupply.toString(), adjustedHolders.length);

  // Used to avoid rounding issues
  const tempMultiplier = BigNumber.from("10").pow(BigNumber.from("15"));

  const amounts: BigNumber[] = [];
  const addresses: string[] = [];

  for (let i = 0; i < adjustedHolders.length; i++) {
    const balance = await contract.balanceOf(adjustedHolders[i]);

    const rewardAmount = balance.mul(tempMultiplier).div(adjustedSupply).mul(totalRewards).div(tempMultiplier);

    addresses.push(adjustedHolders[i]);
    amounts.push(rewardAmount);
  }

  const ret: SendParams = {
    addresses: addresses,
    amounts: amounts,
  };
  console.log(
    "result",
    ret,
    ret.amounts.map((r) => r.toString())
  );
  return ret;
  //console.log("contr", supply.toString(), contract);
};
