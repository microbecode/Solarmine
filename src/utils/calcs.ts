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

  const contract = new ethers.Contract(tokenAddress, Token.abi, provider);
  const supply = await contract.totalSupply();
  const holders = await contract.getHolders();
  console.log("holders", holders);
  //console.log("contr", supply.toString(), contract);

  list.push({ addresses: ["a1", "b1"], amounts: [1001, 2001], env: env });
  //list.push({ addresses: ["a2", "b2"], amounts: [1002, 2002], env: env });
  return list;
};
