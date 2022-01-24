import { BigNumber, ethers } from "ethers";
import { ContractAddress, Env, SendBatch } from "../components/types";

// Split the reward list into chunks
export const splitDistribution = (
  params: SendBatch,
  chunkSize: number
): SendBatch[] => {
  if (params.addresses.length != params.amounts.length) {
    throw "internal error";
  }

  const list: SendBatch[] = [];

  let currItemTotalAmount: BigNumber = BigNumber.from("0");
  let currItem: SendBatch = {
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
    total: number,
    totalHoldersToCheck: number
  ) => void
): Promise<SendBatch> => {
  const holders = await getHolders(contract, updateHoldersReceived);
  let afterBlacklistRemovalHolders: string[] = [...holders];
  let totalBalance: BigNumber = BigNumber.from("0");

  for (let i = 0; i < blacklist.length; i++) {
    afterBlacklistRemovalHolders = afterBlacklistRemovalHolders.filter(
      (h) => h !== blacklist[i].address
    );
  }
  /*   console.log(
    "now holders",
    afterBlacklistRemovalHolders.length,
    blacklist.length
  ); */

  var balances: BigNumber[] = [];

  for (let i = 0; i < afterBlacklistRemovalHolders.length; i++) {
    const balance = await contract.balanceOf(afterBlacklistRemovalHolders[i]);
    balances.push(balance);

    if (updateHoldersReceived) {
      updateHoldersReceived(
        holders.length,
        i + 1,
        holders.length,
        afterBlacklistRemovalHolders.length
      );
    }

    totalBalance = totalBalance.add(balance);
  }
  console.log("using total balance " + totalBalance.toString());

  // Used to avoid rounding issues
  const tempMultiplier = BigNumber.from("10").pow(BigNumber.from("15"));

  const amounts: BigNumber[] = [];
  const addresses: string[] = [];

  for (let i = 0; i < afterBlacklistRemovalHolders.length; i++) {
    const balance = balances[i];

    const rewardAmount: BigNumber = balance
      .mul(tempMultiplier)
      .div(totalBalance)
      .mul(totalRewards)
      .div(tempMultiplier);

    /*     console.log(
      "found holder",
      adjustedHolders[i],
      balance.toString(),
      rewardAmount.toString()
    ); */

    addresses.push(afterBlacklistRemovalHolders[i]);
    amounts.push(rewardAmount);
  }

  const ret: SendBatch = {
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
    total: number,
    totalHoldersToCheck: number
  ) => void
): Promise<string[]> => {
  const batchSize = 50;
  const total = await contract.getHolderAmount();
  let allHolders: string[] = [];

  const batches = Math.ceil(total / batchSize);
  for (let i = 0; i < batches; i++) {
    const offset = i * batchSize;
    //console.log('batch', i, offset)
    const batchHolders = (await contract.getPagedHolders(
      batchSize,
      offset
    )) as string[];
    allHolders = allHolders.concat(batchHolders);
    console.log("have holders: " + allHolders.length);
    if (updateHoldersReceived) {
      updateHoldersReceived(allHolders.length, 0, total, allHolders.length);
    }
  }

  return allHolders;
};
