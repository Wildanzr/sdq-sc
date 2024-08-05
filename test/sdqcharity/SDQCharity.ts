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

  describe("Pause and Unpause", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should pause", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      expect(await this.sdqCharity.connect(this.owner).paused()).to.be.true;
    });

    it("Should unpause", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      expect(await this.sdqCharity.connect(this.owner).paused()).to.be.true;
      await this.sdqCharity.connect(this.owner).unpause();
      expect(await this.sdqCharity.connect(this.owner).paused()).to.be.false;
    });

    it("Should fail to pause because didn't have permission", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).pause()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Should fail to unpause because didn't have permission", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      expect(await this.sdqCharity.connect(this.owner).paused()).to.be.true;
      await expect(this.sdqCharity.connect(this.accounts[0]).unpause()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccessControlUnauthorizedAccount",
      );
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
      const tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal("USDC");
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
      const tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(4);
      expect(tokens[1].length).to.be.equal(4);
      for (let i = 0; i < tokens[0].length; i++) {
        expect(tokens[0][i]).to.be.equal(await this.deployedAssets[i].getAddress());
        expect(tokens[1][i]).to.be.equal(this.assets[i].ticker);
      }
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
      let tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal("USDC");
      await expect(this.sdqCharity.connect(this.owner).removeToken(address)).to.be.emit(
        this.sdqCharity,
        "TokenRemoved",
      );
      tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(0);
      expect(tokens[1].length).to.be.equal(0);
    });

    it("Should fail to remove token because didn't have permission", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await this.sdqCharity.connect(this.owner).addToken(address, "USDC");
      const tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal("USDC");
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

  describe("Create Campaign", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
    });

    it("Should unable to create campaign because still paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      expect(await this.sdqCharity.connect(this.owner).paused()).to.be.true;
      await expect(
        this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "EnforcedPause");
    });

    it("Should unable to create campaign because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to create campaign because title is empty", async function () {
      await expect(this.sdqCharity.connect(this.owner).createCampaign("", "Test", 100)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should unable to create campaign because details is empty", async function () {
      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "", 100)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should unable to create campaign because target is 0", async function () {
      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", 0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should create campaign correctly", async function () {
      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
      const res = await this.sdqCharity.getCampaignDetails(1);
      expect(res.title).to.be.equal("Test");
      expect(res.details).to.be.equal("Test");
      expect(res.target).to.be.equal(100);
      expect(res.owner).to.be.equal(this.owner.address);
      await expect(this.sdqCharity.getCampaignDetails(0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
      await expect(this.sdqCharity.getCampaignDetails(2)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });
  });
});
