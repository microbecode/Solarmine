import { BigNumber, ethers } from "ethers";
import { ContractAddress, Env, SendParams } from "../components/types";

// Split the reward list into chunks
export const splitDistribution = (
  params: SendParams,
  chunkSize: number
): SendParams[] => {
  if (params.addresses.length != params.amounts.length) {
    throw "internal error";
  }

  const list: SendParams[] = [];

  let currItemTotalAmount: BigNumber = BigNumber.from("0");
  let currItem: SendParams = {
    addresses: [],
    amounts: [],
    totalAmount: currItemTotalAmount,
  };

  for (let i = 0; i < params.addresses.length; i++) {
    currItem.addresses.push(params.addresses[i]);
    currItem.amounts.push(params.amounts[i]);
    currItemTotalAmount = currItemTotalAmount.add(params.amounts[i]);

    if (currItem.addresses.length === chunkSize) {
      currItem.totalAmount = currItemTotalAmount;
      currItemTotalAmount = BigNumber.from("0");
      list.push({ ...currItem });
      currItem = {
        addresses: [],
        amounts: [],
        totalAmount: BigNumber.from("0"),
      };
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
  blacklist: ContractAddress[]
): Promise<SendParams> => {
  const supply = BigNumber.from(await contract.totalSupply());
  const holders = (await contract.getHolders()) as string[];
  let adjustedSupply: BigNumber = supply;
  let adjustedHolders: string[] = holders;

  for (let i = 0; i < blacklist.length; i++) {
    const balance = await contract.balanceOf(blacklist[i].address);
    adjustedSupply = adjustedSupply.sub(balance);
    adjustedHolders = adjustedHolders.filter((h) => h !== blacklist[i].address);
  }

  // Used to avoid rounding issues
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
    totalAmount: totalRewards,
  };

  return ret;
};
