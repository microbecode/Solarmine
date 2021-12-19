import { BigNumber } from "ethers";
import { Env, SendParams } from "./types";

export const calcDistribution = (
  tokenAddress: string,
  amount: BigNumber,
  env: string
): SendParams[] => {
  const list: SendParams[] = [];
  list.push({ addresses: ["a1", "b1"], amounts: [1001, 2001], env: env });
  list.push({ addresses: ["a2", "b2"], amounts: [1002, 2002], env: env });
  return list;
};
