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
});
