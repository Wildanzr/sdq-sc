// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Pausable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

error TransferFailed(address from, string reason);

/**
 * @title Soulbound
 * @dev A contract for managing Soulbound tokens.
 */
contract Soulbound is ERC721, ERC721Pausable, ERC721URIStorage, AccessControl {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    uint256 public tokenIdCounter;
    string public baseURI;

    constructor(address _admin, string memory _baseURI) ERC721("SDQ Soulbound", "SDQSB") {
        _grantRole(EDITOR_ROLE, _admin);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        baseURI = _baseURI;
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
     * @dev Safely mints a new token.
     * Can only be called by an account with the EDITOR_ROLE.
     * @param to The address to mint the token to.
     */
    function safeMint(address to) public onlyRole(EDITOR_ROLE) {
        tokenIdCounter += 1;
        _safeMint(to, tokenIdCounter);
        _setTokenURI(tokenIdCounter, baseURI);
    }

    /**
     * @dev Returns the URI for a given token ID.
     * @param tokenId The ID of the token.
     * @return The URI for the token's metadata.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Updates the ownership of a token.
     * Can only be called by an account with the EDITOR_ROLE.
     * @param to The address to transfer the token to.
     * @param tokenId The ID of the token.
     * @param auth The address authorizing the transfer.
     * @return The address of the new owner.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert TransferFailed(from, "Soulbound tokens are not transferable");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Checks if a contract supports a given interface.
     * @param interfaceId The interface identifier.
     * @return True if the contract supports the interface, false otherwise.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
