const MemoryProof = artifacts.require("MemoryProof");

module.exports = function (deployer) {
  deployer.deploy(MemoryProof);
};
