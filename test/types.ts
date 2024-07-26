import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { SDQCheckIn, Shodaqo } from "../types";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    shodaqo: Shodaqo;
    sdqCheckin: SDQCheckIn;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;

    // Variables
    owner: HardhatEthersSigner;
    minter: HardhatEthersSigner;
    accounts: HardhatEthersSigner[];
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
