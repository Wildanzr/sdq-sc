import { ethers } from "hardhat";

import type { Shodaqo } from "../../types";
import { Shodaqo__factory } from "../../types";

export async function deployShodaqoFixture() {
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const minter = signers[1];
  const accounts = signers.slice(2);

  // Deploy Shodaqo
  const Shodaqo = (await ethers.getContractFactory("Shodaqo")) as Shodaqo__factory;
  const shodaqo = (await Shodaqo.deploy(owner.address, minter.address)) as Shodaqo;

  return { shodaqo, owner, minter, accounts };
}
