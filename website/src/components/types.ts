import { BigNumber } from "ethers";

export interface SendParams {
  addresses: string[];
  amounts: BigNumber[];
  totalAmount: BigNumber;
}

export interface SignedParams {
  signedMsg: string;
  originalMsg: SendParams;
}

export enum Env {
  Local,
  Test,
  Production,
}

export interface ContractAddress {
  address: string;
  title: string;
}
