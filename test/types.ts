import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { AssetToken, SDQCharity, SDQCheckIn, Shodaqo } from "../types";

type Fixture<T> = () => Promise<T>;

interface Asset {
  name: string;
  ticker: string;
  mintAmount: bigint;
  decimals: number;
}

declare module "mocha" {
  export interface Context {
    // Contracts
    shodaqo: Shodaqo;
    sdqCheckin: SDQCheckIn;
    sdqCharity: SDQCharity;
    asetToken: AssetToken;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;

    // Variables
    owner: HardhatEthersSigner;
    minter: HardhatEthersSigner;
    accounts: HardhatEthersSigner[];
    deployedAssets: AssetToken[];
    assets: Asset[];
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
