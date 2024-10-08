import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Soulbound } from "../types";

task("soulbound:checkin", "Give EDITOR ROLE to SDQCheckIn contract to manage Soulbound tokens").setAction(
  async (taskArgs: TaskArguments, { ethers }) => {
    const signers = await ethers.getSigners();

    const checkinAddr = "0xA5bE51D8b8BE47A5517658c3cB401EBeC7C4F086";
    const soulboundAddrs = [
      "0xaec4df5f6ce960e790c3d947ea79c8416533328e",
      "0xaA31505BbabED6813f46130c302f9451254e56F6",
      "0xEc399E287c237Ddbb43974200FD7987cB74d45Ad",
    ];

    for (let i = 0; i < soulboundAddrs.length; i++) {
      console.log("Soulbound address: ", soulboundAddrs[i]);
      const sbt = (await ethers.getContractAt("Soulbound", soulboundAddrs[i], signers[0])) as Soulbound;
      const tx = await sbt.connect(signers[0]).grantRole(await sbt.EDITOR_ROLE(), checkinAddr);
      console.log("Transaction: ", tx.hash);
    }
  },
);
