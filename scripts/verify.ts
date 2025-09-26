import { run } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";

  if (contractAddress === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/verify.ts --network sepolia");
    process.exit(1);
  }

  // Constructor arguments used during deployment
  const candidates = ["Alice", "Bob", "Charlie"];

  console.log("🔍 Verifying contract on Etherscan...");
  console.log("Contract Address:", contractAddress);
  console.log("Constructor Args:", candidates);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: candidates,
    });

    console.log("✅ Contract verified successfully!");

  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });