import { AddressLike } from "ethers";
import { ethers } from "hardhat";

import type {
  AssetToken,
  AssetToken__factory,
  SDQCharity,
  SDQCharity__factory,
  Soulbound,
  Soulbound__factory,
} from "../../types";

interface Asset {
  name: string;
  ticker: string;
  mintAmount: bigint;
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
      name: "USD Coin on Axelar",
      ticker: "axlUSDC",
      mintAmount: BigInt(100 * 10 ** 6),
      decimals: 6,
    },
    {
      name: "Tether USD on Axelar",
      ticker: "axlUSDT",
      mintAmount: BigInt(100 * 10 ** 6),
      decimals: 6,
    },
    {
      name: "Axelar",
      ticker: "AXL",
      mintAmount: BigInt(180 * 10 ** 6),
      decimals: 6,
    },
    {
      name: "Cosmos Hub",
      ticker: "ATOM",
      mintAmount: BigInt(20 * 10 ** 6),
      decimals: 6,
    },
    // {
    //   name: "Wrapped Bitcoin on Axelar",
    //   ticker: "axlWBTC",
    //   mintAmount: BigInt(0.00165 * 10 ** 8),
    //   decimals: 8,
    // },
    // {
    //   name: "Wrapped Ether on Axelar",
    //   ticker: "axlWETH",
    //   mintAmount: BigInt(0.038 * 10 ** 18),
    //   decimals: 18,
    // },
    // {
    //   name: "DAI Stablecoin on Axelar",
    //   ticker: "axlDAI",
    //   mintAmount: BigInt(100 * 10 ** 18),
    //   decimals: 18,
    // },
  ];

  const sbtTokenURIs = [
    "QmQSw6qyNUoccP2hQ7hDgEVevNcr8aRtigxrd6zCKbv98H",
    "QmPE8PLgXCAFBBfSQZmGBZ19q9c171ryUzLSJi1J4sgUZF",
    "QmehY1YNX5BQfuFxzBFN9EkEFqmYkh7Jc9MCiCzoBXYFx9",
    "QmW2qyuMvohUyNRqFYnATCPV4jF852k3KVDa7352LYSoik",
    "Qmb12QKeNKRzZ3Su22LLeLGBzAk9ptMTXMPReJuPKVhhJN",
    "QmamXWuBbytr9KvczrNiWZb9GX5QJHjRx7GQQ61vk6A3r5",
    "QmZ99DCFcKwxnvqYTNGLsi8MRVMMazp8C4TFHBkyAFqJSN",
    "QmQjRgsjVzfWq84zthBvfbjvFDxx93m9HKqfMQMaQvZcYE",
  ];

  // Deploy Soulbond Tokens
  const deployedSBT: Soulbound[] = [];
  const deployedAddresses: AddressLike[] = [];
  for (let i = 0; i < sbtTokenURIs.length; i++) {
    const SBT = (await ethers.getContractFactory("Soulbound")) as unknown as Soulbound__factory;
    const sbt = (await SBT.deploy(owner.address, sbtTokenURIs[i])) as Soulbound;
    deployedSBT.push(sbt);
    deployedAddresses.push(await sbt.getAddress());
  }

  const deployedAssets: AssetToken[] = [];
  for (const item of assets) {
    const AssetToken = (await ethers.getContractFactory("AssetToken")) as unknown as AssetToken__factory;
    const assetToken = (await AssetToken.deploy(owner.address, item.name, item.ticker, item.mintAmount)) as AssetToken;
    deployedAssets.push(assetToken);
  }

  // Deploy SDQCharity
  const SDQCharity = (await ethers.getContractFactory("SDQCharity")) as unknown as SDQCharity__factory;
  const sdqCharity = (await SDQCharity.deploy([
    deployedAddresses[0],
    deployedAddresses[1],
    deployedAddresses[2],
    deployedAddresses[3],
    deployedAddresses[4],
    deployedAddresses[5],
    deployedAddresses[6],
    deployedAddresses[7],
  ])) as SDQCharity;

  return { assets, deployedAssets, deployedSBT, sdqCharity, owner, editor, accounts };
}
