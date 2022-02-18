//const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const rent = await deploy("Rent", {
    from: deployer,
    log: true,
  });

  await deploy("Payment", {
    from: deployer,
    args: [rent.address],
    log: true,
  });
};
module.exports.tags = ["Payment"];
