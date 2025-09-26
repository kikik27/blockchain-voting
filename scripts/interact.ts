import { ethers } from "hardhat";

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  console.log("🔗 Interacting with Voting contract at:", contractAddress);

  // Get signers
  const [owner, voter1, voter2, voter3] = await ethers.getSigners();
  console.log("Owner:", owner.address);
  console.log("Voter1:", voter1.address);
  console.log("Voter2:", voter2.address);

  // Connect to the deployed contract
  const voting = await ethers.getContractAt("Voting", contractAddress);

  try {
    console.log("\n📊 Current Contract State:");

    // Check voting status
    const votingActive = await voting.votingActive();
    console.log("Voting Active:", votingActive);

    // Get all candidates
    const candidates = await voting.getCandidates();
    console.log("\n👥 Candidates:");
    candidates.forEach((candidate, index) => {
      console.log(`${index}: ${candidate.name} - ${candidate.voteCount} votes`);
    });

    // Get voting statistics
    const [totalVotes, candidateCount, isActive] = await voting.getVotingStats();
    console.log("\n📈 Statistics:");
    console.log(`Total Votes: ${totalVotes}`);
    console.log(`Candidate Count: ${candidateCount}`);
    console.log(`Voting Active: ${isActive}`);

    // Check if voters have voted
    console.log("\n🗳️ Voter Status:");
    console.log(`Voter1 has voted: ${await voting.hasAddressVoted(voter1.address)}`);
    console.log(`Voter2 has voted: ${await voting.hasAddressVoted(voter2.address)}`);
    console.log(`Voter3 has voted: ${await voting.hasAddressVoted(voter3.address)}`);

    // Demonstrate voting (uncomment to test voting)
    /*
    console.log("\n🗳️ Casting Votes...");
    
    // Vote from different accounts
    if (!(await voting.hasAddressVoted(voter1.address))) {
      console.log("Voter1 voting for Alice (index 0)...");
      const tx1 = await voting.connect(voter1).vote(0);
      await tx1.wait();
      console.log("✅ Vote cast by voter1");
    }

    if (!(await voting.hasAddressVoted(voter2.address))) {
      console.log("Voter2 voting for Bob (index 1)...");
      const tx2 = await voting.connect(voter2).vote(1);
      await tx2.wait();
      console.log("✅ Vote cast by voter2");
    }

    if (!(await voting.hasAddressVoted(voter3.address))) {
      console.log("Voter3 voting for Alice (index 0)...");
      const tx3 = await voting.connect(voter3).vote(0);
      await tx3.wait();
      console.log("✅ Vote cast by voter3");
    }

    // Get updated results
    console.log("\n📊 Updated Results:");
    const updatedCandidates = await voting.getCandidates();
    updatedCandidates.forEach((candidate, index) => {
      console.log(`${index}: ${candidate.name} - ${candidate.voteCount} votes`);
    });
    */

    // Get winner if there are votes
    if (totalVotes > 0n) {
      const [winnerName, winnerVotes, winnerIndex] = await voting.getWinner();
      console.log("\n🏆 Current Winner:");
      console.log(`${winnerName} (Index: ${winnerIndex}) with ${winnerVotes} votes`);
    }

    // Demonstrate admin functions (uncomment to test admin functions)
    
    console.log("\n⚙️ Admin Functions Demo:");
    
    // Add a new candidate (voting must be inactive)
    console.log("Pausing voting to add new candidate...");
    const pauseTx = await voting.connect(owner).setVotingStatus(false);
    await pauseTx.wait();
    console.log("✅ Voting paused");

    console.log("Adding new candidate 'Dave'...");
    const addTx = await voting.connect(owner).addCandidate("Dave");
    await addTx.wait();
    console.log("✅ New candidate added");

    console.log("Reactivating voting...");
    const resumeTx = await voting.connect(owner).setVotingStatus(true);
    await resumeTx.wait();
    console.log("✅ Voting resumed");

    // Show updated candidate list
    const finalCandidates = await voting.getCandidates();
    console.log("\n👥 Updated Candidates:");
    finalCandidates.forEach((candidate, index) => {
      console.log(`${index}: ${candidate.name} - ${candidate.voteCount} votes`);
    });
    

    console.log("\n✅ Interaction completed successfully!");

  } catch (error) {
    console.error("❌ Error interacting with contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });