import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { deploySDQCharityFixture } from "./SDQCharity.fixture";

describe("SDQCharity", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("Token assets", function () {
    beforeEach(async function () {
      const { owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;
    });

    it("Should return correct decimal", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        expect(await this.deployedAssets[i].decimals()).to.be.equal(this.assets[i].decimals);
      }
    });

    it("Should unable to mintTo because it doesn't have permission", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        await expect(
          this.deployedAssets[i].connect(this.accounts[0]).mintTo(this.owner.address, 100),
        ).to.be.revertedWithCustomError(this.deployedAssets[i], "AccessControlUnauthorizedAccount");
      }
    });

    it("Should mintTo", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        await this.deployedAssets[i].connect(this.owner).mintTo(this.accounts[0].address, 100);
        expect(await this.deployedAssets[i].balanceOf(this.accounts[0].address)).to.be.equal(100);
      }
    });

    it("Should mint", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        await this.deployedAssets[i].connect(this.owner).mint();
        expect(await this.deployedAssets[i].balanceOf(this.owner.address)).to.be.equal(this.assets[i].mintAmount);
      }
    });
  });

  describe("Ban and Unban", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should ban user", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unban user", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
      await this.sdqCharity.connect(this.owner).unbanUser(this.accounts[0].address);
      await expect(this.sdqCharity.connect(this.accounts[0]).createCampaign("Test1", "Test1", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should fail to ban user because didn't have permission", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).banUser(this.accounts[1].address),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });

    it("Should fail to unban user because didn't have permission", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[1]).unbanUser(this.accounts[0].address),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Verify and unverify", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should verify user", async function () {
      await this.sdqCharity.connect(this.owner).verifyUser(this.accounts[0].address);
      expect(await this.sdqCharity.isVerifiedUser(this.accounts[0].address)).to.be.true;
    });

    it("Should unverify user", async function () {
      await this.sdqCharity.connect(this.owner).verifyUser(this.accounts[0].address);
      expect(await this.sdqCharity.isVerifiedUser(this.accounts[0].address)).to.be.true;
      await this.sdqCharity.connect(this.owner).unverifyUser(this.accounts[0].address);
      expect(await this.sdqCharity.isVerifiedUser(this.accounts[0].address)).to.be.false;
    });

    it("Should fail to verify user because didn't have permission", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).verifyUser(this.accounts[1].address),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });

    it("Should fail to unverify user because didn't have permission", async function () {
      await this.sdqCharity.connect(this.owner).verifyUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[1]).unverifyUser(this.accounts[0].address),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Add Token", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;
    });

    it("Should add token", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await expect(this.sdqCharity.connect(this.owner).addToken(address, "USDC")).to.be.emit(
        this.sdqCharity,
        "TokenAdded",
      );
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(1);
    });

    it("Should fail to add token because didn't have permission", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).addToken(await this.deployedAssets[0].getAddress(), "USDC"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });

    it("Should fail to add token because token address is zero", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).addToken(ethers.ZeroAddress, "USDC"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should fail to add token because token name is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).addToken(await this.deployedAssets[0].getAddress(), ""),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should fail to add token because token already added", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await expect(this.sdqCharity.connect(this.owner).addToken(address, "USDC")).to.be.emit(
        this.sdqCharity,
        "TokenAdded",
      );
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(1);
      await expect(this.sdqCharity.connect(this.owner).addToken(address, "USDC")).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationError",
      );
    });

    it("Should have 4 available tokens", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        await this.sdqCharity
          .connect(this.owner)
          .addToken(await this.deployedAssets[i].getAddress(), this.assets[i].ticker);
      }
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(4);
    });
  });

  describe("Remove Token", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
    });

    it("Should remove token", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await this.sdqCharity.connect(this.owner).addToken(address, "USDC");
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(1);
      await expect(this.sdqCharity.connect(this.owner).removeToken(address)).to.be.emit(
        this.sdqCharity,
        "TokenRemoved",
      );
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(0);
    });

    it("Should fail to remove token because didn't have permission", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await this.sdqCharity.connect(this.owner).addToken(address, "USDC");
      expect(await this.sdqCharity.getAvailableTokens()).to.be.lengthOf(1);
      await expect(this.sdqCharity.connect(this.accounts[0]).removeToken(address)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Should fail to remove token because token doesn't exist", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await expect(this.sdqCharity.connect(this.owner).removeToken(address)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationError",
      );
    });

    it("Should fail to remove token because token address is zero", async function () {
      await expect(this.sdqCharity.connect(this.owner).removeToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationError",
      );
    });
  });
});
