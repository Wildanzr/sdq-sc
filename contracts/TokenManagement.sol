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

    struct TokenDetails {
        address token;
        string name;
    }

    EnumerableMap.AddressToUintMap private tokenIds;
    mapping(address token => string name) public tokenNames;
    mapping(string name => address token) public tokenAddresses;
    TokenDetails[] public tokens;

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
        if (token == address(0)) {
            revert ValidationError("Token address cannot be zero");
        }
        if (bytes(name).length == 0) {
            revert ValidationError("Name cannot be empty");
        }
        if (_isTokenAvailable(token)) {
            revert ValidationError("Token already exists");
        }
        tokenNames[token] = name;
        tokenAddresses[name] = token;
        tokens.push(TokenDetails(token, name));
        tokenIds.set(token, 0);
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
        delete tokenNames[token];
        tokenIds.remove(token);
        emit TokenRemoved(token);
    }

    /**
     * @dev Get the available tokens.
     * @return _tokens An array of token addresses.
     * @return _names An array of token names.
     */
    function getAvailableTokens() external view returns (address[] memory _tokens, string[] memory _names) {
        return _getAvailableTokens();
    }

    /**
     * @dev Get the available tokens.
     * @return _tokens An array of token addresses.
     * @return _names An array of token names.
     */
    function _getAvailableTokens() internal view returns (address[] memory _tokens, string[] memory _names) {
        address[] memory _tokenAddresses = new address[](tokenIds.length());
        string[] memory _tokenNames = new string[](tokenIds.length());

        for (uint256 i = 0; i < tokenIds.length(); i++) {
            _tokenNames[i] = tokens[i].name;
            _tokenAddresses[i] = tokens[i].token;
        }

        return (_tokenAddresses, _tokenNames);
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
