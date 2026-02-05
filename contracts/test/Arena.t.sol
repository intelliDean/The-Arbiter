// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Arena.sol";
import "../src/Utils.sol";

contract ArenaTest is Test {
    Arena public arena;
    address public creator = address(0x1);
    address public opponent = address(0x2);
    address public referee = address(0x3);
    address public owner = address(this);

    function setUp() public {
        arena = new Arena();
        vm.deal(creator, 10 ether);
        vm.deal(opponent, 10 ether);
    }

    function testCreateMatch() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        (uint256 id, address mCreator, address mOpponent, uint256 stake, address mReferee, Utils.MatchStatus status, address _unused_winner, uint256 lastUpdate) = arena.matches(matchId);

        assertEq(id, 0);
        assertEq(mCreator, creator);
        assertEq(mOpponent, address(0));
        assertEq(stake, 1 ether);
        assertEq(mReferee, referee);
        assertTrue(status == Utils.MatchStatus.Pending);
        assertEq(lastUpdate, block.timestamp);
    }

    function testSettleMatchWithFees() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);

        vm.prank(referee);
        arena.settleMatch(matchId, creator);

        // Verification
        uint256 totalPool = 2 ether;
        uint256 expectedFee = (totalPool * arena.FEE_BPS()) / 10000;
        uint256 expectedPrize = totalPool - expectedFee;

        assertEq(arena.totalFees(), expectedFee);
        assertEq(arena.pendingWithdrawals(creator), expectedPrize);
        
        // Test Withdrawal
        uint256 balBefore = creator.balance;
        vm.prank(creator);
        arena.withdraw();
        assertEq(creator.balance, balBefore + expectedPrize);
    }

    function testEmergencyClaim() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);

        // Try to claim before timeout
        vm.expectRevert(Utils.TIMEOUT_NOT_REACHED.selector);
        arena.emergencyClaim(matchId);

        // Fast forward
        vm.warp(block.timestamp + arena.TIMEOUT() + 1);

        uint256 cBalBefore = creator.balance;
        uint256 oBalBefore = opponent.balance;

        arena.emergencyClaim(matchId);

        assertEq(creator.balance, cBalBefore + 1 ether);
        assertEq(opponent.balance, oBalBefore + 1 ether);
        
        (, , , , , Utils.MatchStatus status, , ) = arena.matches(matchId);
        assertTrue(status == Utils.MatchStatus.Cancelled);
    }

    function testWithdrawFees() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);
        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);
        vm.prank(referee);
        arena.settleMatch(matchId, creator);

        uint256 fees = arena.totalFees();
        assertTrue(fees > 0);

        uint256 balBefore = owner.balance;
        arena.withdrawFees();
        assertEq(owner.balance, balBefore + fees);
    }

    receive() external payable {}
}
