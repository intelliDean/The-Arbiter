// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

library Utils {
    //CUSTOM ERRORS
    error MUST_BE_GREATER_THAN_ZERO();
    error INVALID_REFEREE();
    error MATCH_NOT_PENDING();
    error INCORRECT_STAKE();
    error CANNOT_JOIN_OWN_MATCH();
    error MATCH_NOT_ACTIVE();
    error ONLY_REFEREE_CAN_SETTLE();
    error WINNER_MUST_BE_PARTICIPANT();
    error ONLY_PENDING_MATCHES_CAN_BE_CANCELLED();
    error ONLY_CREATOR_CAN_CANCEL();
    error TRANSFER_FAILED();
    error REFUND_FAILED();
    error TIMEOUT_NOT_REACHED();
    error NOTHING_TO_WITHDRAW();
    error ONLY_OWNER();
    error REENTRANCY();
    error INVALID_GUESS();


    //EVENTS
    event MatchCreated(uint256 indexed matchId, address creator, uint256 stake, uint256 guess);
    event MatchJoined(uint256 indexed matchId, address opponent, uint256 guess);
    event MatchSettled(uint256 indexed matchId, address winner, uint256 prize, uint256 fee, uint256 targetNumber);
    event MatchCancelled(uint256 indexed matchId);
    event WinningsWithdrawn(address indexed player, uint256 amount);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event EmergencyClaim(uint256 indexed matchId, address creator, address opponent);

    //OBJECTS
    enum MatchStatus { 
        Pending, 
        Active, 
        Settled, 
        Cancelled 
    }

   struct Match {
        uint256 id;
        address creator;
        address opponent;
        uint256 stake;
        MatchStatus status;
        address winner;
        uint256 lastUpdate;
        uint256 creatorGuess;
        uint256 opponentGuess;
        uint256 targetNumber;
    }
}
