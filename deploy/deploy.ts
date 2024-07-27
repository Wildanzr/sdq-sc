import { promises as fs } from "fs";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as path from "path";

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
  const { deployer, minter } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Shodaqo
  const shodaqo = await deploy("Shodaqo", {
    from: deployer,
    log: true,
    args: [deployer, minter],
  });
  console.log(`Shodaqo contract: `, shodaqo.address);

  // SDQCheckIn
  const sdqCheckin = await deploy("SDQCheckIn", {
    from: deployer,
    log: true,
    args: [shodaqo.address],
  });
  console.log(`SDQCheckIn contract: `, sdqCheckin.address);

  // Write the addresses to a file
  const shodaqoParams = `module.exports = ["${deployer}", "${minter}"];`;
  const sdqCheckinParams = `module.exports = ["${shodaqo.address}"];`;
  const path = "args/";
  await writeToFile(`${path}shodaqo.ts`, shodaqoParams);
  await writeToFile(`${path}sdqcheckin.ts`, sdqCheckinParams);

  console.log("----------------------------------------------------------------");
  console.log("Verify the contracts on Etherscan with the following commands:");
  console.log(`bunx hardhat verify --network haqq --constructor-args args/shodaqo.ts ${shodaqo.address} && \nbunx hardhat verify --network haqq --constructor-args args/sdqcheckin.ts ${sdqCheckin.address}
    `);
};
export default func;
func.id = "deploy_sdq"; // id required to prevent reexecution
func.tags = ["Shodaqo"];
