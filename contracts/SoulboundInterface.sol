// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

abstract contract SoulboundInterface {
    function safeMint(address to) public virtual;
    function balanceOf(address owner) public view virtual returns (uint256);
}
