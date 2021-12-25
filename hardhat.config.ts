//require('dotenv').config()

import "@nomiclabs/hardhat-waffle";
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      blockGasLimit: 80000000,
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
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
