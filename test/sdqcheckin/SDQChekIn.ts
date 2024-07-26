import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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
      const { shodaqo, sdqCheckin, owner, minter, accounts } = await this.loadFixture(deploySDQCheckInFixture);
      this.shodaqo = shodaqo;
      this.sdqCheckin = sdqCheckin;
      this.owner = owner;
      this.minter = minter;
      this.accounts = accounts;
    });

    it("Should have 1 bilion sdqToken on sdqCheckin contract", async function () {
      expect(await this.shodaqo.balanceOf(this.sdqCheckin.getAddress())).to.equal(ethers.parseEther("1000000000"));
    });
  });
});
