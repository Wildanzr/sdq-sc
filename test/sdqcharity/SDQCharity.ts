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
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;
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

  describe("Donate", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;

      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        await this.sdqCharity
          .connect(this.owner)
          .addToken(await this.deployedAssets[i].getAddress(), this.assets[i].ticker);

        const amount = 1000 * 10 ** 6;
        await this.deployedAssets[i].connect(this.owner).mintTo(this.accounts[0].address, amount);
        await this.deployedAssets[i].connect(this.accounts[0]).approve(await this.sdqCharity.getAddress(), amount);
      }

      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should unable to donate because paused", async function () {
      const donateAmount = 100 * 10 ** 6;
      await this.sdqCharity.connect(this.owner).pause();
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "EnforcedPause");
    });

    it("Should unable to donate because user is banned", async function () {
      const donateAmount = 100 * 10 ** 6;
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to donate because campaign doesn't exist", async function () {
      const donateAmount = 100 * 10 ** 6;
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(0, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(2, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because token doesn't exist", async function () {
      const mintAmount = 1000 * 10 ** 6;
      const donateAmount = 100 * 10 ** 6;
      await this.deployedAssets[3].connect(this.owner).mintTo(this.accounts[0].address, mintAmount);
      await this.deployedAssets[3].connect(this.accounts[0]).approve(await this.sdqCharity.getAddress(), mintAmount);
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[3].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "InvalidToken");
    });

    it("Should unable to donate because amount is 0", async function () {
      const donateAmount = 0;
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because token allowance is less than donate amount", async function () {
      const donateAmount = 1100 * 10 ** 6;
      const mintAmount = 1000 * 10 ** 6;
      await this.deployedAssets[0].connect(this.owner).mintTo(this.accounts[0].address, mintAmount);
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should failed to get campaign donations because campaign doesn't exist", async function () {
      await expect(this.sdqCharity.getCampaignDonations(0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
      await expect(this.sdqCharity.getCampaignDonations(2)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should donate correctly", async function () {
      const donateAmount = 100 * 10 ** 6;
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");

      const donations = await this.sdqCharity.getCampaignDonations(1);
      const addrIndex = donations[0].indexOf(await this.deployedAssets[0].getAddress());
      expect(donations[1][addrIndex]).to.be.equal(donateAmount);
    });

    it("Should donate correctly with multiple tokens", async function () {
      const donateAmount = 100 * 10 ** 6;
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");

      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");

      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[1].getAddress(), "Anonymous", "Hello World"),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");

      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[2].getAddress(), "Anonymous", "Hello World"),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");

      const donations = await this.sdqCharity.getCampaignDonations(1);
      const addrIndex0 = donations[0].indexOf(await this.deployedAssets[0].getAddress());
      const addrIndex1 = donations[0].indexOf(await this.deployedAssets[1].getAddress());
      const addrIndex2 = donations[0].indexOf(await this.deployedAssets[2].getAddress());
      expect(donations[1][addrIndex0]).to.be.equal(donateAmount * 2);
      expect(donations[1][addrIndex1]).to.be.equal(donateAmount);
      expect(donations[1][addrIndex2]).to.be.equal(donateAmount);
    });
  });
});
