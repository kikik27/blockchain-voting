import { expect } from "chai";
import { ethers } from "hardhat";
import { Voting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Voting Contract", function () {
  let voting: Voting;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let voter3: HardhatEthersSigner;

  const candidates = ["Alice", "Bob", "Charlie"];

  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy the contract
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy(candidates);
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct candidates", async function () {
      const candidateCount = await voting.getCandidateCount();
      expect(candidateCount).to.equal(3);

      for (let i = 0; i < candidates.length; i++) {
        const [name, voteCount] = await voting.getCandidate(i);
        expect(name).to.equal(candidates[i]);
        expect(voteCount).to.equal(0);
      }
    });

    it("Should start with voting active", async function () {
      expect(await voting.votingActive()).to.be.true;
    });

    it("Should revert if no candidates provided", async function () {
      const VotingFactory = await ethers.getContractFactory("Voting");
      await expect(VotingFactory.deploy([])).to.be.revertedWith("At least one candidate required");
    });
  });

  describe("Voting", function () {
    it("Should allow a voter to cast a vote", async function () {
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 0, "Alice");

      const [, voteCount] = await voting.getCandidate(0);
      expect(voteCount).to.equal(1);
      expect(await voting.hasAddressVoted(voter1.address)).to.be.true;
      expect(await voting.totalVotes()).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      await voting.connect(voter1).vote(0);
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("You have already voted");
    });

    it("Should revert for invalid candidate index", async function () {
      await expect(voting.connect(voter1).vote(5))
        .to.be.revertedWith("Invalid candidate index");
    });

    it("Should prevent voting when voting is inactive", async function () {
      await voting.setVotingStatus(false);
      await expect(voting.connect(voter1).vote(0))
        .to.be.revertedWith("Voting is not active");
    });

    it("Should track vote details correctly", async function () {
      await voting.connect(voter1).vote(1);
      const [hasVotedBool, candidateIndex] = await voting.getVoteDetails(voter1.address);
      expect(hasVotedBool).to.be.true;
      expect(candidateIndex).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change voting status", async function () {
      await expect(voting.setVotingStatus(false))
        .to.emit(voting, "VotingStatusChanged")
        .withArgs(false);
      expect(await voting.votingActive()).to.be.false;
    });

    it("Should prevent non-owner from changing voting status", async function () {
      await expect(voting.connect(voter1).setVotingStatus(false))
        .to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow owner to add candidates when voting is inactive", async function () {
      await voting.setVotingStatus(false);
      await expect(voting.addCandidate("Dave"))
        .to.emit(voting, "CandidateAdded")
        .withArgs("Dave", 3);

      const candidateCount = await voting.getCandidateCount();
      expect(candidateCount).to.equal(4);
    });

    it("Should prevent adding candidates when voting is active", async function () {
      await expect(voting.addCandidate("Dave"))
        .to.be.revertedWith("Cannot add candidates while voting is active");
    });

    it("Should prevent non-owner from adding candidates", async function () {
      await voting.setVotingStatus(false);
      await expect(voting.connect(voter1).addCandidate("Dave"))
        .to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Cast some votes
      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(1); // Bob
      await voting.connect(voter3).vote(0); // Alice
    });

    it("Should return correct winner", async function () {
      const [name, voteCount, index] = await voting.getWinner();
      expect(name).to.equal("Alice");
      expect(voteCount).to.equal(2);
      expect(index).to.equal(0);
    });

    it("Should return correct voting statistics", async function () {
      const [totalVotesCount, candidateCount, isActive] = await voting.getVotingStats();
      expect(totalVotesCount).to.equal(3);
      expect(candidateCount).to.equal(3);
      expect(isActive).to.be.true;
    });

    it("Should return all candidates with vote counts", async function () {
      const allCandidates = await voting.getCandidates();
      expect(allCandidates.length).to.equal(3);
      expect(allCandidates[0].name).to.equal("Alice");
      expect(allCandidates[0].voteCount).to.equal(2);
      expect(allCandidates[1].name).to.equal("Bob");
      expect(allCandidates[1].voteCount).to.equal(1);
      expect(allCandidates[2].name).to.equal("Charlie");
      expect(allCandidates[2].voteCount).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle tie situations in getWinner", async function () {
      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(1); // Bob

      const [name, voteCount, index] = await voting.getWinner();
      // Should return the first candidate in case of tie
      expect(name).to.equal("Alice");
      expect(voteCount).to.equal(1);
      expect(index).to.equal(0);
    });

    it("Should handle empty candidate name validation", async function () {
      await voting.setVotingStatus(false);
      await expect(voting.addCandidate(""))
        .to.be.revertedWith("Candidate name cannot be empty");
    });

    it("Should return correct details for non-voted address", async function () {
      const [hasVotedBool, candidateIndex] = await voting.getVoteDetails(voter1.address);
      expect(hasVotedBool).to.be.false;
      expect(candidateIndex).to.equal(0); // Default value
    });
  });
});