import { ethers } from "hardhat";

import type { AssetToken, AssetToken__factory, SDQCharity, SDQCharity__factory } from "../../types";

interface Asset {
  name: string;
  ticker: string;
  mintAmount: number;
  decimals: number;
}

export async function deploySDQCharityFixture() {
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const editor = signers[1];
  const accounts = signers.slice(2);

  // Deploy assets token
  const assets: Asset[] = [
    {
      name: "USDC",
      ticker: "USDC",
      mintAmount: 100,
      decimals: 6,
    },
    {
      name: "USDT on Kava",
      ticker: "USDT",
      mintAmount: 100,
      decimals: 6,
    },
    {
      name: "Tether USD on Axelar",
      ticker: "axlUSDT",
      mintAmount: 100,
      decimals: 6,
    },
    {
      name: "USD Coin on Axelar",
      ticker: "axlUSDC",
      mintAmount: 100,
      decimals: 6,
    },
  ];
  const deployedAssets: AssetToken[] = [];
  for (const item of assets) {
    const AssetToken = (await ethers.getContractFactory("AssetToken")) as unknown as AssetToken__factory;
    const assetToken = (await AssetToken.deploy(owner.address, item.name, item.ticker)) as AssetToken;
    deployedAssets.push(assetToken);
  }

  // Deploy SDQCharity
  const SDQCharity = (await ethers.getContractFactory("SDQCharity")) as unknown as SDQCharity__factory;
  const sdqCharity = (await SDQCharity.deploy()) as SDQCharity;

  return { assets, deployedAssets, sdqCharity, owner, editor, accounts };
}
