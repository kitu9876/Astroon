// AST Rewards testcases
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { upgrades } from "hardhat";

const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");

const truffleAssert = require("truffle-assertions");

describe("Unit Tests", function () {
  let token: any, astNft: any, astReward: any, admin: SignerWithAddress, user: SignerWithAddress;

  const recieveradr = "0x4F02C3102A9D2e1cC0cC97c7fE2429B9B6F5965D";

  beforeEach(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    user = signers[1];

    const astToken = await ethers.getContractFactory("ASTToken");
    token = await astToken.deploy();
    await token.deployed();
    //maxpresalelimit , mintoken, recieveradr, royaltyAmt
    const nft = await ethers.getContractFactory("ASTNFTSale");
    astNft = await upgrades.deployProxy(
      nft,
      [
        "ASTNFT",
        "AstNft",
        "http://ipfs.io/ipfs/",
        token.address,
        ".json",
        4,
        (110 * 10 ** 18).toString(),
        recieveradr,
        500,
      ],
      {
        initializer: "initialize",
      },
    );
    await astNft.deployed();

    const reward = await ethers.getContractFactory("ASTTokenRewards");
    astReward = await upgrades.deployProxy(reward, [astNft.address, token.address], {
      initializer: "initialize",
    });
    await astReward.deployed();

    await astNft.setRewardContract(astReward.address);

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const tx = await astNft.startPreSale(
      (1 * 10 ** 18).toString(),
      (0.1 * 10 ** 18).toString(),
      2400,
      timestamp,
      timestamp + 30 * 24 * 60 * 60,
    );
    var x = parseInt((await tx.wait()).logs[0].data);
  });

  describe("ASTNFT", () => {
    it("Testing rewards after nft reveal ", async function () {
      await token.transfer(user.address, (110 * 10 ** 18).toString()); //sent AST tokens to user
      var tx = await astNft.connect(user).buyPresale(1, { value: (1 * (1 * 10 ** 18 + 0.1 * 10 ** 18)).toString() });
      var txn = await tx.wait();
      await astNft.connect(admin).reveal();

      await ethers.provider.send("evm_increaseTime", [65 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      var tx = await astReward.getRewardsCalc(1);
      console.log("reward", parseInt(tx));
      await token.connect(admin).transfer(astReward.address, "1000000000000000000000".toString());
      await astReward.connect(user).claim();
      await ethers.provider.send("evm_increaseTime", [(365 * 2 + 300) * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      tx = await astReward.getRewardsCalc(1);
      console.log("reward", parseInt(tx));
    });
  });
});
