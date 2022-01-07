//require('dotenv').config()

import "@nomiclabs/hardhat-waffle";
import dotenv from "dotenv";
dotenv.config();

const providerMainnet = process.env.MAINNET_PROVIDER_URL;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const settings = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      forking: {
        url: providerMainnet,
        blockNumber: 14156100,
      },
    },
  },
  mocha: {
    timeout: 200000,
  },
};
module.exports = settings;
