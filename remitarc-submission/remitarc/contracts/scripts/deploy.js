import hre from "hardhat";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  console.log("Deploying with:", deployer.address);
  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  const FEE_RECIPIENT = process.env.FEE_RECIPIENT || deployer.address;
  if (!USDC_ADDRESS) {
    throw new Error("Set USDC_ADDRESS in .env");
  }
  const artifact = await hre.artifacts.readArtifact("RemitArc");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const contract = await factory.deploy(USDC_ADDRESS, FEE_RECIPIENT);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("RemitArc deployed at:", address);
  console.log("USDC:", USDC_ADDRESS);
  console.log("Fee recipient:", FEE_RECIPIENT);
}

main().catch((err) => { console.error(err); process.exit(1); });
