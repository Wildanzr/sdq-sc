// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract AssetToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public mintAmount;

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _ticker,
        uint256 _amount
    ) ERC20(_name, _ticker) ERC20Permit(_name) {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _defaultAdmin);
        mintAmount = _amount;
    }

    function mint() external {
        _mint(msg.sender, mintAmount);
    }

    function mintTo(address account, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(account, amount);
    }
}
