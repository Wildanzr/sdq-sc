// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

error AccountError(address claimer, string message);
error InsufficientBalance(string message);

contract SDQCheckIn is AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    IERC20 public sdqToken;
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");

    struct ClaimData {
        uint256 lastClaimed;
        uint32 currentDays;
        uint256 totalClaimed;
        bool isBlacklisted;
    }

    mapping(address claimer => ClaimData details) public claimData;
    mapping(uint32 day => uint256 amount) public dailyClaimAmount;

    constructor(address sdq) {
        sdqToken = IERC20(sdq);
        _grantRole(EDITOR_ROLE, msg.sender);

        dailyClaimAmount[0] = 1.25 * 10 ** 18;
        dailyClaimAmount[1] = 1.5 * 10 ** 18;
        dailyClaimAmount[2] = 2 * 10 ** 18;
        dailyClaimAmount[3] = 3 * 10 ** 18;
        dailyClaimAmount[4] = 5 * 10 ** 18;
        dailyClaimAmount[5] = 7 * 10 ** 18;
        dailyClaimAmount[6] = 10 * 10 ** 18;
    }

    function pause() external onlyRole(EDITOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(EDITOR_ROLE) {
        _unpause();
    }

    function checkIn() external whenNotPaused {
        if (claimData[msg.sender].isBlacklisted) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        uint256 currentDay = block.timestamp / 1 days;
        if (claimData[msg.sender].lastClaimed != 0) {
            if (claimData[msg.sender].lastClaimed / 1 days == currentDay) {
                revert AccountError(msg.sender, "You can only claim once per day");
            }
        }

        bool isConsecutive = currentDay - claimData[msg.sender].lastClaimed / 1 days == 1;
        uint32 currentDays = isConsecutive ? (claimData[msg.sender].currentDays % 7) : 0;
        uint256 amount = dailyClaimAmount[currentDays];
        if (sdqToken.balanceOf(address(this)) < amount) {
            revert InsufficientBalance("Insufficient balance");
        }

        // Sent 1.25 SQ to the caller
        sdqToken.safeTransfer(msg.sender, amount);

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
}
