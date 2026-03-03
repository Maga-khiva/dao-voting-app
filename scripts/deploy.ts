import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying Tier 1 DAO contracts...\n");

  // Deploy GovernanceToken first
  console.log("1️⃣ Deploying GovernanceToken...");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy();
  await governanceToken.waitForDeployment();

  const tokenAddress = await governanceToken.getAddress();
  console.log("✅ GovernanceToken deployed to:", tokenAddress);

  // Get signers for multi-sig setup
  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  console.log("\n2️⃣ Setting up Multi-Sig approvers...");
  console.log("   Owner:", owner.address);
  
  // For testnet with single signer: use owner as both approver and owner
  const approver1 = signers[1] || owner;
  const approver2 = signers[2] || owner;
  
  console.log("   Approver 1:", approver1.address);
  console.log("   Approver 2:", approver2.address);
  console.log("   Required Approvals: 2 of 2");

  // Deploy ProposalVoting with token and multi-sig
  console.log("\n3️⃣ Deploying ProposalVoting with Tier 1 features...");
  const ProposalVoting = await ethers.getContractFactory("ProposalVoting");
  const proposalVoting = await ProposalVoting.deploy(
    tokenAddress,
    [approver1.address, approver2.address],
    2 // 2-of-2 multi-sig
  );

  await proposalVoting.waitForDeployment();

  const votingAddress = await proposalVoting.getAddress();
  console.log("✅ ProposalVoting deployed to:", votingAddress);

  // Verify token was set
  const tokenFromContract = await proposalVoting.governanceToken();
  console.log("\n✅ Governance Token registered:", tokenFromContract === tokenAddress);

  // Verify multi-sig setup
  const [approvers, required] = await proposalVoting.getMultiSigDetails();
  console.log("✅ Multi-Sig Approvers:", approvers.length, "Required:", required);

  // Save contract addresses to file for frontend use
  const network = await ethers.provider.getNetwork();
  const contractInfo = {
    address: votingAddress,
    tokenAddress: tokenAddress,
    approvers: [approver1.address, approver2.address],
    requiredApprovals: 2,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    features: {
      tokenVoting: true,
      multiSigExecution: true,
      proposalFiltering: true,
      voterAnalytics: true,
      amendments: true,
    },
  };

  const filePath = path.join(__dirname, "../frontend/src/config/contract.json");
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(contractInfo, null, 2));

  console.log("\n📝 Contract info saved to:", filePath);
  console.log("\n🎉 Tier 1 Deployment Complete!");
  console.log("   Proposal Voting:", votingAddress);
  console.log("   Governance Token:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });