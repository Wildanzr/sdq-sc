import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { SDQCharity, Soulbound } from "../types";

task("soulbound:charity", "Give EDITOR ROLE to SDQCharity contract to manage Soulbound tokens").setAction(
  async (taskArgs: TaskArguments, { ethers }) => {
    const signers = await ethers.getSigners();

    const charityAddr = "0xeE69D703b166254313E1B46fdB6a60fda7decd2B";
    const soulboundAddrs = [
      "0xFBAa8FBD196Be84aEe7a441d2E401B5dFD590bC3",
      "0x38Bca10DC760bA287718Af20B1a663db63d3A4Fa",
      "0xBbbC242b1bA31F19B834e7035c3A429486dbC6eA",
      "0x3c8c04f86A0dF859d04C53Dc5c186d743172E2D3",
      "0x7188A91DA93382a43cB54FaD6Fca9b0345E372CA",
      "0x91ba4272b7c3f864f1b483C4D0BEd8eC05469262",
      "0x1E30fc4e1741E1f4fAb0670B9fe66C529335057f",
      "0xDEbbCbc64fDB1223A6f610D669A54C82d1546D6f",
    ];

    for (let i = 0; i < soulboundAddrs.length; i++) {
      console.log("Soulbound address: ", soulboundAddrs[i]);
      const sbt = (await ethers.getContractAt("Soulbound", soulboundAddrs[i], signers[0])) as Soulbound;
      const tx = await sbt.connect(signers[0]).grantRole(await sbt.EDITOR_ROLE(), charityAddr);
      console.log("Transaction: ", tx.hash);
    }
  },
);

task("add:tokens", "Add tokens to be able to donate").setAction(async (taskArgs: TaskArguments, { ethers }) => {
  const signers = await ethers.getSigners();

  const charityAddr = "0xeE69D703b166254313E1B46fdB6a60fda7decd2B";
  const tokens = [
    {
      ticker: "axlusdc",
      address: "0x8271E28fD069c30F1D4EEf75cB4f9b19B12e88EF",
      decimals: 6,
    },
    {
      ticker: "axelar-usdt",
      address: "0x0Ca2C810D09b22E1BD9B347CE1C45b6BB303E088",
      decimals: 6,
    },
    {
      ticker: "axelar",
      address: "0x87C72491f381499878Ce9552de2789aDd35ca7a6",
      decimals: 6,
    },
    {
      ticker: "cosmos",
      address: "0x836cf6dd6a917e9f29ea596cea4cfc4cd521db25",
      decimals: 6,
    },
    {
      ticker: "axlwbtc",
      address: "0x108025f60ae54aBEf6FaA1c614AafA0f990CcF55",
      decimals: 8,
    },
    {
      ticker: "axlweth",
      address: "0xa88C50fC2e3A97D39e5cFC3753a7947dFAFD6B05",
      decimals: 18,
    },
    {
      ticker: "dai",
      address: "0xe748da4491116e728a8042b45f005AB6A67C8597",
      decimals: 18,
    },
  ];

  for (let i = 0; i < tokens.length; i++) {
    console.log("Token address: ", tokens[i].address);
    const charity = (await ethers.getContractAt("SDQCharity", charityAddr, signers[0])) as SDQCharity;
    const tx = await charity.connect(signers[0]).addToken(tokens[i].address, tokens[i].ticker, tokens[i].decimals);
    console.log("Transaction: ", tx.hash);
  }
});
