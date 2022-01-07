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
    currItem.totalAmount = currItemTotalAmount;
    list.push(currItem);
  }
  return list;
};

export const calcFullDistribution = async (
  contract: ethers.Contract,
  totalRewards: BigNumber,
  blacklist: ContractAddress[],
  updateHoldersReceived: (
    holderAmount: number,
    holderBalanceAmount: number,
    total: number
  ) => void
): Promise<SendParams> => {
  console.log("starting");
  const supply = BigNumber.from(await contract.totalSupply());
  console.log("supply", supply);

  const holders = await getHolders(contract, updateHoldersReceived);
  console.log("got holders", holders.length);
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

    if (updateHoldersReceived) {
      updateHoldersReceived(adjustedHolders.length, i, adjustedHolders.length);
    }

    const rewardAmount: BigNumber = balance
      .mul(tempMultiplier)
      .div(adjustedSupply)
      .mul(totalRewards)
      .div(tempMultiplier);

    /*     console.log(
      "found holder",
      adjustedHolders[i],
      balance.toString(),
      rewardAmount.toString()
    ); */

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

const getHolders = async (
  contract: ethers.Contract,
  updateHoldersReceived: (
    holderAmount: number,
    holderBalanceAmount: number,
    total: number
  ) => void
): Promise<string[]> => {
  const batchSize = 50;
  const total = await contract.getHolderAmount();
  let allHolders: string[] = [];

  const batches = 15; //Math.ceil(total / batchSize);
  for (let i = 0; i < batches; i++) {
    const offset = i * batchSize;
    const batchHolders = (await contract.getPagedHolders(
      batchSize,
      offset
    )) as string[];
    allHolders = allHolders.concat(batchHolders);
    console.log("have holders: " + allHolders.length);
    if (updateHoldersReceived) {
      updateHoldersReceived(allHolders.length, 0, total);
    }
  }

  return allHolders;
};
