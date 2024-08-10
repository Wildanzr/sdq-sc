import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { SDQCharity, Soulbound } from "../types";

task("soulbound:charity", "Give EDITOR ROLE to SDQCharity contract to manage Soulbound tokens")
  .setAction(async (taskArgs: TaskArguments, { ethers }) => {
    const signers = await ethers.getSigners();

    const charityAddr = "0x1a24D7B5dE26Dba2629959dCaCf4b26fB5F93e17";
    const soulboundAddrs = ["0xA9E00D1940445a0f13DC505bEf4956120F4E880e", "0xbc1BBdd62d58D0E80136832854c35f32593bd3F7", "0xFd285A71805E46B6016B25FF82A55D93BF8Fd112", "0xD097f3102dB4e5469C6D67863515ebe92d225395", "0x3d353D66cBEfD134765Fab126e7Ef90eE03ea979", "0xA03aFD86c193fF755614D4c662FfBDEa2d6d82Ee", "0xc6f673C50D6Ee199F2e79a1599630D57A55DDc1A", "0xe0f64E55eAb05a7e048059742668E9c22E9Eb131"];

    for (let i = 0; i < soulboundAddrs.length; i++) {
      console.log("Soulbound address: ", soulboundAddrs[i]);
      const sbt = await ethers.getContractAt("Soulbound", soulboundAddrs[i], signers[0]) as Soulbound;
      const tx = await sbt.connect(signers[0]).grantRole(await sbt.EDITOR_ROLE(), charityAddr);
      console.log("Transaction: ", tx.hash);
    }
  });

task("add:tokens", "Add tokens to be able to donate")
  .setAction(async (taskArgs: TaskArguments, { ethers }) => {
    const signers = await ethers.getSigners();

    const charityAddr = "0x1a24D7B5dE26Dba2629959dCaCf4b26fB5F93e17";
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

    ]

    for (let i = 0; i < tokens.length; i++) {
      console.log("Token address: ", tokens[i].address);
      const charity = await ethers.getContractAt("SDQCharity", charityAddr, signers[0]) as SDQCharity;
      const tx = await charity.connect(signers[0]).addToken(tokens[i].address, tokens[i].ticker, tokens[i].decimals);
      console.log("Transaction: ", tx.hash);
    }
  });