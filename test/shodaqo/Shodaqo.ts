import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { deployShodaqoFixture } from "./Shodaqo.fixture";

describe("Shodaqo", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("Deployment", function () {
    beforeEach(async function () {
      const { shodaqo, owner, minter, accounts, MAX_SUPPLY } = await this.loadFixture(deployShodaqoFixture);
      this.shodaqo = shodaqo;
      this.owner = owner;
      this.minter = minter;
      this.accounts = accounts;
      this.MAX_SUPPLY = MAX_SUPPLY;
    });

    it("Should the admin has 10 Bilion tokens", async function () {
      expect(await this.shodaqo.balanceOf(this.owner.address)).to.equal(this.MAX_SUPPLY);
    });
  });
});
