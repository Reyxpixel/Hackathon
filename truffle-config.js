const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    bsctestnet: { // Use this name in your deploy command
      provider: () => new HDWalletProvider(
        mnemonic,
        "https://bsc-testnet.publicnode.com"
      ),
      network_id: 97,               // <-- REQUIRED for BSC Testnet
      gas: 6000000,
      gasPrice: 20000000000,        // 20 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 100000
    }
  },
  compilers: {
    solc: {
      version: "0.8.21", // or "0.8.0" to match your contract
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    timeout: 100000
  }
};
