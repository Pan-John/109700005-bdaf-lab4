require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
const GOERLI_API_KEY=process.env.GOERLI_API_KEY;
const MTMS_PRIVATE_KEY=process.env.MTMS_PRIVATE_KEY;
const ETHERSCAN_API_KEY=process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: "0.8.18",
  gasReporter: {
    currency: 'CHF',
    gasPrice: 21
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${GOERLI_API_KEY}`,
      accounts: [MTMS_PRIVATE_KEY],
    },
  },
  etherscan:{
    apiKey: ETHERSCAN_API_KEY
  }
};
