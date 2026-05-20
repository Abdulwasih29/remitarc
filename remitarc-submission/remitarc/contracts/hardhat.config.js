// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    arc_testnet: {
      url: process.env.ARC_RPC_URL || "https://rpc.arc-testnet.circle.com",
      chainId: parseInt(process.env.ARC_CHAIN_ID || "2911"),
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
};
