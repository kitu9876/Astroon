// AST Rewards testcases
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { upgrades } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { soliditySha3 } from "web3-utils";

const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");

const truffleAssert = require("truffle-assertions");

describe("Unit Tests", function () {
  let token: any, astilo: any, admin: SignerWithAddress, userA: SignerWithAddress, userB: SignerWithAddress;

  beforeEach(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    userA = signers[1];
    userB = signers[2];

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const _rate = "780000000000000"; //.00078 ether
    const _cap = "7800000000000000000";
    const _start = timestamp;
    const _ddays = (30).toString();
    const _threshold = "500000000000000000000"; //500
    const _cliff = (120).toString();
    const _vesting = (900).toString();
    const _minBound = "50000000000000000000"; //50

    const astToken = await ethers.getContractFactory("ASTToken");
    token = await astToken.deploy();
    await token.deployed();

    const ilo = await ethers.getContractFactory("ASTILO");
    astilo = await upgrades.deployProxy(ilo, [token.address, "5000000000000000000000"], {
      initializer: "initialize",
    });
    await astilo.deployed();
    /*  uint256 _rate,
        uint256 _cap,
        uint256 _start,
        uint256 _ddays,
        uint256 _thresHold,
        uint256 _cliff,
        uint256 _vesting,
        uint256 _minBound */
    await astilo.togglePresale();
    const tx = await astilo.startTokenSale(_rate, _cap, _start, _ddays, _threshold, _cliff, _vesting, _minBound);
    var x = parseInt((await tx.wait()).logs[0].data);
  });

  describe("ASTILO unit testing ", () => {
    async function merkleTree() {
      const whitelistAddresses = [soliditySha3(userA.address)];
      const merkleTree = new MerkleTree(whitelistAddresses, soliditySha3, { sortPairs: true });
      const rootHash = merkleTree.getHexRoot();
      console.log("Whitelist Merkle Tree\n", merkleTree.toString());
      console.log("Root Hash: ", rootHash);
      const claimingAddress = whitelistAddresses[0] || "";
      const hexProof = merkleTree.getHexProof(claimingAddress);
      console.log(hexProof);
      await astilo.setMerkleRoot(rootHash);
      return hexProof;
    }

    it("Starting sale for seed phase ", async function () {
      const m = await merkleTree();

      await token.transfer(astilo.address, "5000000000000000000000"); //sent AST tokens to user
      //  await token.connect(token).approve(astilo.address, "2000000000000000000000");

      var tx = await astilo.connect(userA).preSaleBuy(m, { value: "78000000000000000" });
      var txn = await tx.wait(); //100

      await ethers.provider.send("evm_increaseTime", [12 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      var tx = await astilo.connect(userA).preSaleBuy(m, { value: "156000000000000000" });
      var txn = await tx.wait(); //200

      await ethers.provider.send("evm_increaseTime", [140 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      var tx = await astilo.connect(userA).getReward((1).toString(), userA.address);
      console.log("get reward value1", parseInt(tx));

      var tx = await astilo.connect(userA).claim((1).toString());
      var txn = await tx.wait();
      console.log("claimed first time", txn.events[1].args["amount"]); //6666666667000000000

      await ethers.provider.send("evm_increaseTime", [180 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      var tx = await astilo.connect(userA).getReward((1).toString(), userA.address);
      console.log("get reward value2", parseInt(tx));

      var tx = await astilo.connect(userA).claim((1).toString());
      var txn = await tx.wait();
      console.log("claimed second time", txn.events[1].args["amount"]);

      var tx = await token.balanceOf(userA.address);

      console.log("reward", tx);
    });
  });
});
