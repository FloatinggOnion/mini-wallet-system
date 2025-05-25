import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "local",
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        // A pre-funded private key for dev; only use in development
        "0x59c6995e998f97a5a0044966f094538c4a2b5a59db6f2394a0ed1158a8072ca7"
      ],
    },
    hardhat: {},
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
};

export default config;
