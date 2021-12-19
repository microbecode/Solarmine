export interface SendParams {
  addresses: string[];
  amounts: number[];
  env: string;
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
