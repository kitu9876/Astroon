import hre from "hardhat";

const { ethers, upgrades } = require("hardhat");

const add1 = "0xcAB7E2499Df2e4E4d74AF83f6a0484E25E3F1C32"; //ast token address  //ast token address

const Proxy1 = "0xd0be3d67c9c50c7BA53EF892210C514a1a573a51";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contract = await ethers.getContractFactory("ASTILO");
  //const Con = await upgrades.deployProxy(contract,[add1, 10000], {initializer :"initialize"});
  const ilo = await upgrades.upgradeProxy(Proxy1, contract);

  await ilo.deployed();

  console.log("Contract deployed to :", ilo.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
