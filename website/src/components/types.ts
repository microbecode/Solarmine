import { BigNumber } from "ethers";

export interface SendBatch {
  addresses: string[];
  amounts: BigNumber[];
  totalAmount: BigNumber;
}

export interface SignedParams {
  signedMsg: string;
  originalMsg: SendBatch;
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
