// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Utils.sol";

contract Profiles {
    mapping(address => string) public names;
    mapping(string => address) public nameToAddress;

    
    function setName(string calldata _name) external {
        bytes memory nameBytes = bytes(_name);
        if (nameBytes.length < 3) revert Utils.NAME_TOO_SHORT();
        if (nameBytes.length > 20) revert Utils.NAME_TOO_LONG();
        if (nameToAddress[_name] != address(0)) revert Utils.NAME_ALREADY_TAKEN();

        // Clear old name mapping if exists
        string memory oldName = names[msg.sender];
        if (bytes(oldName).length > 0) {
            delete nameToAddress[oldName];
        }

        names[msg.sender] = _name;
        nameToAddress[_name] = msg.sender;

        emit Utils.NameSet(msg.sender, _name);
    }

    function getName(address _user) external view returns (string memory) {
        return names[_user];
    }
}


// 0x12D32039760A9C729A1558ae3f47f87F40e4901b