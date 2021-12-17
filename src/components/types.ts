export interface SendParams {
  addresses: string[];
  amounts: number[];
  env: string;
}
export enum Env {
  Local,
  Test,
  Production,
}
