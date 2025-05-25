const { ethers } = require("hardhat");

async function fund() {
  const target = process.argv[2];
  const amount = process.argv[3] || "1"; // default 1 ETH
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = provider.getSigner();

  const tx = await signer.sendTransaction({
    to: target,
    value: ethers.utils.parseEther(amount),
  });
  console.log(`Funded ${target} with ${amount} ETH, txHash: ${tx.hash}`);
}

fund().catch((err) => {
  console.error(err);
  process.exit(1);
});