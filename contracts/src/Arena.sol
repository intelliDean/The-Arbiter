// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title The Arbiter (Arena)
 * @dev A simple wagering contract for competitive gaming, managed by an autonomous arbiter.
 */
contract Arena {
    enum MatchStatus { Pending, Active, Settled, Cancelled }

    struct Match {
        uint256 id;
        address creator;
        address opponent;
        uint256 stake;
        address referee;
        MatchStatus status;
        address winner;
    }

    uint256 public nextMatchId;
    mapping(uint256 => Match) public matches;
    address public owner;

    event MatchCreated(uint256 indexed matchId, address creator, uint256 stake, address referee);
    event MatchJoined(uint256 indexed matchId, address opponent);
    event MatchSettled(uint256 indexed matchId, address winner);
    event MatchCancelled(uint256 indexed matchId);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new match with a specific stake and referee.
     */
    function createMatch(address _referee) external payable returns (uint256) {
        require(msg.value > 0, "Stake must be greater than 0");
        require(_referee != address(0), "Referee cannot be zero address");

        uint256 matchId = nextMatchId++;
        matches[matchId] = Match({
            id: matchId,
            creator: msg.sender,
            opponent: address(0),
            stake: msg.value,
            referee: _referee,
            status: MatchStatus.Pending,
            winner: address(0)
        });

        emit MatchCreated(matchId, msg.sender, msg.value, _referee);
        return matchId;
    }

    /**
     * @dev Join a pending match by matching the stake.
     */
    function joinMatch(uint256 _matchId) external payable {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Pending, "Match not pending");
        require(msg.value == m.stake, "Must match the exact stake");
        require(msg.sender != m.creator, "Cannot join your own match");

        m.opponent = msg.sender;
        m.status = MatchStatus.Active;

        emit MatchJoined(_matchId, msg.sender);
    }

    /**
     * @dev Settle a match. Only the designated referee can call this.
     */
    function settleMatch(uint256 _matchId, address _winner) external {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Active, "Match not active");
        require(msg.sender == m.referee, "Only referee can settle");
        require(_winner == m.creator || _winner == m.opponent, "Winner must be a participant");

        m.status = MatchStatus.Settled;
        m.winner = _winner;

        uint256 totalPrize = m.stake * 2;
        (bool success, ) = _winner.call{value: totalPrize}("");
        require(success, "Transfer failed");

        emit MatchSettled(_matchId, _winner);
    }

    /**
     * @dev Cancel a match if it hasn't started yet.
     */
    function cancelMatch(uint256 _matchId) external {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Pending, "Only pending matches can be cancelled");
        require(msg.sender == m.creator, "Only creator can cancel");

        m.status = MatchStatus.Cancelled;
        (bool success, ) = m.creator.call{value: m.stake}("");
        require(success, "Refund failed");

        emit MatchCancelled(_matchId);
    }

    receive() external payable {}
}
