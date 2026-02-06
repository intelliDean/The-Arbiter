// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Arena.sol";
import "../src/Profiles.sol";

contract DeployArena is Script {
    function run() external {
        address referee = vm.envAddress("REFEREE_ADDRESS");
        vm.startBroadcast();

        Profiles profiles = new Profiles();
        Arena arena = new Arena(referee);

        vm.stopBroadcast();

        console.log("Profiles deployed to:", address(profiles));
        console.log("Arena deployed to:", address(arena));
        console.log("Owner:", arena.owner());
    }
}
