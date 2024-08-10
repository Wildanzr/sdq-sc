import { promises as fs } from "fs";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as path from "path";

interface Asset {
  name: string;
  ticker: string;
  mintAmount: bigint;
  decimals: number;
}

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
  const assets: Asset[] = [
    {
      name: "Wrapped Ether on Axelar",
      ticker: "axlWETH",
      mintAmount: BigInt(0.038 * 10 ** 18),
      decimals: 18,
    },
    {
      name: "DAI Stablecoin on Axelar",
      ticker: "axlDAI",
      mintAmount: BigInt(100 * 10 ** 18),
      decimals: 18,
    },
  ];

  console.log("Assets to deploy: ", assets);
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // // Shodaqo
  // const shodaqo = await deploy("Shodaqo", {
  //   from: deployer,
  //   log: true,
  //   args: [deployer, minter],
  // });
  // console.log(`Shodaqo contract: `, shodaqo.address);

  // // SDQCheckIn
  // const sdqCheckin = await deploy("SDQCheckIn", {
  //   from: deployer,
  //   log: true,
  //   args: [shodaqo.address],
  // });
  // console.log(`SDQCheckIn contract: `, sdqCheckin.address);

  // // SDQCharity
  // const sdqCharity = await deploy("SDQCharity", {
  //   from: deployer,
  //   log: true,
  // })

  // // Write the addresses to a file
  // const shodaqoParams = `module.exports = ["${deployer}", "${minter}"];`;
  // const sdqCheckinParams = `module.exports = ["${shodaqo.address}"];`;
  // const path = "args/";
  // await writeToFile(`${path}shodaqo.ts`, shodaqoParams);
  // await writeToFile(`${path}sdqcheckin.ts`, sdqCheckinParams);

  // console.log("----------------------------------------------------------------");
  // console.log("Verify the contracts on Etherscan with the following commands:");
  // console.log(`bunx hardhat verify --network haqq --constructor-args args/shodaqo.ts ${shodaqo.address} && \nbunx hardhat verify --network haqq --constructor-args args/sdqcheckin.ts ${sdqCheckin.address} && \nbunx hardhat verify --network haqq ${sdqCharity.address}
  //   `);


  // Asset Tokens
  const deployedAssets = [];
  for (const item of assets) {
    const assetToken = await deploy("AssetToken", {
      from: deployer,
      log: true,
      args: [deployer, item.name, item.ticker, item.mintAmount],
    });
    deployedAssets.push(assetToken);

    const assetParams = `module.exports = ["${deployer}", "${item.name}", "${item.ticker}", "${item.mintAmount}"];`;
    const path = "args/";
    await writeToFile(`${path}${item.ticker}.ts`, assetParams);
    console.log(`bunx hardhat verify --network haqq --constructor-args args/${item.ticker}.ts ${assetToken.address}`);
  }
};
export default func;
func.id = "deploy_sdq"; // id required to prevent reexecution
func.tags = ["Shodaqo"];
