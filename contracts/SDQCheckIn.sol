// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SoulboundInterface } from "./SoulboundInterface.sol";

error AccountError(address claimer, string reason);
error InsufficientBalance(address claimer, uint256 available, uint256 required);

/**
 * @title SDQCheckIn
 * @dev A contract for daily token check-ins with consecutive day rewards.
 */
contract SDQCheckIn is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public sdqToken;
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    address[3] public soulboundContract;

    struct ClaimData {
        uint256 lastClaimed;
        uint32 consecutiveDays;
        uint256 totalClaimed;
    }

    mapping(address claimer => bool isBlacklisted) public blacklisted;
    mapping(address claimer => ClaimData details) public claimData;
    mapping(uint32 day => uint256 amount) public dailyClaimAmount;

    event CheckIn(address indexed claimer, uint256 amount);
    event Ban(address indexed claimer);
    event Unban(address indexed claimer);
    event Withdrawal(address indexed operator, uint256 amount);

    /**
     * @dev Initializes the contract with the token address and sets up initial roles.
     * @param sdq The address of the SDQ token contract.
     */
    constructor(address sdq, address[3] memory _soulbound) {
        sdqToken = IERC20(sdq);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EDITOR_ROLE, msg.sender);

        dailyClaimAmount[0] = 1.25 * 10 ** 18;
        dailyClaimAmount[1] = 1.5 * 10 ** 18;
        dailyClaimAmount[2] = 2 * 10 ** 18;
        dailyClaimAmount[3] = 3 * 10 ** 18;
        dailyClaimAmount[4] = 5 * 10 ** 18;
        dailyClaimAmount[5] = 7 * 10 ** 18;
        dailyClaimAmount[6] = 10 * 10 ** 18;
        soulboundContract = _soulbound;
    }

    /**
     * @dev Pauses the contract, preventing check-ins.
     * Can only be called by an account with the EDITOR_ROLE.
     */
    function pause() external onlyRole(EDITOR_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract, allowing check-ins.
     * Can only be called by an account with the EDITOR_ROLE.
     */
    function unpause() external onlyRole(EDITOR_ROLE) {
        _unpause();
    }

    /**
     * @dev Allows a user to check in and claim tokens for the day.
     * Requires the contract to be unpaused and not reentrant.
     */
    function checkIn() external whenNotPaused nonReentrant {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        uint256 currentDay = block.timestamp / 1 days;
        ClaimData storage userData = claimData[msg.sender];

        if (userData.lastClaimed != 0 && userData.lastClaimed / 1 days == currentDay) {
            revert AccountError(msg.sender, "You can only claim once per day");
        }

        bool isConsecutive = currentDay - userData.lastClaimed / 1 days == 1;
        uint32 consecutiveDays = isConsecutive ? (userData.consecutiveDays % 7) : 0;
        uint256 amount = dailyClaimAmount[consecutiveDays];
        uint256 balance = sdqToken.balanceOf(address(this));
        if (balance < amount) {
            revert InsufficientBalance(msg.sender, balance, amount);
        }

        userData.lastClaimed = block.timestamp;
        userData.totalClaimed += amount;
        userData.consecutiveDays = isConsecutive ? userData.consecutiveDays + 1 : 1;
        sdqToken.safeTransfer(msg.sender, amount);

        emit CheckIn(msg.sender, amount);
    }

    /**
     * @dev Bans a user from checking in.
     * Can only be called by an account with the EDITOR_ROLE.
     * @param claimer The address of the user to ban.
     */
    function banClaimer(address claimer) external onlyRole(EDITOR_ROLE) {
        blacklisted[claimer] = true;
        emit Ban(claimer);
    }

    /**
     * @dev Unbans a user, allowing them to check in again.
     * Can only be called by an account with the EDITOR_ROLE.
     * @param claimer The address of the user to unban.
     */
    function unbanClaimer(address claimer) external onlyRole(EDITOR_ROLE) {
        blacklisted[claimer] = false;
        emit Unban(claimer);
    }

    /**
     * @dev Returns the check-in statistics of the caller.
     * @return The ClaimData struct of the caller.
     */
    function myCheckInStats() public view returns (ClaimData memory) {
        return claimData[msg.sender];
    }

    /**
     * @dev Returns the Soulbound contracts used by the check-in contract.
     * @return An array of the Soulbound contract addresses.
     */
    function getSoulboundContracts() public view returns (address[3] memory) {
        return soulboundContract;
    }

    /**
     * @dev Withdraws tokens from the contract.
     * Can only be called by an account with the EDITOR_ROLE.
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyRole(EDITOR_ROLE) nonReentrant {
        uint256 balance = sdqToken.balanceOf(address(this));
        if (balance < amount) {
            revert InsufficientBalance(msg.sender, balance, amount);
        }
        sdqToken.safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Mints the first Soulbound token for the caller.
     * Requires the caller to have checked in at least once.
     */
    function mintMyFirstSBT() public {
        if (claimData[msg.sender].consecutiveDays == 0) {
            revert AccountError(msg.sender, "You must check in at least once");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[0]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mints a Soulbound token for the caller after checking in for at least 7 days.
     */
    function mintMyOneWeekSBT() public {
        if (claimData[msg.sender].consecutiveDays < 7) {
            revert AccountError(msg.sender, "You must check in for at least 7 days");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[1]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mints a Soulbound token for the caller after checking in for at least 30 days.
     */
    function mintMyOneMonthSBT() public {
        if (claimData[msg.sender].consecutiveDays < 30) {
            revert AccountError(msg.sender, "You must check in for at least 30 days");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[2]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }
}
