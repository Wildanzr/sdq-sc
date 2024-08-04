// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { TokenManagement } from "./TokenManagement.sol";

error AccountError(address user, string reason);
error InsufficientBalance(address user, uint256 available, uint256 required);
error InvalidToken(address token);
error ValidationFailed(address user, string reason);

contract SDQCharity is TokenManagement, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    uint256 public numberOfCampaigns;

    struct Campaign {
        address owner;
        string title;
        string details;
        uint256 target;
        uint256 created;
        bool paused;
        bool claimed;
        mapping(address token => uint256 amount) donations;
    }

    mapping(address user => bool isBlacklisted) public blacklisted;
    mapping(address user => bool isVerified) public verified;
    mapping(uint256 id => Campaign campaign) public campaigns;

    event Donation(
        address indexed donor,
        uint256 campaignId,
        uint256 amount,
        address token,
        string name,
        string message,
        uint256 timestamp
    );

    constructor() TokenManagement(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EDITOR_ROLE, msg.sender);
    }

    function banUser(address user) external onlyRole(EDITOR_ROLE) {
        blacklisted[user] = true;
    }

    function unbanUser(address user) external onlyRole(EDITOR_ROLE) {
        blacklisted[user] = false;
    }

    function verifyUser(address user) external onlyRole(EDITOR_ROLE) {
        verified[user] = true;
    }

    function unverifyUser(address user) external onlyRole(EDITOR_ROLE) {
        verified[user] = false;
    }

    function createCampaign(string memory title, string memory details, uint256 target) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (bytes(title).length == 0 || bytes(details).length == 0 || target == 0) {
            revert ValidationFailed(msg.sender, "Title, details, and target are required");
        }
        numberOfCampaigns++;
        Campaign storage campaign = campaigns[numberOfCampaigns];
        campaign.owner = msg.sender;
        campaign.title = title;
        campaign.details = details;
        campaign.target = target;
        campaign.created = block.timestamp;
    }

    function donateWithToken(
        uint256 campaignId,
        uint256 amount,
        address token,
        string memory name,
        string memory message
    ) external whenNotPaused returns (bool) {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (campaignId == 0 || campaignId > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        if (_isTokenAvailable(token)) {
            revert InvalidToken(token);
        }

        Campaign storage campaign = campaigns[campaignId];
        if (campaign.paused || campaign.claimed || amount == 0) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }

        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert AccountError(msg.sender, "Insufficient allowance");
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        campaign.donations[token] += amount;
        emit Donation(msg.sender, campaignId, amount, token, name, message, block.timestamp);
        return true;
    }
}
