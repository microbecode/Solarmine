import { BigNumber, ethers } from "ethers";
import { Env, SendParams } from "../components/types";

// Split the reward list into chunks
export const splitDistribution = (params: SendParams, chunkSize: number): SendParams[] => {
  if (params.addresses.length != params.amounts.length) {
    throw "internal error";
  }

  const list: SendParams[] = [];

  let currItem: SendParams = { addresses: [], amounts: [] };
  for (let i = 0; i < params.addresses.length; i++) {
    currItem.addresses.push(params.addresses[i]);
    currItem.amounts.push(params.amounts[i]);

    if (currItem.addresses.length == chunkSize) {
      list.push({ ...currItem });
      currItem = { addresses: [], amounts: [] };
    }
  }
  if (currItem.addresses.length > 0) {
    list.push(currItem);
  }
  return list;
};

export const calcFullDistribution = async (
  contract: ethers.Contract,
  totalRewards: BigNumber,
  blacklist: string[]
): Promise<SendParams> => {
  const supply = BigNumber.from(await contract.totalSupply());
  const holders = (await contract.getHolders()) as string[];

  const adjustedSupply = supply; // TODO remove blacklisted balances
  const adjustedHolders = holders; // TODO remove blacklisted holders

  //console.log("calculating for ", totalRewards.toString(), adjustedSupply.toString(), adjustedHolders.length);

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
  /*   console.log(
    "result",
    ret,
    ret.amounts.map((r) => r.toString())
  ); */
  return ret;
  //console.log("contr", supply.toString(), contract);
};
