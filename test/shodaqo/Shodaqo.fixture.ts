import { ethers } from "hardhat";

import type { Shodaqo } from "../../types/contracts/Shodaqo";
import type { Shodaqo__factory } from "../../types/factories/contracts/Shodaqo__factory";

export async function deployShodaqoFixture() {
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const minter = signers[1];
  const accounts = signers.slice(2);

  // Deploy Shodaqo
  const Shodaqo = (await ethers.getContractFactory("Shodaqo")) as unknown as Shodaqo__factory;
  const shodaqo = (await Shodaqo.deploy(owner.address, minter.address)) as Shodaqo;

  return { shodaqo, owner, minter, accounts };
}
