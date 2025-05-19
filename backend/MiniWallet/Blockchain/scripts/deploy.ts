import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ZoneToken = await ethers.getContractFactory("ZoneToken");
  const token = await ZoneToken.deploy();

  await token.waitForDeployment();

  console.log("ZoneToken deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 