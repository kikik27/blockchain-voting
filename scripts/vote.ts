import { ethers } from "hardhat";

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  if (contractAddress === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable or update the script");
    process.exit(1);
  }

  console.log("🗳️ Voting Script");
  console.log("Contract Address:", contractAddress);

  // Get signers
  const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();

  // Connect to contract
  const voting = await ethers.getContractAt("Voting", contractAddress);

  try {
    // Check if voting is active
    const votingActive = await voting.votingActive();
    if (!votingActive) {
      console.log("❌ Voting is not active");
      return;
    }

    // Display candidates
    console.log("\n👥 Available Candidates:");
    const candidates = await voting.getCandidates();
    candidates.forEach((candidate, index) => {
      console.log(`${index}: ${candidate.name} - ${candidate.voteCount} votes`);
    });

    // Simulate voting from multiple accounts
    const voters = [
      { signer: voter1, name: "Voter1", candidateIndex: 0, candidateName: "Alice" },
      { signer: voter2, name: "Voter2", candidateIndex: 1, candidateName: "Bob" },
      { signer: voter3, name: "Voter3", candidateIndex: 0, candidateName: "Alice" },
      { signer: voter4, name: "Voter4", candidateIndex: 2, candidateName: "Charlie" },
    ];

    console.log("\n🗳️ Casting Votes...");

    for (const voter of voters) {
      try {
        // Check if already voted
        const hasVoted = await voting.hasAddressVoted(voter.signer.address);
        if (hasVoted) {
          console.log(`⚠️ ${voter.name} (${voter.signer.address}) has already voted`);
          continue;
        }

        console.log(`${voter.name} voting for ${voter.candidateName} (index ${voter.candidateIndex})...`);

        const tx = await voting.connect(voter.signer).vote(voter.candidateIndex);
        const receipt = await tx.wait();

        console.log(`✅ ${voter.name} vote confirmed - Block: ${receipt?.blockNumber}, Gas used: ${receipt?.gasUsed}`);

        // Add delay between votes for better visibility
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error voting for ${voter.name}:`, error);
      }
    }

    // Display final results
    console.log("\n📊 Final Results:");
    const finalCandidates = await voting.getCandidates();
    finalCandidates.forEach((candidate, index) => {
      console.log(`${index}: ${candidate.name} - ${candidate.voteCount} votes`);
    });

    // Get winner
    const [winnerName, winnerVotes, winnerIndex] = await voting.getWinner();
    console.log(`\n🏆 Winner: ${winnerName} (Index: ${winnerIndex}) with ${winnerVotes} votes`);

    // Display voting statistics
    const [totalVotes, candidateCount, isActive] = await voting.getVotingStats();
    console.log(`\n📈 Statistics:`);
    console.log(`Total Votes Cast: ${totalVotes}`);
    console.log(`Number of Candidates: ${candidateCount}`);
    console.log(`Voting Status: ${isActive ? "Active" : "Inactive"}`);

    // Show vote details for each voter
    console.log(`\n🔍 Vote Details:`);
    for (const voter of voters) {
      const [hasVotedBool, candidateIndex] = await voting.getVoteDetails(voter.signer.address);
      if (hasVotedBool) {
        const [candidateName] = await voting.getCandidate(candidateIndex);
        console.log(`${voter.name} (${voter.signer.address}): Voted for ${candidateName} (Index: ${candidateIndex})`);
      } else {
        console.log(`${voter.name} (${voter.signer.address}): Has not voted`);
      }
    }

  } catch (error) {
    console.error("❌ Error in voting script:", error);
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Voting script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Voting script failed:", error);
    process.exitCode = 1;
  });