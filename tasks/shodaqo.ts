import { parseEther } from "ethers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("refill:sdq", "Refill SDQ Checkin Contract")
  .addParam("value", "How much SDQ token to be transferred to the contract")
  .addParam("contract", "The address of the contract")
  .setAction(async (taskArgs: TaskArguments, { ethers }) => {
    const { value, contract } = taskArgs;
    const signers = await ethers.getSigners();
    console.log("Refilling SDQ Checkin Contract");
    console.log("Value: ", parseEther(value));
    console.log("Contract: ", contract);

    console.log("Signer: ", signers[0].address);
  });
