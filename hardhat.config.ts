//require('dotenv').config()

import "@nomiclabs/hardhat-waffle";
import dotenv from "dotenv";
dotenv.config();
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const privKeyTestnet = process.env.TESTNET_PRIVATE_KEY;
const providerTestnet = process.env.TESTNET_PROVIDER_URL;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      blockGasLimit: 80000000,
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
      /*       mining: {
        auto: false,
        interval: 5000,
      }, */
    },
    bsctestnet: {
      url: providerTestnet,
      accounts: [privKeyTestnet],
      gasPrice: 1000000000, // 1gwei
    },
  },
  mocha: {
    timeout: 200000,
  },
  /*   gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  }, */
  /*   etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }, */
};
