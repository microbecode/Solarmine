import { BigNumber } from "ethers";

export interface SendBatch {
  addresses: string[];
  amounts: BigNumber[];
  totalAmount: BigNumber;
  transactionHash?: string;
}

export interface ExportFile {
  batches: HumanizedSendBatch[];
}

export interface HumanizedSendBatch {
  totalAmount: string;
  transactionHash?: string;
  holders: HumanizedSendItem[];
}

export interface HumanizedSendItem {
  address: string;
  sentAmount: string;
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
