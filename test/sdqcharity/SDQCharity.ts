import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";
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
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unban user", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
      await this.sdqCharity.connect(this.owner).unbanUser(this.accounts[0].address);
      await expect(this.sdqCharity.connect(this.accounts[0]).createCampaign("Test1", "Test", "Test1", 100)).to.be.emit(
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
      await expect(
        this.sdqCharity.connect(this.owner).addToken(address, this.assets[0].ticker, this.assets[0].decimals),
      ).to.be.emit(this.sdqCharity, "TokenAdded");
    });

    it("Should fail to add token because didn't have permission", async function () {
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .addToken(await this.deployedAssets[0].getAddress(), this.assets[0].ticker, this.assets[0].decimals),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccessControlUnauthorizedAccount");
    });

    it("Should fail to add token because token address is zero", async function () {
      await expect(
        this.sdqCharity
          .connect(this.owner)
          .addToken(ethers.ZeroAddress, this.assets[0].ticker, this.assets[0].decimals),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should fail to add token because token name is empty", async function () {
      await expect(
        this.sdqCharity
          .connect(this.owner)
          .addToken(await this.deployedAssets[0].getAddress(), "", this.assets[0].decimals),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should fail to add token because token decimal is zero", async function () {
      await expect(
        this.sdqCharity
          .connect(this.owner)
          .addToken(await this.deployedAssets[0].getAddress(), this.assets[0].ticker, 0),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should fail to add token because token already added", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await expect(
        this.sdqCharity.connect(this.owner).addToken(address, this.assets[0].ticker, this.assets[0].decimals),
      ).to.be.emit(this.sdqCharity, "TokenAdded");
      const tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal(this.assets[0].ticker);
      await expect(
        this.sdqCharity.connect(this.owner).addToken(address, this.assets[0].ticker, this.assets[0].decimals),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationError");
    });

    it("Should have 4 available tokens", async function () {
      for (let i = 0; i < this.deployedAssets.length; i++) {
        await this.sdqCharity
          .connect(this.owner)
          .addToken(await this.deployedAssets[i].getAddress(), this.assets[i].ticker, this.assets[i].decimals);
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
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;
    });

    it("Should remove token", async function () {
      const address = await this.deployedAssets[0].getAddress();
      await this.sdqCharity.connect(this.owner).addToken(address, this.assets[0].ticker, this.assets[0].decimals);
      let tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal(this.assets[0].ticker);
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
      await this.sdqCharity.connect(this.owner).addToken(address, this.assets[0].ticker, this.assets[0].decimals);
      const tokens = await this.sdqCharity.getAvailableTokens();
      expect(tokens[0].length).to.be.equal(1);
      expect(tokens[1].length).to.be.equal(1);
      expect(tokens[0][0]).to.be.equal(address);
      expect(tokens[1][0]).to.be.equal(this.assets[0].ticker);
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
        this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "EnforcedPause");
    });

    it("Should unable to create campaign because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to create campaign because title is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).createCampaign("", "Test", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to create campaign because description is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).createCampaign("Test", "", "Test", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to create campaign because details is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "", 100),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to create campaign because target is 0", async function () {
      await expect(
        this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 0),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should create campaign correctly", async function () {
      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
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
      expect(await this.sdqCharity.campaignCount(this.owner.address)).to.be.equal(1);

      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          await this.sdqCharity.connect(this.accounts[0]).createCampaign(`Test ${i}`, "Test", "Test", 100);
        } else {
          await this.sdqCharity.connect(this.owner).createCampaign(`Test ${i}`, "Test", "Test", 100);
        }
      }
      console.log("Number ", await this.sdqCharity.numberOfCampaigns());
      const restuls = await this.sdqCharity.connect(this.owner).getMyCampaignIndex(1, 20);
      console.log("Owner", restuls);
      const restul1 = await this.sdqCharity.connect(this.owner).getMyCampaignIndex(2, 20);
      console.log("Owner", restul1);

      const pag = await this.sdqCharity.getPaginatedCampaignsIndex(1, 20);
      const pag2 = await this.sdqCharity.getPaginatedCampaignsIndex(2, 20);
      console.log("Paginated1", pag);
      console.log("Paginated2", pag2);
    });
  });

  describe("Pause Campaign", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;

      await expect(this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should failed to pause campaign because contract is paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      await expect(this.sdqCharity.connect(this.accounts[0]).pauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "EnforcedPause",
      );
    });

    it("Should failed to pause campaign because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(this.sdqCharity.connect(this.accounts[0]).pauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should failed to pause campaign because campaign doesn't exist", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).pauseCampaign(0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
      await expect(this.sdqCharity.connect(this.accounts[0]).pauseCampaign(2)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should failed to pause campaign because not the owner", async function () {
      await expect(this.sdqCharity.connect(this.accounts[1]).pauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should pause campaign", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).pauseCampaign(1)).to.be.emit(
        this.sdqCharity,
        "CampaignPaused",
      );
      expect((await this.sdqCharity.getCampaignDetails(1)).paused).to.be.true;
    });
  });

  describe("Unpause Campaign", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;

      await expect(this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
      await this.sdqCharity.connect(this.accounts[0]).pauseCampaign(1);
    });

    it("Should failed to unpause campaign because contract is paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      await expect(this.sdqCharity.connect(this.accounts[0]).unpauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "EnforcedPause",
      );
    });

    it("Should failed to unpause campaign because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(this.sdqCharity.connect(this.accounts[0]).unpauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should failed to unpause campaign because campaign doesn't exist", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).unpauseCampaign(0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
      await expect(this.sdqCharity.connect(this.accounts[0]).unpauseCampaign(2)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should failed to unpause campaign because not the owner", async function () {
      await expect(this.sdqCharity.connect(this.accounts[1]).unpauseCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should unpause campaign", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).unpauseCampaign(1)).to.be.emit(
        this.sdqCharity,
        "CampaignUnpaused",
      );
      expect((await this.sdqCharity.getCampaignDetails(1)).paused).to.be.false;
    });
  });

  describe("Update Campaign", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedAssets, assets } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedAssets = deployedAssets;
      this.assets = assets;

      await expect(this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should unable to update campaign because contract is paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "EnforcedPause");
    });

    it("Should unable to update campaign because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to update campaign because campaign doesn't exist", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(0, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(2, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to update campaign because not the owner", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[1]).updateCampaign(1, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to update campaign because already claimed", async function () {
      const ethDonation = parseEther("10");
      await this.sdqCharity.connect(this.accounts[1]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      await this.sdqCharity.connect(this.accounts[0]).withdrawCampaign(1);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to update campaign because title is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "", "Test1", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to update campaign because details is empty", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "", 200),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to update campaign because target is 0", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "Test1", 0),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should update campaign correctly", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).updateCampaign(1, "Test1", "Test1", 200)).to.be.emit(
        this.sdqCharity,
        "CampaignUpdated",
      );
      const res = await this.sdqCharity.getCampaignDetails(1);
      expect(res.title).to.be.equal("Test1");
      expect(res.details).to.be.equal("Test1");
      expect(res.target).to.be.equal(200);
      expect(res.owner).to.be.equal(this.accounts[0].address);
    });
  });

  describe("Donate Campaign With Token", function () {
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
          .addToken(await this.deployedAssets[i].getAddress(), this.assets[i].ticker, this.assets[i].decimals);

        const amount = 1000 * 10 ** 6;
        await this.deployedAssets[i].connect(this.owner).mintTo(this.accounts[0].address, amount);
        await this.deployedAssets[i].connect(this.accounts[0]).approve(await this.sdqCharity.getAddress(), amount);
      }

      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
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

    it("Should unable to donate because campaign is paused", async function () {
      const donateAmount = 100 * 10 ** 6;
      await this.sdqCharity.connect(this.owner).pauseCampaign(1);
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because campaign is already claimed", async function () {
      const ethDonation = parseEther("10");
      const randomAmount: number[] = [];

      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        randomAmount.push(Math.floor(Math.random() * 100) + 1);
        await this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(
            1,
            randomAmount[i] * 10 ** 6,
            await this.deployedAssets[i].getAddress(),
            "Anonymous",
            "Hello World",
          );
      }
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation }),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(ethDonation);

      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(1)).to.be.emit(
        this.sdqCharity,
        "CampaignClaimed",
      );

      const donateAmount = 100 * 10 ** 6;
      await expect(
        this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(1, donateAmount, await this.deployedAssets[0].getAddress(), "Anonymous", "Hello World"),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because campaign is paused", async function () {
      const donateAmount = 100 * 10 ** 6;
      await this.sdqCharity.connect(this.owner).pauseCampaign(1);
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
      expect(await this.sdqCharity.donationCount(this.accounts[0].address)).to.be.equal(1);
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
      expect(await this.sdqCharity.donationCount(this.accounts[0].address)).to.be.equal(4);
    });
  });

  describe("Donate Campaign With ETH", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;

      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should unable to donate because contract is paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "EnforcedPause");
    });

    it("Should unable to donate because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "AccountError");
    });

    it("Should unable to donate because campaign doesn't exist", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(0, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(2, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because amount is 0", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: 0 }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because campaign is paused", async function () {
      await this.sdqCharity.connect(this.owner).pauseCampaign(1);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should unable to donate because campaign is already claimed", async function () {
      const ethDonation = parseEther("10");
      await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      await this.sdqCharity.connect(this.owner).withdrawCampaign(1);
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation }),
      ).to.be.revertedWithCustomError(this.sdqCharity, "ValidationFailed");
    });

    it("Should donate correctly", async function () {
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: parseEther("100") }),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(parseEther("100"));
      expect(await this.sdqCharity.donationCount(this.accounts[0].address)).to.be.equal(1);
    });
  });

  describe("Withdraw Campaign", function () {
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
          .addToken(await this.deployedAssets[i].getAddress(), this.assets[i].ticker, this.assets[i].decimals);

        const amount = 10000 * 10 ** 6;
        await this.deployedAssets[i].connect(this.owner).mintTo(this.accounts[0].address, amount);
        await this.deployedAssets[i].connect(this.accounts[0]).approve(await this.sdqCharity.getAddress(), amount);
      }

      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
    });

    it("Should unable to withdraw because contract is paused", async function () {
      await this.sdqCharity.connect(this.owner).pause();
      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "EnforcedPause",
      );
    });

    it("Should unable to withdraw because user is banned", async function () {
      await this.sdqCharity.connect(this.owner).banUser(this.accounts[0].address);
      await expect(this.sdqCharity.connect(this.accounts[0]).withdrawCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should unable to withdraw because campaign doesn't exist", async function () {
      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(0)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(2)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });

    it("Should unable to withdraw because not the owner", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).withdrawCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should withdraw correctly", async function () {
      const PLATFORM_FEE = await this.sdqCharity.PLATFORM_FEE();
      const ethDonation = parseEther("10");
      const remainAmount = parseEther(((10 * Number(PLATFORM_FEE)) / 100).toString());
      const randomAmount: number[] = [];

      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        randomAmount.push(Math.floor(Math.random() * 100) + 1);
        await this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(
            1,
            randomAmount[i] * 10 ** 6,
            await this.deployedAssets[i].getAddress(),
            "Anonymous",
            "Hello World",
          );
      }
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation }),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(ethDonation);

      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(1)).to.be.emit(
        this.sdqCharity,
        "CampaignClaimed",
      );
      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        const ownerBalance = await this.deployedAssets[i].balanceOf(this.owner.address);
        const amountWithFee = randomAmount[i] * 10 ** 6 - randomAmount[i] * (Number(PLATFORM_FEE) / 100) * 10 ** 6;
        expect(ownerBalance).to.be.equal(amountWithFee);
      }
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(remainAmount);
    });

    it("Should unable to withdraw for second time", async function () {
      const PLATFORM_FEE = await this.sdqCharity.PLATFORM_FEE();
      const ethDonation = parseEther("10");
      const remainAmount = parseEther(((10 * Number(PLATFORM_FEE)) / 100).toString());
      const randomAmount: number[] = [];

      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        randomAmount.push(Math.floor(Math.random() * 100) + 1);
        await this.sdqCharity
          .connect(this.accounts[0])
          .donateWithToken(
            1,
            randomAmount[i] * 10 ** 6,
            await this.deployedAssets[i].getAddress(),
            "Anonymous",
            "Hello World",
          );
      }
      await expect(
        this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation }),
      ).to.be.emit(this.sdqCharity, "CampaignDonation");
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(ethDonation);

      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(1)).to.be.emit(
        this.sdqCharity,
        "CampaignClaimed",
      );
      for (let i = 0; i < this.deployedAssets.length - 1; i++) {
        const ownerBalance = await this.deployedAssets[i].balanceOf(this.owner.address);
        const amountWithFee = randomAmount[i] * 10 ** 6 - randomAmount[i] * (Number(PLATFORM_FEE) / 100) * 10 ** 6;
        expect(ownerBalance).to.be.equal(amountWithFee);
      }
      expect(await ethers.provider.getBalance(await this.sdqCharity.getAddress())).to.be.equal(remainAmount);
      await expect(this.sdqCharity.connect(this.owner).withdrawCampaign(1)).to.be.revertedWithCustomError(
        this.sdqCharity,
        "ValidationFailed",
      );
    });
  });

  describe("Soulbound", function () {
    beforeEach(async function () {
      const { sdqCharity, owner, accounts, deployedSBT } = await this.loadFixture(deploySDQCharityFixture);
      this.sdqCharity = sdqCharity;
      this.owner = owner;
      this.accounts = accounts;
      this.deployedSBT = deployedSBT;

      await expect(this.sdqCharity.connect(this.owner).createCampaign("Test", "Test", "Test", 100)).to.be.emit(
        this.sdqCharity,
        "CampaignCreated",
      );
      // Give EDITOR ROLE to SDQCheckin
      for (let i = 0; i < deployedSBT.length; i++) {
        await deployedSBT[i].grantRole(await deployedSBT[i].EDITOR_ROLE(), sdqCharity.getAddress());
      }
    });

    it("Should return correct SBT address", async function () {
      const res = await this.sdqCharity.connect(this.owner).getSoulboundContracts();
      expect(res.length).to.be.equal(this.deployedSBT.length);
      for (let i = 0; i < res.length; i++) {
        expect(res[i]).to.be.equal(await this.deployedSBT[i].getAddress());
      }
    });

    it("Should fail to claim first donation SBT because never donate", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFirstDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim first donation SBT because already claimed", async function () {
      const ethDonation = parseEther("1");
      await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      await this.sdqCharity.connect(this.accounts[0]).mintMyFirstDonationSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFirstDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim first donation SBT correctly", async function () {
      const ethDonation = parseEther("1");
      await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      await this.sdqCharity.connect(this.accounts[0]).mintMyFirstDonationSBT();
      expect(await this.deployedSBT[0].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim fifth donation SBT because donate less than 5 times", async function () {
      for (let i = 0; i < 4; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFifthDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim fifth donation SBT because already claimed", async function () {
      for (let i = 0; i < 5; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyFifthDonationSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFifthDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim fifth donation SBT correctly", async function () {
      for (let i = 0; i < 5; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyFifthDonationSBT();
      expect(await this.deployedSBT[1].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim tenth donation SBT because donate less than 10 times", async function () {
      for (let i = 0; i < 9; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyTenDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim tenth donation SBT because already claimed", async function () {
      for (let i = 0; i < 10; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyTenDonationSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyTenDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim tenth donation SBT correctly", async function () {
      for (let i = 0; i < 10; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyTenDonationSBT();
      expect(await this.deployedSBT[2].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim fifty donation SBT because donate less than 50 times", async function () {
      for (let i = 0; i < 49; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFiftyDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim fifty donation SBT because already claimed", async function () {
      for (let i = 0; i < 50; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyFiftyDonationSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFiftyDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim fifty donation SBT correctly", async function () {
      for (let i = 0; i < 50; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyFiftyDonationSBT();
      expect(await this.deployedSBT[3].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim hundred donation SBT because donate less than 100 times", async function () {
      for (let i = 0; i < 99; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyHundredDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim hundred donation SBT because already claimed", async function () {
      for (let i = 0; i < 100; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyHundredDonationSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyHundredDonationSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim hundred donation SBT correctly", async function () {
      for (let i = 0; i < 100; i++) {
        const ethDonation = parseEther("1");
        await this.sdqCharity.connect(this.accounts[0]).donate(1, "Anonymous", "Hello World", { value: ethDonation });
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyHundredDonationSBT();
      expect(await this.deployedSBT[4].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim first campaign SBT because never create campaign", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFirstCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim first campaign SBT because already claimed", async function () {
      await this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100);
      await this.sdqCharity.connect(this.accounts[0]).mintMyFirstCampaignSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyFirstCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim first campaign SBT correctly", async function () {
      await this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100);
      await this.sdqCharity.connect(this.accounts[0]).mintMyFirstCampaignSBT();
      expect(await this.deployedSBT[5].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    it("Should fail to claim third campaign SBT because never create campaign", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyThirdCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim third campaign SBT because already claimed", async function () {
      for (let i = 0; i < 3; i++) {
        await this.sdqCharity.connect(this.accounts[0]).createCampaign(`Test${i}`, "Test", "Test", 100);
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyThirdCampaignSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyThirdCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim third campaign SBT correctly", async function () {
      for (let i = 0; i < 3; i++) {
        await this.sdqCharity.connect(this.accounts[0]).createCampaign(`Test${i}`, "Test", "Test", 100);
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyThirdCampaignSBT();
      expect(await this.deployedSBT[6].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });

    // create test code similar to mintMyFirstCampaignSBT to test mintMyTenCampaignSBT
    it("Should fail to claim ten campaign SBT because never create campaign", async function () {
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyTenCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should fail to claim ten campaign SBT because already claimed", async function () {
      for (let i = 0; i < 10; i++) {
        await this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100);
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyTenCampaignSBT();
      await expect(this.sdqCharity.connect(this.accounts[0]).mintMyTenCampaignSBT()).to.be.revertedWithCustomError(
        this.sdqCharity,
        "AccountError",
      );
    });

    it("Should claim ten campaign SBT correctly", async function () {
      for (let i = 0; i < 10; i++) {
        await this.sdqCharity.connect(this.accounts[0]).createCampaign("Test", "Test", "Test", 100);
      }
      await this.sdqCharity.connect(this.accounts[0]).mintMyTenCampaignSBT();
      expect(await this.deployedSBT[7].balanceOf(this.accounts[0].address)).to.be.equal(1);
    });
  });
});
