import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("task:token", "Add token to the contract")
  .addParam("address", "Token address")
  .addParam("ticker", "Token coingecko ticker")
  .setAction(async (taskArgs: TaskArguments, { ethers, deployments }) => {
    const { address, ticker } = taskArgs;
    const signers = await ethers.getSigners();
    const Charity = await deployments.get("SDQCharity");
    const charity = await ethers.getContractAt("SDQCharity", Charity.address, signers[0]);

    console.log("Address: ", address);
    console.log("Ticker: ", ticker);
    console.log("Charity contract: ", Charity.address);
    console.log("Signer: ", signers[0].address);

    console.log("Adding token to the contract");
    await charity.connect(signers[0]).addToken(address, ticker);
    console.log("Token added to the contract");
  });
