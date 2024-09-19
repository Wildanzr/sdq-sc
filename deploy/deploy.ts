import { AddressLike } from "ethers";
import { promises as fs } from "fs";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as path from "path";

// interface Asset {
//   name: string;
//   ticker: string;
//   mintAmount: bigint;
//   decimals: number;
// }

/**
 * Writes content to a .txt file, ensuring the directory exists.
 *
 * @param filePath - The path where the file should be saved.
 * @param content - The content to write to the file.
 */
async function writeToFile(filePath: string, content: string): Promise<void> {
  try {
    const fullPath = path.resolve(filePath);
    const dir = path.dirname(fullPath);

    // Ensure the directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, content, "utf8");
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // axlusdc        6       0x8271E28fD069c30F1D4EEf75cB4f9b19B12e88EF
  // axelar-usdt    6       0x0Ca2C810D09b22E1BD9B347CE1C45b6BB303E088
  // axelar         6       0x87C72491f381499878Ce9552de2789aDd35ca7a6
  // cosmos         6       0x836cf6dd6a917e9f29ea596cea4cfc4cd521db25
  // axlwbtc        8       0x108025f60ae54aBEf6FaA1c614AafA0f990CcF55
  // axlweth        18      0xa88C50fC2e3A97D39e5cFC3753a7947dFAFD6B05
  // dai            18      0xe748da4491116e728a8042b45f005AB6A67C8597

  const path = "args/";
  // const assets: Asset[] = [
  //   {
  //     name: "USD Coin on Axelar",
  //     ticker: "axlUSDC",
  //     mintAmount: BigInt(100 * 10 ** 6),
  //     decimals: 6,
  //   },
  //   {
  //     name: "Tether USD on Axelar",
  //     ticker: "axlUSDT",
  //     mintAmount: BigInt(100 * 10 ** 6),
  //     decimals: 6,
  //   },
  //   {
  //     name: "Axelar",
  //     ticker: "AXL",
  //     mintAmount: BigInt(180 * 10 ** 6),
  //     decimals: 6,
  //   },
  //   {
  //     name: "Cosmos Hub",
  //     ticker: "ATOM",
  //     mintAmount: BigInt(20 * 10 ** 6),
  //     decimals: 6,
  //   },
  //   {
  //     name: "Wrapped Bitcoin on Axelar",
  //     ticker: "axlWBTC",
  //     mintAmount: BigInt(0.00165 * 10 ** 8),
  //     decimals: 8,
  //   },
  //   {
  //     name: "Wrapped Ether on Axelar",
  //     ticker: "axlWETH",
  //     mintAmount: BigInt(0.038 * 10 ** 18),
  //     decimals: 18,
  //   },
  //   {
  //     name: "DAI Stablecoin on Axelar",
  //     ticker: "axlDAI",
  //     mintAmount: BigInt(100 * 10 ** 18),
  //     decimals: 18,
  //   },
  // ];
  // const checkInSBTTokenURIs = [
  //   "QmebprnVt1cLqrPcJuZbFkCsYNfc9MBBJRacrGsXLvC6NM",
  //   "QmdtKy3zkBT5FjPgL9ftEkvjZj3kvNdhu594ddkvgbAgtU",
  //   "QmWufrXaHHNZVPc8gtYiGkaY2kjCAzvejdJCCoBveMs7vs"
  // ];

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Soulbond Tokens
  // const deployedCheckinSBTAddr: AddressLike[] = [];
  // for (let i = 0; i < checkInSBTTokenURIs.length; i++) {
  //   const sbt = await deploy("Soulbound", {
  //     from: deployer,
  //     log: true,
  //     args: [deployer, checkInSBTTokenURIs[i]],
  //   })
  //   deployedCheckinSBTAddr.push(sbt.address);
  //   const sbtParams = `module.exports = ["${deployer}", "${checkInSBTTokenURIs[i]}"];`;
  //   await writeToFile(`${path}sbt${i}.ts`, sbtParams);
  //   console.log(`bunx hardhat verify --network haqq --constructor-args args/sbt${i}.ts ${sbt.address}`);
  // }
  // await writeToFile(`${path}checkinsbt.ts`, `module.exports = ${JSON.stringify(deployedCheckinSBTAddr)};`);

  // Shodaqo
  // const shodaqo = await deploy("Shodaqo", {
  //   from: deployer,
  //   log: true,
  //   args: [deployer, minter],
  // });
  // console.log(`Shodaqo contract: `, shodaqo.address);
  // const shodaqoParams = `module.exports = ["${deployer}", "${minter}"];`;
  // await writeToFile(`${path}shodaqo.ts`, shodaqoParams);

  // // SDQCheckIn
  // const sdqCheckin = await deploy("SDQCheckIn", {
  //   from: deployer,
  //   log: true,
  //   args: ["0x040EAdcaF7450609358047b7eF3Bef37E45D39D5", deployedCheckinSBTAddr],
  // });
  // console.log(`SDQCheckIn contract: `, sdqCheckin.address);
  // const sdqCheckinParams = `module.exports = ["0x040EAdcaF7450609358047b7eF3Bef37E45D39D5", ["${deployedCheckinSBTAddr[0]}", "${deployedCheckinSBTAddr[1]}", "${deployedCheckinSBTAddr[2]}"]];`;
  // await writeToFile(`${path}sdqcheckin.ts`, sdqCheckinParams);
  // console.log(`bunx hardhat verify --network haqq --constructor-args args/sdqcheckin.ts ${sdqCheckin.address}
  //   `);

  const charitySBTTokenURIs = [
    "QmQSw6qyNUoccP2hQ7hDgEVevNcr8aRtigxrd6zCKbv98H",
    "QmPE8PLgXCAFBBfSQZmGBZ19q9c171ryUzLSJi1J4sgUZF",
    "QmehY1YNX5BQfuFxzBFN9EkEFqmYkh7Jc9MCiCzoBXYFx9",
    "QmW2qyuMvohUyNRqFYnATCPV4jF852k3KVDa7352LYSoik",
    "Qmb12QKeNKRzZ3Su22LLeLGBzAk9ptMTXMPReJuPKVhhJN",
    "QmamXWuBbytr9KvczrNiWZb9GX5QJHjRx7GQQ61vk6A3r5",
    "QmZ99DCFcKwxnvqYTNGLsi8MRVMMazp8C4TFHBkyAFqJSN",
    "QmQjRgsjVzfWq84zthBvfbjvFDxx93m9HKqfMQMaQvZcYE",
  ];
  const deployedCheckinSBTAddr: AddressLike[] = [];
  for (let i = 0; i < charitySBTTokenURIs.length; i++) {
    const sbt = await deploy("Soulbound", {
      from: deployer,
      log: true,
      args: [deployer, charitySBTTokenURIs[i]],
    });
    deployedCheckinSBTAddr.push(sbt.address);
    const sbtParams = `module.exports = ["${deployer}", "${charitySBTTokenURIs[i]}"];`;
    await writeToFile(`${path}sbtcrt${i}.ts`, sbtParams);
    console.log(`bunx hardhat verify --network haqq --constructor-args args/sbtcrt${i}.ts ${sbt.address}`);
  }
  await writeToFile(`${path}checkinsbt.ts`, `module.exports = ${JSON.stringify(deployedCheckinSBTAddr)};`);

  // SDQCharity
  const sdqCharity = await deploy("SDQCharity", {
    from: deployer,
    log: true,
    args: [deployedCheckinSBTAddr],
  });

  // Write the addresses to a file
  const charityParams = `module.exports = [["${deployedCheckinSBTAddr[0]}","${deployedCheckinSBTAddr[1]}","${deployedCheckinSBTAddr[2]}","${deployedCheckinSBTAddr[3]}","${deployedCheckinSBTAddr[4]}","${deployedCheckinSBTAddr[5]}","${deployedCheckinSBTAddr[6]}","${deployedCheckinSBTAddr[7]}"]];`;
  await writeToFile(`${path}charitysbt.ts`, charityParams);

  console.log("----------------------------------------------------------------");
  console.log("Verify the contracts on Etherscan with the following commands:");
  console.log(`bunx hardhat verify --network haqq --constructor-args args/charity.ts ${sdqCharity.address}`);

  // Asset Tokens
  // const deployedAssets = [];
  // for (const item of assets) {
  //   const assetToken = await deploy("AssetToken", {
  //     from: deployer,
  //     log: true,
  //     args: [deployer, item.name, item.ticker, item.mintAmount],
  //   });
  //   deployedAssets.push(assetToken);

  //   const assetParams = `module.exports = ["${deployer}", "${item.name}", "${item.ticker}", "${item.mintAmount}"];`;
  //   await writeToFile(`${path}${item.ticker}.ts`, assetParams);
  //   console.log(`bunx hardhat verify --network haqq --constructor-args args/${item.ticker}.ts ${assetToken.address}`);
  // }
};
export default func;
func.id = "deploy_sdq"; // id required to prevent reexecution
func.tags = ["Shodaqo"];
