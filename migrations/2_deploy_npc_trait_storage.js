const NpcTraitStorage = artifacts.require("NpcTraitStorage");

module.exports = async function (deployer) {
  await deployer.deploy(NpcTraitStorage);
};
