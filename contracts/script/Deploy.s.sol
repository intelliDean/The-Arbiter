// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Arena.sol";

contract DeployArena is Script {
    function run() external returns (Arena) {
        vm.startBroadcast();
        
        Arena arena = new Arena();
        
        vm.stopBroadcast();
        
        console.log("Arena deployed to:", address(arena));
        console.log("Owner:", arena.owner());
        
        return arena;
    }
}
