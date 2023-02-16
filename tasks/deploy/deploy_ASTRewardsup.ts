import hre from "hardhat";

require("@openzeppelin/hardhat-upgrades");
const { ethers, upgrades } = require("hardhat");
const add = "0xcAB7E2499Df2e4E4d74AF83f6a0484E25E3F1C32"; //ast token address

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contract = await ethers.getContractFactory("ASTILO");
  const ilo = await upgrades.deployProxy(contract, [add, 10000], { initializer: "initialize" });

  await ilo.deployed();

  console.log("Contract deployed to :", ilo.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.info("check");
    console.error(error);
    process.exit(1);
  });
