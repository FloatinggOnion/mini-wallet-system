#!/bin/bash

# Start Hardhat node in the background
npx hardhat node &

# Wait for the node to start
sleep 5

# Deploy the token contract
npx hardhat run scripts/deploy.ts --network localhost

# Keep the script running
wait 