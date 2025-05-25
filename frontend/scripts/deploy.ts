import { ethers } from "hardhat";

async function main() {
  console.log("Deploying to local network...");
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  // Optionally deploy a test token
  // const Token = await ethers.getContractFactory("ZoneToken");
  // const token = await Token.deploy();
  // await token.deployed();
  // console.log("ZoneToken deployed to:", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});