import { expect } from "chai";
import { ethers } from "hardhat";

describe("Tier 1 Features - Token Voting, Multi-Sig, Filtering", function () {
  let proposalVoting: any;
  let governanceToken: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;
  let approver1: any;
  let approver2: any;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, approver1, approver2] = await ethers.getSigners();

    // Deploy governance token
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();

    // Deploy proposal voting with multi-sig (2-of-2 approvers)
    const ProposalVoting = await ethers.getContractFactory("ProposalVoting");
    proposalVoting = await ProposalVoting.deploy(
      await governanceToken.getAddress(),
      [approver1.address, approver2.address],
      2 // require 2 approvals
    );
    await proposalVoting.waitForDeployment();

    // Distribute tokens to voters
    await governanceToken.mint(addr1.address, ethers.parseEther("100"));
    await governanceToken.mint(addr2.address, ethers.parseEther("50"));
    await governanceToken.mint(addr3.address, ethers.parseEther("25"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await proposalVoting.owner()).to.equal(owner.address);
    });

    it("Should set governance token", async function () {
      expect(await proposalVoting.governanceToken()).to.equal(await governanceToken.getAddress());
    });

    it("Should set multi-sig approvers", async function () {
      const [approvers, required] = await proposalVoting.getMultiSigDetails();
      expect(approvers.length).to.equal(2);
      expect(approvers[0]).to.equal(approver1.address);
      expect(approvers[1]).to.equal(approver2.address);
      expect(required).to.equal(2);
    });
  });

  describe("Token-Based Voting - Tier 1", function () {
    beforeEach(async function () {
      await proposalVoting.createProposal(
        "Token Voting Test",
        "Testing token-weighted votes",
        604800n,
        "Governance"
      );
    });

    it("Should allow voting with token balance as weight", async function () {
      await expect(proposalVoting.connect(addr1).vote(0, true))
        .to.emit(proposalVoting, "VoteCasted")
        .withArgs(0, addr1.address, true, 100); // 100 tokens as weight
    });

    it("Should weight votes by token balance", async function () {
      await proposalVoting.connect(addr1).vote(0, true); // 100 tokens
      await proposalVoting.connect(addr2).vote(0, true); // 50 tokens

      const proposal = await proposalVoting.getProposal(0);
      expect(proposal.yesVotes).to.equal(150); // 100 + 50
      expect(proposal.noVotes).to.equal(0);
    });

    it("Should reject voting with insufficient token balance", async function () {
      const signers = await ethers.getSigners();
      const noTokenSigner = signers[7];
      
      await expect(
        proposalVoting.connect(noTokenSigner).vote(0, true)
      ).to.be.revertedWithCustomError(proposalVoting, "ZeroTokenBalance");
    });

    it("Should track individual token weight in vote record", async function () {
      await proposalVoting.connect(addr1).vote(0, true);

      const [hasVoted, support, weight] = await proposalVoting.getVote(0, addr1.address);
      expect(hasVoted).to.be.true;
      expect(support).to.be.true;
      expect(weight).to.equal(100); // Token weight
    });

    it("Should prevent double voting", async function () {
      await proposalVoting.connect(addr1).vote(0, true);

      await expect(
        proposalVoting.connect(addr1).vote(0, false)
      ).to.be.revertedWithCustomError(proposalVoting, "AlreadyVoted");
    });
  });

  describe("Proposal Filtering & Categories - Tier 1", function () {
    beforeEach(async function () {
      await proposalVoting.createProposal(
        "Treasury Proposal 1",
        "Fund allocation",
        604800n,
        "Treasury"
      );
      await proposalVoting.createProposal(
        "Governance Proposal 1",
        "Change voting rules",
        604800n,
        "Governance"
      );
      await proposalVoting.createProposal(
        "Treasury Proposal 2",
        "Grant request",
        604800n,
        "Treasury"
      );
    });

    it("Should filter proposals by category", async function () {
      const treasuryProposals = await proposalVoting.getProposalsByCategory("Treasury");
      expect(treasuryProposals.length).to.equal(2);
      expect(treasuryProposals[0]).to.equal(0n);
      expect(treasuryProposals[1]).to.equal(2n);
    });

    it("Should filter proposals by status", async function () {
      await proposalVoting.connect(addr1).vote(0, true);

      // Move time forward to close voting
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      // Request execution to change status to Closed
      await proposalVoting.requestExecution(0);

      const closedProposals = await proposalVoting.getProposalsByStatus(1); // ProposalStatus.Closed
      expect(closedProposals.length).to.be.greaterThan(0);
    });

    it("Should track proposal category in metadata", async function () {
      const proposal = await proposalVoting.getProposal(0);
      expect(proposal.category).to.equal("Treasury");
    });
  });

  describe("Multi-Signature Execution - Tier 1", function () {
    beforeEach(async function () {
      await proposalVoting.createProposal(
        "Multi-Sig Test",
        "Testing multi-signature execution",
        604800n,
        "Governance"
      );
      await proposalVoting.connect(addr1).vote(0, true); // Pass proposal
    });

    it("Should mark proposal ready for execution after voting ends", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      const proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Closed"); // Waiting for approval
    });

    it("Should allow approvers to approve execution", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      await expect(proposalVoting.connect(approver1).approveExecution(0))
        .to.emit(proposalVoting, "ExecutionApproved")
        .withArgs(0, approver1.address);
    });

    it("Should prevent double approval by same signer", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);

      await expect(
        proposalVoting.connect(approver1).approveExecution(0)
      ).to.be.revertedWithCustomError(proposalVoting, "ApprovalAlreadyGiven");
    });

    it("Should reject execution without enough approvals", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);

      await expect(proposalVoting.executeProposal(0))
        .to.be.revertedWithCustomError(proposalVoting, "InsufficientApprovals");
    });

    it("Should allow execution with sufficient approvals", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);
      await proposalVoting.connect(approver2).approveExecution(0);

      await expect(proposalVoting.executeProposal(0))
        .to.emit(proposalVoting, "ProposalExecuted")
        .withArgs(0);
    });

    it("Should reject approval from non-approver", async function () {
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      await expect(
        proposalVoting.connect(addr1).approveExecution(0)
      ).to.be.revertedWithCustomError(proposalVoting, "OnlyApprover");
    });
  });

  describe("Proposal Status Tracking - Tier 1", function () {
    it("Should track proposal status (Active → Closed → Executed)", async function () {
      await proposalVoting.createProposal(
        "Status Test",
        "Testing status tracking",
        604800n,
        "Governance"
      );

      let proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Active");

      await proposalVoting.connect(addr1).vote(0, true);
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Closed");

      await proposalVoting.connect(approver1).approveExecution(0);
      await proposalVoting.connect(approver2).approveExecution(0);
      await proposalVoting.executeProposal(0);

      proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Executed");
    });

    it("Should mark failed proposals as Rejected", async function () {
      await proposalVoting.createProposal(
        "Failing Proposal",
        "This will fail",
        604800n,
        "Governance"
      );

      await proposalVoting.connect(addr1).vote(0, false);
      await proposalVoting.connect(addr2).vote(0, false);

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      const proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Rejected");
    });
  });

  describe("Voter Analytics - Tier 1", function () {
    beforeEach(async function () {
      await proposalVoting.createProposal(
        "Analytics Test",
        "Testing voter analytics",
        604800n,
        "Governance"
      );
    });

    it("Should return voter participation stats", async function () {
      await proposalVoting.connect(addr1).vote(0, true);

      const [participated, tokenUsed, votingPower] = 
        await proposalVoting.getVoterStats(0, addr1.address);

      expect(participated).to.be.true;
      expect(tokenUsed).to.equal(100);
      expect(votingPower).to.equal(ethers.parseEther("100"));
    });

    it("Should return zero stats for non-voters", async function () {
      const [participated, tokenUsed, votingPower] = 
        await proposalVoting.getVoterStats(0, addr1.address);

      expect(participated).to.be.false;
      expect(tokenUsed).to.equal(0);
      expect(votingPower).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Snapshot-Based Voting - Tier 2", function () {
    it("Should capture snapshot block when proposal is created", async function () {
      const blockBefore = await ethers.provider.getBlockNumber();
      
      await proposalVoting.connect(addr1).createProposal(
        "Snapshot Test",
        "Testing snapshot capture",
        3600,
        "Governance"
      );
      
      const snapshotBlock = await proposalVoting.getProposalSnapshotBlock(0);
      expect(snapshotBlock).to.be.greaterThanOrEqual(blockBefore);
    });
  });
});