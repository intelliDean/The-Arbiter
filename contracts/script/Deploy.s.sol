// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Arena.sol";

contract DeployArena is Script {
    function run() external returns (Arena) {
        address referee = vm.envAddress("REFEREE_ADDRESS");
        vm.startBroadcast();
        
        Arena arena = new Arena(referee);
        
        vm.stopBroadcast();
        
        console.log("Arena deployed to:", address(arena));
        console.log("Owner:", arena.owner());
        
        return arena;
    }
}
