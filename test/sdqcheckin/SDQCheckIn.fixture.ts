import { ethers } from "hardhat";

import type { SDQCheckIn, SDQCheckIn__factory, Shodaqo, Shodaqo__factory, Soulbound, Soulbound__factory } from "../../types";
import { AddressLike } from "ethers";

export async function deploySDQCheckInFixture() {
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const minter = signers[1];
  const accounts = signers.slice(2);

  const sbtTokenURIs = [
    "QmebprnVt1cLqrPcJuZbFkCsYNfc9MBBJRacrGsXLvC6NM",
    "QmdtKy3zkBT5FjPgL9ftEkvjZj3kvNdhu594ddkvgbAgtU",
    "QmWufrXaHHNZVPc8gtYiGkaY2kjCAzvejdJCCoBveMs7vs"
  ]

  // Deploy Soulbond Tokens
  const deployedSBT: Soulbound[] = [];
  const deployedAddresses: AddressLike[] = [];
  for (let i = 0; i < sbtTokenURIs.length; i++) {
    const SBT = (await ethers.getContractFactory("Soulbound")) as unknown as Soulbound__factory;
    const sbt = (await SBT.deploy(owner.address, sbtTokenURIs[i])) as Soulbound;
    deployedSBT.push(sbt);
    deployedAddresses.push(await sbt.getAddress());
  }


  // Deploy Shodaqo token
  const Shodaqo = (await ethers.getContractFactory("Shodaqo")) as unknown as Shodaqo__factory;
  const shodaqo = (await Shodaqo.deploy(owner.address, minter.address)) as Shodaqo;

  // Deploy SDQCheckin
  const SDQCheckin = (await ethers.getContractFactory("SDQCheckIn")) as unknown as SDQCheckIn__factory;
  const sdqCheckin = (await SDQCheckin.deploy(await shodaqo.getAddress(), [
    deployedAddresses[0],
    deployedAddresses[1],
    deployedAddresses[2]
  ])) as SDQCheckIn;


  // Owner send 1 Bilion token to SDQCheckin
  await shodaqo.transfer(sdqCheckin.getAddress(), ethers.parseEther("1000000000"));

  return { shodaqo, sdqCheckin, deployedSBT, owner, minter, accounts };
}
