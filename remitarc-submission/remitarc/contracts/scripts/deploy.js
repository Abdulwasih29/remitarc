// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Arc testnet USDC address (Circle official)
  const USDC_ARC_TESTNET = process.env.USDC_ADDRESS;
  const FEE_RECIPIENT    = process.env.FEE_RECIPIENT || deployer.address;

  if (!USDC_ARC_TESTNET) {
    throw new Error("Set USDC_ADDRESS in .env");
  }

  const RemitArc = await ethers.getContractFactory("RemitArc");
  const contract = await RemitArc.deploy(USDC_ARC_TESTNET, FEE_RECIPIENT);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("RemitArc deployed at:", address);
  console.log("USDC:", USDC_ARC_TESTNET);
  console.log("Fee recipient:", FEE_RECIPIENT);

  // Verify on Arc explorer
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network arc_testnet ${address} ${USDC_ARC_TESTNET} ${FEE_RECIPIENT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
