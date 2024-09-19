// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { TokenManagement } from "./TokenManagement.sol";
import { SoulboundInterface } from "./SoulboundInterface.sol";

error AccountError(address user, string reason);
error InsufficientBalance(address user, uint256 available, uint256 required);
error InvalidToken(address token);
error ValidationFailed(address user, string reason);

contract SDQCharity is TokenManagement, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 private constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    uint32 public numberOfCampaigns;
    uint8 public constant PLATFORM_FEE = 1;
    address[8] public soulboundContract;

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
    mapping(address user => uint8 count) public donationCount;
    mapping(address user => uint8 count) public campaignCount;
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
        string description,
        string details,
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

    constructor(address[8] memory _soulbound) TokenManagement(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EDITOR_ROLE, msg.sender);
        soulboundContract = _soulbound;
    }

    /**
     * @dev Pause the contract.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Ban a user.
     * @param user The address of the user to ban.
     */
    function banUser(address user) external onlyRole(EDITOR_ROLE) {
        blacklisted[user] = true;
    }

    /**
     * @dev Unban a user.
     * @param user The address of the user to unban.
     */
    function unbanUser(address user) external onlyRole(EDITOR_ROLE) {
        blacklisted[user] = false;
    }

    /**
     * @dev Verify a user.
     * @param user The address of the user to verify.
     */
    function verifyUser(address user) external onlyRole(EDITOR_ROLE) {
        verified[user] = true;
    }

    /**
     * @dev Unverify a user.
     * @param user The address of the user to unverify.
     */
    function unverifyUser(address user) external onlyRole(EDITOR_ROLE) {
        verified[user] = false;
    }

    /**
     * @dev Check if a user is verified.
     * @param user The address of the user to check.
     * @return Whether the user is verified or not.
     */
    function isVerifiedUser(address user) external view returns (bool) {
        return verified[user];
    }

    /**
     * @dev Returns the Soulbound contracts used by the check-in contract.
     * @return An array of the Soulbound contract addresses.
     */
    function getSoulboundContracts() public view returns (address[8] memory) {
        return soulboundContract;
    }

    function getPaginatedCampaignsIndex(uint32 page, uint32 limit) external view returns (uint32[] memory) {
        if (limit >= 20) {
            limit = 20;
        }

        uint32[] memory myCampaigns = new uint32[](limit);
        uint32 index = 0;
        uint32 startIndex = (page - 1) * limit + 1;
        uint32 found = 0;
        uint32 i = startIndex;
        do {
            myCampaigns[index] = i;
            ++index;
            ++found;
            unchecked {
                ++i;
            }
        } while (i <= numberOfCampaigns && found < limit);
        return myCampaigns;
    }

    function getMyCampaignIndex(uint32 page, uint32 limit) external view returns (uint32[] memory) {
        if (limit >= 20) {
            limit = 20;
        }
        uint32[] memory myCampaigns = new uint32[](limit);
        uint32 index = 0;
        uint32 found = 0;
        uint32 skipped = 0;
        uint32 i = page * limit - limit;

        while (i <= numberOfCampaigns && found < limit) {
            if (campaigns[i].owner == msg.sender) {
                if (skipped < (page - 1) * limit) {
                    skipped++;
                } else {
                    myCampaigns[index] = i;
                    index++;
                    found++;
                }
            }
            unchecked {
                i++;
            }
        }
        return myCampaigns;
    }

    function createCampaign(
        string memory title,
        string memory description,
        string memory details,
        uint256 target
    ) external whenNotPaused {
        if (blacklisted[msg.sender]) {
            revert AccountError(msg.sender, "You are blacklisted");
        }

        if (bytes(title).length == 0 || bytes(description).length == 0 || bytes(details).length == 0 || target == 0) {
            revert ValidationFailed(msg.sender, "Title, details, and target are required");
        }
        numberOfCampaigns++;
        campaignCount[msg.sender]++;
        Campaign storage campaign = campaigns[numberOfCampaigns];
        campaign.owner = msg.sender;
        campaign.title = title;
        campaign.details = details;
        campaign.target = target;
        campaign.created = block.timestamp;
        campaign.updated = block.timestamp;
        emit CampaignCreated(msg.sender, numberOfCampaigns, title, description, details, block.timestamp);
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
        if (campaign.claimed) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }
        if (campaign.paused) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }
        if (amount == 0) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }

        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        if (allowance < amount) {
            revert AccountError(msg.sender, "Insufficient allowance");
        }

        campaignDonations[campaignId][token] += amount;
        donationCount[msg.sender]++;
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
        if (campaign.claimed) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }
        if (campaign.paused) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }
        if (msg.value == 0) {
            revert ValidationFailed(msg.sender, "Validation failed");
        }

        campaignNativeDonations[campaignId] += msg.value;
        donationCount[msg.sender]++;
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

        uint256 sendAmount = campaignNativeDonations[id];
        uint256 platformFee = (sendAmount * PLATFORM_FEE) / 100;
        sendAmount -= platformFee;
        payable(msg.sender).transfer(sendAmount);
        (address[] memory _tokens, , ) = _getAvailableTokens();
        for (uint256 i = 0; i < _tokens.length; ) {
            uint256 tokenAmount = campaignDonations[id][_tokens[i]];
            uint256 tokenPlatformFee = (tokenAmount * PLATFORM_FEE) / 100;
            tokenAmount -= tokenPlatformFee;
            IERC20(_tokens[i]).safeTransfer(msg.sender, tokenAmount);

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

        (address[] memory _tokens, , ) = _getAvailableTokens();
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

    /**
     * @dev Mint a Soulbound token for the user's first donation.
     */
    function mintMyFirstDonationSBT() public {
        if (donationCount[msg.sender] == 0) {
            revert AccountError(msg.sender, "You have not donated yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[0]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's fifth donation.
     */
    function mintMyFifthDonationSBT() public {
        if (donationCount[msg.sender] < 5) {
            revert AccountError(msg.sender, "You have not donated 5 times yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[1]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's tenth donation.
     */
    function mintMyTenDonationSBT() public {
        if (donationCount[msg.sender] < 10) {
            revert AccountError(msg.sender, "You have not donated 10 times yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[2]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's fiftieth donation.
     */
    function mintMyFiftyDonationSBT() public {
        if (donationCount[msg.sender] < 50) {
            revert AccountError(msg.sender, "You have not donated 50 times yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[3]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's hundredth donation.
     */
    function mintMyHundredDonationSBT() public {
        if (donationCount[msg.sender] < 100) {
            revert AccountError(msg.sender, "You have not donated 100 times yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[4]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's first campaign.
     */
    function mintMyFirstCampaignSBT() public {
        if (campaignCount[msg.sender] == 0) {
            revert AccountError(msg.sender, "You have not created a campaign yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[5]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's third campaign.
     */
    function mintMyThirdCampaignSBT() public {
        if (campaignCount[msg.sender] < 3) {
            revert AccountError(msg.sender, "You have not created 3 campaigns yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[6]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }

    /**
     * @dev Mint a Soulbound token for the user's tenth campaign.
     */
    function mintMyTenCampaignSBT() public {
        if (campaignCount[msg.sender] < 10) {
            revert AccountError(msg.sender, "You have not created 10 campaigns yet");
        }
        SoulboundInterface sbt = SoulboundInterface(soulboundContract[7]);
        if (sbt.balanceOf(msg.sender) > 0) {
            revert AccountError(msg.sender, "You already have a Soulbound token");
        }
        sbt.safeMint(msg.sender);
    }
}
