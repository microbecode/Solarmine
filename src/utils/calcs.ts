import { BigNumber, ethers } from "ethers";
import { Env, SendParams } from "../components/types";
import ERC20_ABI from "../contracts/Token.json";

export const calcDistribution = (
  provider: ethers.providers.Provider,
  tokenAddress: string,
  amount: BigNumber,
  env: string
): SendParams[] => {
  const list: SendParams[] = [];

  const contract = new ethers.Contract(tokenAddress, ERC20_ABI.abi, provider);
  console.log("contr", contract);

  list.push({ addresses: ["a1", "b1"], amounts: [1001, 2001], env: env });
  list.push({ addresses: ["a2", "b2"], amounts: [1002, 2002], env: env });
  return list;
};
