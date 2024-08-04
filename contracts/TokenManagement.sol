// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { EnumerableMap } from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

error ValidationError(string message);

/**
 * @title TokenManagement
 * @dev A contract for managing tokens with role-based access control.
 */
contract TokenManagement is AccessControl {
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    bytes32 private constant EDITOR_ROLE = keccak256("EDITOR_ROLE");

    EnumerableMap.AddressToUintMap private tokenIds;
    mapping(address token => string name) public tokenNames;

    struct TokenDetails {
        address tokenAddr;
        string tokenName;
    }

    event TokenAdded(address indexed token, string name);
    event TokenRemoved(address indexed token);

    /**
     * @dev Contract constructor.
     * @param editor The address of the editor role.
     */
    constructor(address editor) {
        _grantRole(DEFAULT_ADMIN_ROLE, editor);
        _grantRole(EDITOR_ROLE, editor);
    }

    /**
     * @dev Add a new token.
     * @param token The address of the token.
     * @param name The name of the token.
     */
    function addToken(address token, string memory name) external onlyRole(EDITOR_ROLE) {
        if (bytes(name).length == 0) {
            revert ValidationError("Name cannot be empty");
        }
        if (tokenIds.set(token, 1)) {
            revert ValidationError("Token already exists");
        }
        tokenNames[token] = name;
        emit TokenAdded(token, name);
    }

    /**
     * @dev Remove an existing token.
     * @param token The address of the token.
     */
    function removeToken(address token) external onlyRole(EDITOR_ROLE) {
        if (!tokenIds.remove(token)) {
            revert ValidationError("Token does not exist");
        }
        emit TokenRemoved(token);
    }

    /**
     * @dev Get the details of all available tokens.
     * @return An array of TokenDetails structs.
     */
    function getAvailableTokens() external view returns (TokenDetails[] memory) {
        TokenDetails[] memory tokens = new TokenDetails[](tokenIds.length());
        for (uint256 i = 0; i < tokenIds.length(); ) {
            (address token, ) = tokenIds.at(i);
            tokens[i] = TokenDetails(token, tokenNames[token]);
            unchecked {
                i += 1;
            }
        }
        return tokens;
    }

    /**
     * @dev Check if a token is available.
     * @param token The address of the token.
     * @return A boolean indicating if the token is available.
     */
    function _isTokenAvailable(address token) internal view returns (bool) {
        return tokenIds.contains(token);
    }
}
