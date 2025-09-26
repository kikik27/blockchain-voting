// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Voting
 * @dev A simple voting smart contract
 * @author Your Name
 */
contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public voterToCandidate;
    
    uint256 public totalVotes;
    bool public votingActive;

    event Voted(address indexed voter, uint256 candidateIndex, string candidateName);
    event VotingStatusChanged(bool active);
    event CandidateAdded(string name, uint256 index);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        _;
    }

    constructor(string[] memory candidateNames) {
        require(candidateNames.length > 0, "At least one candidate required");
        
        owner = msg.sender;
        votingActive = true;
        
        for (uint256 i = 0; i < candidateNames.length; i++) {
            require(bytes(candidateNames[i]).length > 0, "Candidate name cannot be empty");
            candidates.push(Candidate({
                name: candidateNames[i], 
                voteCount: 0
            }));
            emit CandidateAdded(candidateNames[i], i);
        }
    }

    /**
     * @dev Cast a vote for a candidate
     * @param candidateIndex Index of the candidate to vote for
     */
    function vote(uint256 candidateIndex) external votingIsActive {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateIndex < candidates.length, "Invalid candidate index");

        hasVoted[msg.sender] = true;
        voterToCandidate[msg.sender] = candidateIndex;
        candidates[candidateIndex].voteCount += 1;
        totalVotes += 1;

        emit Voted(msg.sender, candidateIndex, candidates[candidateIndex].name);
    }

    /**
     * @dev Get all candidates with their vote counts
     * @return Array of all candidates
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @dev Get a specific candidate by index
     * @param index Candidate index
     * @return name The candidate's name
     * @return voteCount The candidate's vote count
    */
    function getCandidate(uint256 index) external view returns (string memory name, uint256 voteCount) {
        require(index < candidates.length, "Invalid candidate index");
        Candidate memory candidate = candidates[index];
        return (candidate.name, candidate.voteCount);
    }

    /**
     * @dev Get the total number of candidates
     * @return Number of candidates
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @dev Get the winning candidate (in case of tie, returns the first one)
     * @return name Winner's name
     * @return voteCount Winner's vote count
     * @return index Winner's index
     */
    function getWinner() external view returns (string memory name, uint256 voteCount, uint256 index) {
        require(candidates.length > 0, "No candidates available");
        
        uint256 winningVoteCount = 0;
        uint256 winningIndex = 0;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningIndex = i;
            }
        }
        
        return (candidates[winningIndex].name, winningVoteCount, winningIndex);
    }

    /**
     * @dev Add a new candidate (only owner, only when voting is not active)
     * @param candidateName Name of the new candidate
     */
    function addCandidate(string memory candidateName) external onlyOwner {
        require(!votingActive, "Cannot add candidates while voting is active");
        require(bytes(candidateName).length > 0, "Candidate name cannot be empty");
        
        candidates.push(Candidate({
            name: candidateName,
            voteCount: 0
        }));
        
        emit CandidateAdded(candidateName, candidates.length - 1);
    }

    /**
     * @dev Start or stop the voting process
     * @param active Whether voting should be active
     */
    function setVotingStatus(bool active) external onlyOwner {
        votingActive = active;
        emit VotingStatusChanged(active);
    }

    /**
     * @dev Check if an address has voted
     * @param voter Address to check
     * @return Whether the address has voted
     */
    function hasAddressVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }

    /**
     * @dev Get vote details for a specific address
     * @param voter Address to check
     * @return hasVotedBool Whether they voted
     * @return candidateIndex Index of candidate they voted for (0 if not voted)
     */
    function getVoteDetails(address voter) external view returns (bool hasVotedBool, uint256 candidateIndex) {
        return (hasVoted[voter], voterToCandidate[voter]);
    }

    /**
     * @dev Get voting statistics
     * @return totalVotesCount Total number of votes cast
     * @return candidateCount Total number of candidates
     * @return isActive Whether voting is currently active
     */
    function getVotingStats() external view returns (uint256 totalVotesCount, uint256 candidateCount, bool isActive) {
        return (totalVotes, candidates.length, votingActive);
    }
}