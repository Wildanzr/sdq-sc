import { ethers } from "hardhat";

import type { SDQCheckIn } from "../../types/contracts/SDQCheckIn";
import type { Shodaqo } from "../../types/contracts/Shodaqo";
import type { SDQCheckIn__factory } from "../../types/factories/contracts/SDQCheckIn__factory";
import type { Shodaqo__factory } from "../../types/factories/contracts/Shodaqo__factory";

export async function deploySDQCheckInFixture() {
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const minter = signers[1];
  const accounts = signers.slice(2);

  // Deploy Shodaqo token
  const Shodaqo = (await ethers.getContractFactory("Shodaqo")) as unknown as Shodaqo__factory;
  const shodaqo = (await Shodaqo.deploy(owner.address, minter.address)) as Shodaqo;

  // Deploy SDQCheckin
  const SDQCheckin = (await ethers.getContractFactory("SDQCheckIn")) as unknown as SDQCheckIn__factory;
  const sdqCheckin = (await SDQCheckin.deploy(await shodaqo.getAddress())) as SDQCheckIn;

  // Owner send 1 Bilion token to SDQCheckin
  await shodaqo.transfer(sdqCheckin.getAddress(), ethers.parseEther("1000000000"));

  return { shodaqo, sdqCheckin, owner, minter, accounts };
}
