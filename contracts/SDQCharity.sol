// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { TokenManagement } from "./TokenManagement.sol";

error AccountError(address user, string reason);
error InsufficientBalance(address user, uint256 available, uint256 required);
error InvalidToken(address token);
error ValidationFailed(address user, string reason);

contract SDQCharity is TokenManagement, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 private constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    uint32 public numberOfCampaigns;

    struct Campaign {
        address owner;
        string title;
        string details;
        uint256 target;
        uint256 donators;
        uint256 created;
        uint256 updated;
        bool paused;
        bool claimed;
    }

    struct Donation {
        address donor;
        uint256 amount;
    }

    mapping(address user => bool isBlacklisted) public blacklisted;
    mapping(address user => bool isVerified) public verified;
    mapping(uint32 id => Campaign campaign) public campaigns;
    mapping(uint32 id => uint256 donations) public campaignNativeDonations;
    mapping(uint32 id => mapping(address token => uint256) donations) public campaignDonations;
    mapping(uint32 id => mapping(address user => uint32) donationsCount) public campaignDonationsCount;

    event CampaignDonation(
        address indexed donor,
        uint256 campaignId,
        uint256 amount,
        address token,
        string name,
        string message,
        uint256 timestamp
    );
    event CampaignCreated(
        address indexed owner,
        uint256 campaignId,
        string title,
        string details,
        uint256 target,
        uint256 timestamp
    );
    event CampaignUpdated(
        address indexed owner,
        uint256 campaignId,
        string title,
        string details,
        uint256 target,
        uint256 timestamp
    );
    event CampaignPaused(address indexed owner, uint256 campaignId, uint256 timestamp);
    event CampaignUnpaused(address indexed owner, uint256 campaignId, uint256 timestamp);
    event CampaignClaimed(address indexed owner, uint256 campaignId, uint256 timestamp);

    constructor() TokenManagement(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EDITOR_ROLE, msg.sender);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
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

    function isVerifiedUser(address user) external view returns (bool) {
        return verified[user];
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
        campaign.updated = block.timestamp;
        emit CampaignCreated(msg.sender, numberOfCampaigns, title, details, target, block.timestamp);
    }

    function updateCampaign(
        uint32 id,
        string memory title,
        string memory details,
        uint256 target
    ) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (id == 0 || id > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        Campaign storage campaign = campaigns[id];
        if (campaign.owner != msg.sender) {
            revert AccountError(msg.sender, "You are not the owner");
        }

        if (campaign.claimed) {
            revert ValidationFailed(msg.sender, "Campaign is already claimed");
        }

        if (bytes(title).length == 0 || bytes(details).length == 0 || target == 0) {
            revert ValidationFailed(msg.sender, "Title, details, and target are required");
        }

        campaign.title = title;
        campaign.details = details;
        campaign.target = target;
        campaign.updated = block.timestamp;
        emit CampaignUpdated(msg.sender, id, title, details, target, block.timestamp);
    }

    function pauseCampaign(uint32 id) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (id == 0 || id > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        Campaign storage campaign = campaigns[id];
        if (campaign.owner != msg.sender) {
            revert AccountError(msg.sender, "You are not the owner");
        }

        campaign.paused = true;
        campaign.updated = block.timestamp;
        emit CampaignPaused(msg.sender, id, block.timestamp);
    }

    function unpauseCampaign(uint32 id) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (id == 0 || id > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        Campaign storage campaign = campaigns[id];
        if (campaign.owner != msg.sender) {
            revert AccountError(msg.sender, "You are not the owner");
        }

        campaign.paused = false;
        campaign.updated = block.timestamp;
        emit CampaignUnpaused(msg.sender, id, block.timestamp);
    }

    function donateWithToken(
        uint32 campaignId,
        uint256 amount,
        address token,
        string memory name,
        string memory message
    ) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (campaignId == 0 || campaignId > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        if (!_isTokenAvailable(token)) {
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

        campaignDonations[campaignId][token] += amount;
        if (campaignDonationsCount[campaignId][msg.sender] == 0) {
            campaign.donators++;
            campaignDonationsCount[campaignId][msg.sender] = 1;
        } else {
            campaignDonationsCount[campaignId][msg.sender]++;
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit CampaignDonation(msg.sender, campaignId, amount, token, name, message, block.timestamp);
    }

    function donate(uint32 campaignId, string memory name, string memory message) external payable whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (campaignId == 0 || campaignId > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        Campaign storage campaign = campaigns[campaignId];
        if (campaign.paused || campaign.claimed || msg.value == 0) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }

        campaignNativeDonations[campaignId] += msg.value;
        if (campaignDonationsCount[campaignId][msg.sender] == 0) {
            campaign.donators++;
            campaignDonationsCount[campaignId][msg.sender] = 1;
        } else {
            campaignDonationsCount[campaignId][msg.sender]++;
        }

        emit CampaignDonation(msg.sender, campaignId, msg.value, address(0), name, message, block.timestamp);
    }

    function withdrawCampaign(uint32 id) external whenNotPaused nonReentrant {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (id == 0 || id > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        Campaign storage campaign = campaigns[id];
        if (campaign.owner != msg.sender) {
            revert AccountError(msg.sender, "You are not the owner");
        }

        if (campaign.claimed) {
            revert ValidationFailed(msg.sender, "Campaign is already claimed");
        }

        campaign.claimed = true;
        campaign.paused = true;
        campaign.updated = block.timestamp;

        payable(msg.sender).transfer(campaignNativeDonations[id]);
        (address[] memory _tokens, ) = _getAvailableTokens();
        for (uint256 i = 0; i < _tokens.length; ) {
            if (_tokens[i] == address(0)) {
                unchecked {
                    ++i;
                }
                continue;
            }

            IERC20(_tokens[i]).safeTransfer(msg.sender, campaignDonations[id][_tokens[i]]);
            unchecked {
                ++i;
            }
        }
        emit CampaignClaimed(msg.sender, id, block.timestamp);
    }

    function getCampaignDetails(uint32 campaignId) external view returns (Campaign memory) {
        if (campaignId == 0 || campaignId > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        return campaigns[campaignId];
    }

    function getCampaignDonations(uint32 id) external view returns (address[] memory tokens, uint256[] memory amounts) {
        if (id == 0 || id > numberOfCampaigns) {
            revert ValidationFailed(msg.sender, "Invalid campaign ID");
        }

        (address[] memory _tokens, ) = _getAvailableTokens();
        uint256[] memory _amounts = new uint256[](_tokens.length + 1);
        address[] memory _tokenList = new address[](_tokens.length + 1);
        for (uint256 i = 0; i < _tokens.length; ) {
            _amounts[i] = campaignDonations[id][_tokens[i]];
            _tokenList[i] = _tokens[i];
            unchecked {
                ++i;
            }
        }
        _amounts[_tokens.length] = campaignNativeDonations[id];
        _tokenList[_tokens.length] = address(0);

        return (_tokenList, _amounts);
    }
}
