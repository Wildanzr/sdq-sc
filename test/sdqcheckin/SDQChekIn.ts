import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { deploySDQCheckInFixture } from "./SDQCheckIn.fixture";

describe("SDQCheckIn", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("Deployment", function () {
    beforeEach(async function () {
      const { shodaqo, sdqCheckin, owner } = await this.loadFixture(deploySDQCheckInFixture);
      this.shodaqo = shodaqo;
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
    });

    it("Should 1 bilion sdqToken on sdqCheckin contract", async function () {
      expect(await this.shodaqo.balanceOf(this.sdqCheckin.getAddress())).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should 99 bilion sdqToken on owner address", async function () {
      expect(await this.shodaqo.balanceOf(this.owner.getAddress())).to.equal(ethers.parseEther("99000000000"));
    });
  });

  describe("Ban and Unban", function () {
    beforeEach(async function () {
      const { sdqCheckin, owner, accounts } = await this.loadFixture(deploySDQCheckInFixture);
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should ban user", async function () {
      await this.sdqCheckin.connect(this.owner).banClaimer(this.accounts[1].address);
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccountError",
      );
    });

    it("Should unban user", async function () {
      await this.sdqCheckin.connect(this.owner).banClaimer(this.accounts[1].address);
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccountError",
      );
      await this.sdqCheckin.connect(this.owner).unbanClaimer(this.accounts[1].address);
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
    });

    it("Should fail to ban user because didn't have permission", async function () {
      await expect(
        this.sdqCheckin.connect(this.accounts[1]).banClaimer(this.accounts[2].address),
      ).to.be.revertedWithCustomError(this.sdqCheckin, "AccessControlUnauthorizedAccount");
    });

    it("Should fail to unban user because didn't have permission", async function () {
      await this.sdqCheckin.connect(this.owner).banClaimer(this.accounts[1].address);
      await expect(
        this.sdqCheckin.connect(this.accounts[1]).unbanClaimer(this.accounts[1].address),
      ).to.be.revertedWithCustomError(this.sdqCheckin, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pause and Unpause", function () {
    beforeEach(async function () {
      const { sdqCheckin, owner, accounts } = await this.loadFixture(deploySDQCheckInFixture);
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should pause the contract", async function () {
      await this.sdqCheckin.connect(this.owner).pause();
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "EnforcedPause",
      );
    });

    it("Should unpause the contract", async function () {
      await this.sdqCheckin.connect(this.owner).pause();
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "EnforcedPause",
      );
      await this.sdqCheckin.connect(this.owner).unpause();
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
    });

    it("Should fail to pause the contract because didn't have permission", async function () {
      await expect(this.sdqCheckin.connect(this.accounts[1]).pause()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Should fail to unpause the contract because didn't have permission", async function () {
      await this.sdqCheckin.connect(this.owner).pause();
      await expect(this.sdqCheckin.connect(this.accounts[1]).unpause()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const { shodaqo, sdqCheckin, owner, accounts } = await this.loadFixture(deploySDQCheckInFixture);
      this.shodaqo = shodaqo;
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should fail to withdraw because didn't have permission", async function () {
      const amount = ethers.parseEther("100");
      await expect(this.sdqCheckin.connect(this.accounts[1]).withdraw(amount)).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Should fail to withdraw because insufficient balance", async function () {
      const amount = ethers.parseEther("100000000000");
      await expect(this.sdqCheckin.connect(this.owner).withdraw(amount)).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "InsufficientBalance",
      );
    });

    it("Should withdraw correctly", async function () {
      const amount = ethers.parseEther("100");
      await this.sdqCheckin.connect(this.owner).withdraw(amount);
      expect(await this.shodaqo.balanceOf(this.owner.getAddress())).to.equal(ethers.parseEther("99000000100"));
    });
  });

  describe("CheckIn", function () {
    beforeEach(async function () {
      const { shodaqo, sdqCheckin, owner, accounts } = await this.loadFixture(deploySDQCheckInFixture);
      this.shodaqo = shodaqo;
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
      this.accounts = accounts;
    });

    it("Should checkin correctly", async function () {
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("1.25"));
    });

    it("Should checkin failed because still same day", async function () {
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccountError",
      );
    });

    it("Should checkin failed because banned", async function () {
      await this.sdqCheckin.connect(this.owner).banClaimer(this.accounts[1].address);
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "AccountError",
      );
    });

    it("Should checkin failed because not enough balance", async function () {
      const balanceStart = await this.shodaqo.balanceOf(this.sdqCheckin.getAddress());
      await this.sdqCheckin.connect(this.owner).withdraw(balanceStart);

      expect(await this.shodaqo.balanceOf(this.sdqCheckin.getAddress())).to.be.equal(0);
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "InsufficientBalance",
      );
    });

    it("Should checkin failed becuase is paused", async function () {
      await this.sdqCheckin.connect(this.owner).pause();
      await expect(this.sdqCheckin.connect(this.accounts[1]).checkIn()).to.be.revertedWithCustomError(
        this.sdqCheckin,
        "EnforcedPause",
      );
    });

    it("Should checkin succes in consecutive days", async function () {
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("1.25"));

      // increase time 1 day
      await time.increase(time.duration.days(1));

      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(2);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("2.75"));
    });

    it("Should checkin restart to 1 when not consecutive days", async function () {
      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("1.25"));

      // increase time 1 day
      await time.increase(time.duration.days(1));

      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(2);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("2.75"));

      // increase time 1 day
      await time.increase(time.duration.days(2));

      await this.sdqCheckin.connect(this.accounts[1]).checkIn();
      expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(1);
      expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(ethers.parseEther("4"));
    });

    it("Should checkin correctly in a week", async function () {
      const rewards = [1.25, 1.5, 2, 3, 5, 7, 10];
      for (let i = 0; i < 7; i++) {
        await this.sdqCheckin.connect(this.accounts[1]).checkIn();
        expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(i + 1);

        const expectedBalance = rewards.slice(0, i + 1).reduce((a, b) => a + b, 0);
        expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(
          ethers.parseEther(expectedBalance.toString()),
        );
        await time.increase(time.duration.days(1));
      }
    });

    it("Should checkin correctly in 10 days", async function () {
      const rewards = [1.25, 1.5, 2, 3, 5, 7, 10, 1.25, 1.5, 2];
      for (let i = 0; i < 10; i++) {
        await this.sdqCheckin.connect(this.accounts[1]).checkIn();
        expect((await this.sdqCheckin.connect(this.accounts[1]).myCheckInStats()).consecutiveDays).to.be.equal(i + 1);

        const expectedBalance = rewards.slice(0, i + 1).reduce((a, b) => a + b, 0);
        expect(await this.shodaqo.balanceOf(this.accounts[1].address)).to.be.equal(
          ethers.parseEther(expectedBalance.toString()),
        );
        await time.increase(time.duration.days(1));
      }
    });
  });
});
