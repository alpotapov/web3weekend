const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

console.log('TESTING')

use(solidity);

describe("Social Recovery with AccessNFT", async () => {
  let accessNftContract;
  let accessNFTFactory;
  let deployer;
  let account1;
  let account2;
  let account3;
  let account4;
  let guardians;

  // quick fix to let gas reporter fetch accessNFTa from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Contract Deployment", async () => {
    before((done) => {
      ethers.getSigners().then((signers) => {
        deployer = signers[0];
        account1 = signers[1];
        account2 = signers[2];
        account3 = signers[3];
        account4 = signers[4];
        guardians = [account1.address, account2.address, account3.address];
      }).then(() => done());
    })
    it("Should deploy AccessNFT", async () => {
      accessNFTFactory = await ethers.getContractFactory(
        "AccessNFT"
      );

      accessNftContract = await accessNFTFactory.deploy();
    });

    describe("Minting new AccessNFT", () => {
      it("should mint new token", async () => {
        await accessNftContract.mint(guardians);
        expect(await accessNftContract.balanceOf(deployer.address)).to.equal(
          ethers.BigNumber.from(1)
        );
      });

      it("should have guardians assigned", async () => {
        const guardians = await accessNftContract.getMyGuardians();
        const guardianAddresses = guardians.map((g) => g[0]);
        expect(guardianAddresses).to.contain(account1.address);
      });

      it("should allow guardians to transfer token to a new address", async () => {
        const accessNFT = await accessNFTFactory.deploy();
        await accessNFT.mint(guardians);

        let currentOwner = await accessNFT.ownerOf(1);
        expect(currentOwner).to.be.equal(deployer.address);

        // await accessNFT
        //   .connect(account1)
        //   .recoverTokenTo(deployer.address, account4.address);
        // currentOwner = await accessNFT.ownerOf(1);
        // expect(currentOwner).to.be.equal(deployer.address);

        await accessNFT
          .connect(account2)
          .recoverTokenTo(deployer.address, account4.address);
        currentOwner = await accessNFT.ownerOf(1);
        expect(currentOwner).to.be.equal(account4.address);
      });

      it("should preserve guardians between token transfers", () => {});
    });
  });
});
