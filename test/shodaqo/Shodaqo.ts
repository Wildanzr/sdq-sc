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
      const { shodaqo, owner, minter, accounts } = await this.loadFixture(deployShodaqoFixture);
      this.shodaqo = shodaqo;
      this.owner = owner;
      this.minter = minter;
      this.accounts = accounts;
    });

    it("Should the max supply is 10 Bilion tokens", async function () {
      expect(await this.shodaqo.totalSupply()).to.equal(await this.shodaqo.MAX_SUPPLY());
    });

    it("Should the admin has 10 Bilion tokens", async function () {
      expect(await this.shodaqo.balanceOf(this.owner.address)).to.equal(await this.shodaqo.MAX_SUPPLY());
    });

    it("Shoult admin address has role DEFAULT_ADMIN_ROLE", async function () {
      expect(await this.shodaqo.hasRole(await this.shodaqo.DEFAULT_ADMIN_ROLE(), this.owner.address)).to.be.true;
    });

    it("Should minter address has role MINTER_ROLE", async function () {
      expect(await this.shodaqo.hasRole(await this.shodaqo.MINTER_ROLE(), this.minter.address)).to.be.true;
    });
  });
});
