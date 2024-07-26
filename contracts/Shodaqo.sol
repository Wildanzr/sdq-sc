// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Shodaqo is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public immutable MAX_SUPPLY = 100_000_000_000 * 10 ** decimals();

    constructor(address defaultAdmin, address minter) ERC20("Shodaqo", "SDQ") ERC20Permit("Shodaqo") {
        _mint(msg.sender, MAX_SUPPLY);
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }
}
