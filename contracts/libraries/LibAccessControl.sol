// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';

library LibAccessControl {

    using EnumerableSet for EnumerableSet.AddressSet;

    // event
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    // error
    error Unauthorized(bytes32 role, address account);

    // storage position
    bytes32 constant STORAGE_POSITION = keccak256("contracts.payment.AccessControl");

    // roles

    // 0x0000000000000000000000000000000000000000000000000000000000000000
    bytes32 constant ROLE_OWNER = 0x00;
    // 0x0000000000000000000000000000000000000000000000000000000000000001
    bytes32 constant ROLE_MANAGER = bytes32(uint256(ROLE_OWNER) + 1);

    struct Role {
        EnumerableSet.AddressSet members;
        bytes32 adminRole;
    }

    struct AccessControlStorage {
        mapping(bytes32 => Role) roles;
    }
    
    function layout() internal pure returns (AccessControlStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function grantOwner(address account) internal {
        grantRole(ROLE_OWNER, account);
        emit RoleGranted(ROLE_OWNER, account, address(0));
    }

    function grantRole(bytes32 _role, address account) internal {
        layout().roles[_role].members.add(account);
    }

    function revokeRole(bytes32 _role, address account) internal {
        layout().roles[_role].members.remove(account);
    }

    function getRoleAdmin(bytes32 _role) internal view returns (bytes32) {
        return layout().roles[_role].adminRole;
    }

    function setRoleAdmin(bytes32 _role, bytes32 _adminRole) internal {
        layout().roles[_role].adminRole = _adminRole;
    }

    function hasRole(bytes32 _role, address account) internal view returns (bool) {
        return layout().roles[_role].members.contains(account);
    }

    function enforceIsOwner() internal view {
        enforceIsRole(ROLE_OWNER, msg.sender);
    }

    function enforceIsRole(bytes32 _role, address account) internal view {
        if (!hasRole(_role, account)) {
            revert Unauthorized(_role, account);
        }
    }
}