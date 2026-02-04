// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Arena.sol";

contract ArenaTest is Test {
    Arena public arena;
    address public creator = address(1);
    address public opponent = address(2);
    address public referee = address(3);

    function setUp() public {
        arena = new Arena();
        vm.deal(creator, 10 ether);
        vm.deal(opponent, 10 ether);
    }

    function testCreateMatch() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        (uint256 id, address mCreator, address mOpponent, uint256 stake, address mReferee, Arena.MatchStatus status, address winner) = arena.matches(matchId);

        assertEq(id, 0);
        assertEq(mCreator, creator);
        assertEq(mOpponent, address(0));
        assertEq(stake, 1 ether);
        assertEq(mReferee, referee);
        assertTrue(status == Arena.MatchStatus.Pending);
    }

    function testJoinMatch() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);

        (, , address mOpponent, , , Arena.MatchStatus status, ) = arena.matches(matchId);
        assertEq(mOpponent, opponent);
        assertTrue(status == Arena.MatchStatus.Active);
    }

    function testSettleMatch() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);

        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(referee);
        arena.settleMatch(matchId, creator);

        (, , , , , Arena.MatchStatus status, address winner) = arena.matches(matchId);
        assertTrue(status == Arena.MatchStatus.Settled);
        assertEq(winner, creator);
        assertEq(creator.balance, creatorBalanceBefore + 2 ether);
    }

    function testCancelMatch() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(creator);
        arena.cancelMatch(matchId);

        (, , , , , Arena.MatchStatus status, ) = arena.matches(matchId);
        assertTrue(status == Arena.MatchStatus.Cancelled);
        assertEq(creator.balance, creatorBalanceBefore + 1 ether);
    }

    function testJoinSameCreator() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(creator);
        vm.expectRevert("Cannot join your own match");
        arena.joinMatch{value: 1 ether}(matchId);
    }

    function testSettleWrongReferee() public {
        vm.prank(creator);
        uint256 matchId = arena.createMatch{value: 1 ether}(referee);

        vm.prank(opponent);
        arena.joinMatch{value: 1 ether}(matchId);

        vm.prank(opponent); // Not the referee
        vm.expectRevert("Only referee can settle");
        arena.settleMatch(matchId, creator);
    }
}
