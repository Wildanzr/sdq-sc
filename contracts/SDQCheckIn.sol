// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

error AccountError(address claimer, string message);
error InsufficientBalance(string message);

contract SDQCheckIn is AccessControl, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public sdqToken;
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");

    struct ClaimData {
        uint256 lastClaimed;
        uint32 currentDays;
        uint256 totalClaimed;
        bool isBlacklisted;
    }

    mapping(address claimer => ClaimData details) public claimData;

    constructor(address sdq) {
        sdqToken = IERC20(sdq);
        _grantRole(EDITOR_ROLE, msg.sender);
    }

    function checkIn() external {
        if (claimData[msg.sender].isBlacklisted) {
            revert AccountError(msg.sender, "You are blacklisted");
        }
        if (block.timestamp - claimData[msg.sender].lastClaimed < 1 days) {
            revert AccountError(msg.sender, "You can only claim once per day");
        }
        uint256 amount = uint256(1.25 * 10 ** 18);
        if (sdqToken.balanceOf(address(this)) < amount) {
            revert InsufficientBalance("Insufficient balance");
        }

        // Sent 1.25 SQ to the caller
        sdqToken.safeTransfer(msg.sender, amount);
        bool isConsecutive = _isConsecutiveDays(claimData[msg.sender].lastClaimed, claimData[msg.sender].currentDays);

        claimData[msg.sender].lastClaimed = block.timestamp;
        claimData[msg.sender].totalClaimed += amount;
        claimData[msg.sender].currentDays = isConsecutive ? claimData[msg.sender].currentDays + 1 : 1;
    }

    function banClaimer(address claimer) external onlyRole(EDITOR_ROLE) {
        claimData[claimer].isBlacklisted = true;
    }

    function unbanClaimer(address claimer) external onlyRole(EDITOR_ROLE) {
        claimData[claimer].isBlacklisted = false;
    }

    function myCheckInStats() public view returns (ClaimData memory) {
        return claimData[msg.sender];
    }

    function withdraw(uint256 amount) external onlyRole(EDITOR_ROLE) {
        if (sdqToken.balanceOf(address(this)) < amount) {
            revert InsufficientBalance("Insufficient balance");
        }
        sdqToken.safeTransfer(msg.sender, amount);
    }

    function _isConsecutiveDays(uint256 lastClaimed, uint32 currentDays) internal view returns (bool) {
        return block.timestamp - lastClaimed <= currentDays * 1 days && currentDays > 0;
    }
}
