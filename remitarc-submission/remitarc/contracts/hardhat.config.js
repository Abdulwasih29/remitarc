import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
dotenv.config();

export default {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    arc_testnet: {
      type: "http",
      url: process.env.ARC_RPC_URL || "https://rpc.arc-testnet.circle.com",
      chainId: parseInt(process.env.ARC_CHAIN_ID || "5042002"),
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
};
