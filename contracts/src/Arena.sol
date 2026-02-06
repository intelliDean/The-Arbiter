// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Utils.sol";

/**
 * @title The Arbiter (Arena)
 * @dev A simple wagering contract for competitive gaming, managed by an autonomous arbiter.
 */
contract Arena {
    address public owner;
    address public officialReferee;
    uint256 public nextMatchId;
    mapping(uint256 => Utils.Match) public matches;

    // Fee System
    uint256 public constant FEE_BPS = 250; // 2.5%
    // Timeout Config
    uint256 public constant TIMEOUT = 24 hours;
    uint256 public totalFees;

    // Pull Withdrawal Pattern
    mapping(address => uint256) public pendingWithdrawals;

    // Custom Reentrancy Guard
    bool private locked;
    modifier nonReentrant() {
        if (locked) revert Utils.REENTRANCY();
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Utils.ONLY_OWNER();
        _;
    }



    constructor(address _referee) {
        owner = msg.sender;
        officialReferee = _referee;
    }

    /**
     * @dev Update the official referee address.
     */
    function setOfficialReferee(address _newReferee) external onlyOwner {
        if (_newReferee == address(0)) revert Utils.INVALID_REFEREE();
        officialReferee = _newReferee;
    }

    /**
     * @dev Create a new match with a specific stake and referee.
     */
    function createMatch(uint256 _guess) external payable returns (uint256) {
        if (msg.value == 0) revert Utils.MUST_BE_GREATER_THAN_ZERO();
        if (_guess == 0 || _guess > 100) revert Utils.INVALID_GUESS();

        uint256 matchId = nextMatchId++;
        matches[matchId] = Utils.Match({
            id: matchId,
            creator: msg.sender,
            opponent: address(0),
            stake: msg.value,
            status: Utils.MatchStatus.Pending,
            winner: address(0),
            lastUpdate: block.timestamp,
            creatorGuess: _guess,
            opponentGuess: 0,
            targetNumber: 0
        });

        emit Utils.MatchCreated(matchId, msg.sender, msg.value, _guess);
        return matchId;
    }
    /**
     * @dev Join a pending match by matching the stake.
     */
    function joinMatch(uint256 _matchId, uint256 _guess) external payable {
        Utils.Match storage m = matches[_matchId];
        if (m.status != Utils.MatchStatus.Pending) revert Utils.MATCH_NOT_PENDING();
        if (msg.value != m.stake) revert Utils.INCORRECT_STAKE();
        if (msg.sender == m.creator) revert Utils.CANNOT_JOIN_OWN_MATCH();
        if (_guess == 0 || _guess > 100) revert Utils.INVALID_GUESS();

        m.opponent = msg.sender;
        m.opponentGuess = _guess;
        m.status = Utils.MatchStatus.Active;
        m.lastUpdate = block.timestamp;

        emit Utils.MatchJoined(_matchId, msg.sender, _guess);
    }

    /**
     * @dev Settle a match. Winnings are moved to pendingWithdrawals.
     */
    function settleMatch(uint256 _matchId, address _winner, uint256 _targetNumber) external {
        Utils.Match storage m = matches[_matchId];
        if (m.status != Utils.MatchStatus.Active) revert Utils.MATCH_NOT_ACTIVE();
        if (msg.sender != officialReferee) revert Utils.ONLY_REFEREE_CAN_SETTLE();
        if (_winner != m.creator && _winner != m.opponent) revert Utils.WINNER_MUST_BE_PARTICIPANT();

        m.status = Utils.MatchStatus.Settled;
        m.winner = _winner;
        m.targetNumber = _targetNumber;
        m.lastUpdate = block.timestamp;
        uint256 totalPool = m.stake * 2;
        uint256 fee = (totalPool * FEE_BPS) / 10000;
        uint256 prize = totalPool - fee;

        totalFees += fee;
        pendingWithdrawals[_winner] += prize;

        emit Utils.MatchSettled(_matchId, _winner, prize, fee, _targetNumber);
    }

    /**
     * @dev Standard pull-withdrawal for players.
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert Utils.NOTHING_TO_WITHDRAW();

        pendingWithdrawals[msg.sender] = 0;
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert Utils.TRANSFER_FAILED();

        emit Utils.WinningsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Only the creator can cancel if no one joined.
     */
    function cancelMatch(uint256 _matchId) external nonReentrant {
        Utils.Match storage m = matches[_matchId];
        if (m.status != Utils.MatchStatus.Pending) revert Utils.ONLY_PENDING_MATCHES_CAN_BE_CANCELLED();
        if (msg.sender != m.creator) revert Utils.ONLY_CREATOR_CAN_CANCEL();

        m.status = Utils.MatchStatus.Cancelled;
        m.lastUpdate = block.timestamp;

        (bool success,) = m.creator.call{value: m.stake}("");
        if (!success) revert Utils.REFUND_FAILED();

        emit Utils.MatchCancelled(_matchId);
    }

    /**
     * @dev Emergency reclaim if a match is stuck in Active status. Splits pool back to players.
     */
    function emergencyClaim(uint256 _matchId) external nonReentrant {
        Utils.Match storage m = matches[_matchId];
        if (m.status != Utils.MatchStatus.Active) revert Utils.MATCH_NOT_ACTIVE();
        if (block.timestamp < m.lastUpdate + TIMEOUT) revert Utils.TIMEOUT_NOT_REACHED();

        m.status = Utils.MatchStatus.Cancelled;

        uint256 amount = m.stake;
        address creator = m.creator;
        address opponent = m.opponent;

        (bool s1,) = creator.call{value: amount}("");
        (bool s2,) = opponent.call{value: amount}("");

        if (!s1 || !s2) revert Utils.REFUND_FAILED();

        emit Utils.EmergencyClaim(_matchId, creator, opponent);
    }

    /**
     * @dev Owner can withdraw platform fees.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFees;
        if (amount == 0) revert Utils.NOTHING_TO_WITHDRAW();

        totalFees = 0;
        (bool success,) = owner.call{value: amount}("");
        if (!success) revert Utils.TRANSFER_FAILED();

        emit Utils.FeesWithdrawn(owner, amount);
    }

    receive() external payable {}
}



// Deployer: 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
// Deployed to: 0xE72Aa9D0791b2Bd42c6f6cAaFd7dC9995ce77E1a
// Transaction hash: 0x3ffcee138ad57991422dd2ca8b2489884f502844b7d746770b5ff5da5891ecc6


// cast call 0xE72Aa9D0791b2Bd42c6f6cAaFd7dC9995ce77E1a "owner()(address)" --rpc-url https://testnet-rpc.monad.xyz