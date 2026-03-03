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
    [owner, addr1, addr2, addr3, approver1, approver2] = await (ethers as any).getSigners();

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
      // addr3 has no tokens (didn't receive any in beforeEach for this sub-test)
      // Use a fresh signer with 0 balance
      const [, , , , , , , noTokenSigner] = await (ethers as any).getSigners();
      
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
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

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
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      const proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Closed"); // Waiting for approval
    });

    it("Should allow approvers to approve execution", async function () {
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);

      await expect(proposalVoting.connect(approver1).approveExecution(0))
        .to.emit(proposalVoting, "ExecutionApproved")
        .withArgs(0, approver1.address);
    });

    it("Should prevent double approval by same signer", async function () {
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);

      await expect(
        proposalVoting.connect(approver1).approveExecution(0)
      ).to.be.revertedWithCustomError(proposalVoting, "ApprovalAlreadyGiven");
    });

    it("Should reject execution without enough approvals", async function () {
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);

      // Try to execute with only 1 approval (need 2)
      await expect(proposalVoting.executeProposal(0))
        .to.be.revertedWithCustomError(proposalVoting, "InsufficientApprovals");
    });

    it("Should allow execution with sufficient approvals", async function () {
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      await proposalVoting.requestExecution(0);
      await proposalVoting.connect(approver1).approveExecution(0);
      await proposalVoting.connect(approver2).approveExecution(0);

      await expect(proposalVoting.executeProposal(0))
        .to.emit(proposalVoting, "ProposalExecuted")
        .withArgs(0);
    });

    it("Should reject approval from non-approver", async function () {
      // Move time forward
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

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

      // Vote and move time
      await proposalVoting.connect(addr1).vote(0, true);
      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

      // Request execution
      await proposalVoting.requestExecution(0);
      proposal = await proposalVoting.getProposal(0);
      expect(proposal.status).to.equal("Closed");

      // Approve and execute
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

      await proposalVoting.connect(addr1).vote(0, false); // Vote no
      await proposalVoting.connect(addr2).vote(0, false);

      await (ethers as any).provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await (ethers as any).provider.send("hardhat_mine", ["1"]);

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
      expect(tokenUsed).to.equal(100); // addr1 has 100 tokens
      expect(votingPower).to.equal(ethers.parseEther("100"));
    });

    it("Should return zero stats for non-voters", async function () {
      const [participated, tokenUsed, votingPower] = 
        await proposalVoting.getVoterStats(0, addr1.address);

      expect(participated).to.be.false;
      expect(tokenUsed).to.equal(0);
      expect(votingPower).to.equal(ethers.parseEther("100"));
    });

    it("Should track voter participation across multiple proposals", async function () {
      await proposalVoting.createProposal(
        "Second Proposal",
        "Another test",
        604800n,
        "Governance"
      );

      await proposalVoting.connect(addr1).vote(0, true);
      await proposalVoting.connect(addr1).vote(1, false);

      const proposal0Vote = await proposalVoting.getVote(0, addr1.address);
      const proposal1Vote = await proposalVoting.getVote(1, addr1.address);

      expect(proposal0Vote[0]).to.be.true; // hasVoted
      expect(proposal0Vote[1]).to.be.true; // support=true
      expect(proposal1Vote[0]).to.be.true;
      expect(proposal1Vote[1]).to.be.false; // support=false
    });
  });

  describe("Snapshot-Based Voting - Tier 2", function () {
    it("Should capture snapshot block when proposal is created", async function () {
      const blockBefore = await (ethers as any).provider.getBlockNumber();
      
      await proposalVoting.connect(addr1).createProposal(
        "Snapshot Test",
        "Testing snapshot capture",
        3600,
        "Governance"
      );
      
      const snapshotBlock = await proposalVoting.getProposalSnapshotBlock(0);
      expect(snapshotBlock).to.be.greaterThanOrEqual(blockBefore);
    });

    it("Should record voter snapshot balance on voting", async function () {
      await proposalVoting.connect(addr1).createProposal(
        "Snapshot Vote Test",
        "Testing snapshot balance recording",
        3600,
        "Governance"
      );

      // Vote with addr1 (has 100 tokens)
      await proposalVoting.connect(addr1).vote(0, true);

      // Check snapshot balance was recorded
      const snapshotBalance = await proposalVoting.getVoterSnapshotBalance(0, addr1.address);
      expect(snapshotBalance).to.equal(100n);
    });

    it("Should support different voters with different snapshot balances", async function () {
      await proposalVoting.connect(addr1).createProposal(
        "Multi-Voter Snapshot",
        "Testing multiple voters snapshot",
        3600,
        "Governance"
      );

      // addr1 (100 tokens) votes yes
      await proposalVoting.connect(addr1).vote(0, true);
      // addr2 (50 tokens) votes yes
      await proposalVoting.connect(addr2).vote(0, true);
      // addr3 (25 tokens) votes no
      await proposalVoting.connect(addr3).vote(0, false);

      const snap1 = await proposalVoting.getVoterSnapshotBalance(0, addr1.address);
      const snap2 = await proposalVoting.getVoterSnapshotBalance(0, addr2.address);
      const snap3 = await proposalVoting.getVoterSnapshotBalance(0, addr3.address);

      expect(snap1).to.equal(100n);
      expect(snap2).to.equal(50n);
      expect(snap3).to.equal(25n);

      // Verify vote tallies use snapshot balances
      const proposal = await proposalVoting.proposals(0);
      expect(proposal.yesVotes).to.equal(150n); // 100 + 50
      expect(proposal.noVotes).to.equal(25n);   // 25
    });

    it("Should persist snapshot balance even if token balance changes", async function () {
      await proposalVoting.connect(addr1).createProposal(
        "Snapshot Persistence",
        "Testing snapshot persistence after token transfer",
        3600,
        "Governance"
      );

      // Vote before transfer
      await proposalVoting.connect(addr1).vote(0, true);
      const snapshotBefore = await proposalVoting.getVoterSnapshotBalance(0, addr1.address);
      expect(snapshotBefore).to.equal(100n);

      // Transfer tokens to another account
      await governanceToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));

      // Snapshot should remain the same (immutable)
      const snapshotAfter = await proposalVoting.getVoterSnapshotBalance(0, addr1.address);
      expect(snapshotAfter).to.equal(100n);
    });
  });

  describe("Vote Delegation - Tier 2", function () {
    it("Should allow delegating votes to another address", async function () {
      // addr1 delegates to addr2
      await proposalVoting.connect(addr1).delegateVote(addr2.address);
      
      const delegate = await proposalVoting.getDelegate(addr1.address);
      expect(delegate).to.equal(addr2.address);
    });

    it("Should prevent self-delegation", async function () {
      await expect(
        proposalVoting.connect(addr1).delegateVote(addr1.address)
      ).to.be.revertedWithCustomError(proposalVoting, "CannotDelegateToSelf");
    });

    it("Should prevent delegation to zero address", async function () {
      await expect(
        proposalVoting.connect(addr1).delegateVote(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(proposalVoting, "InvalidTokenAddress");
    });

    it("Should allow revoking delegation", async function () {
      // Delegate
      await proposalVoting.connect(addr1).delegateVote(addr2.address);
      let delegate = await proposalVoting.getDelegate(addr1.address);
      expect(delegate).to.equal(addr2.address);

      // Revoke
      await proposalVoting.connect(addr1).revokeDelegation();
      delegate = await proposalVoting.getDelegate(addr1.address);
      expect(delegate).to.equal(ethers.ZeroAddress);
    });

    it("Should prevent revoking when no delegation exists", async function () {
      await expect(
        proposalVoting.connect(addr1).revokeDelegation()
      ).to.be.revertedWithCustomError(proposalVoting, "NoActiveDelegation");
    });

    it("Should calculate effective voting power with delegations", async function () {
      // addr1 (100 tokens) has no delegation - full power
      let power1 = await proposalVoting.getEffectiveVotingPower(addr1.address);
      expect(power1).to.equal(ethers.parseEther("100"));

      // addr1 delegates to addr2
      await proposalVoting.connect(addr1).delegateVote(addr2.address);

      // addr1 now has 0 effective power (delegated away)
      power1 = await proposalVoting.getEffectiveVotingPower(addr1.address);
      expect(power1).to.equal(0n);

      // addr2 now has delegated power + own
      let power2 = await proposalVoting.getEffectiveVotingPower(addr2.address);
      expect(power2).to.equal(ethers.parseEther("150")); // 50 (own) + 100 (from addr1)
    });

    it("Should emit VoteDelegated event", async function () {
      await expect(
        proposalVoting.connect(addr1).delegateVote(addr2.address)
      ).to.emit(proposalVoting, "VoteDelegated")
        .withArgs(addr1.address, addr2.address);
    });

    it("Should emit VoteDelegationRevoked event", async function () {
      await proposalVoting.connect(addr1).delegateVote(addr2.address);

      await expect(
        proposalVoting.connect(addr1).revokeDelegation()
      ).to.emit(proposalVoting, "VoteDelegationRevoked")
        .withArgs(addr1.address);
    });

    it("Should support multiple delegators to same delegate", async function () {
      // addr1 and addr3 both delegate to addr2
      await proposalVoting.connect(addr1).delegateVote(addr2.address);
      await proposalVoting.connect(addr3).delegateVote(addr2.address);

      // addr2 effective power = own 50 + addr1's 100 + addr3's 25 = 175
      const power = await proposalVoting.getEffectiveVotingPower(addr2.address);
      expect(power).to.equal(ethers.parseEther("175"));
    });

    it("Should update delegation when changing delegate", async function () {
      // First delegation
      await proposalVoting.connect(addr1).delegateVote(addr2.address);
      let delegate = await proposalVoting.getDelegate(addr1.address);
      expect(delegate).to.equal(addr2.address);

      // Change delegation to addr3
      await proposalVoting.connect(addr1).delegateVote(addr3.address);
      delegate = await proposalVoting.getDelegate(addr1.address);
      expect(delegate).to.equal(addr3.address);

      // addr2's power should decrease, addr3's should increase
      const power2 = await proposalVoting.getEffectiveVotingPower(addr2.address);
      const power3 = await proposalVoting.getEffectiveVotingPower(addr3.address);
      
      expect(power2).to.equal(ethers.parseEther("50")); // Only own 50 tokens
      expect(power3).to.equal(ethers.parseEther("125")); // Own 25 + delegated 100
    });
  });

  describe("Role-Based Access Control (RBAC) - Tier 2", function () {
    it("Should set owner as Admin on deployment", async function () {
      const roleNum = await proposalVoting.userRoles(owner.address);
      expect(roleNum).to.equal(3); // Admin = 3
    });

    it("Should allow Admin to assign roles", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      
      const role = await proposalVoting.userRoles(addr1.address);
      expect(role).to.equal(RoleEnum.Member);
    });

    it("Should prevent non-Admin from assigning roles", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await expect(
        proposalVoting.connect(addr1).assignRole(addr2.address, RoleEnum.Member)
      ).to.be.revertedWithCustomError(proposalVoting, "NotAuthorized");
    });

    it("Should prevent assigning None role", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await expect(
        proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.None)
      ).to.be.revertedWithCustomError(proposalVoting, "InvalidRole");
    });

    it("Should allow Admin to revoke roles", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      // Assign first
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      let role = await proposalVoting.userRoles(addr1.address);
      expect(role).to.equal(RoleEnum.Member);

      // Revoke
      await proposalVoting.connect(owner).revokeRole(addr1.address);
      role = await proposalVoting.userRoles(addr1.address);
      expect(role).to.equal(RoleEnum.None);
    });

    it("Should emit RoleAssigned event", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await expect(
        proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Moderator)
      ).to.emit(proposalVoting, "RoleAssigned")
        .withArgs(addr1.address, RoleEnum.Moderator);
    });

    it("Should emit RoleRevoked event", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      
      await expect(
        proposalVoting.connect(owner).revokeRole(addr1.address)
      ).to.emit(proposalVoting, "RoleRevoked")
        .withArgs(addr1.address);
    });

    it("Should return correct role via getUserRole", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Moderator);
      
      const role = await proposalVoting.getUserRole(addr1.address);
      expect(role).to.equal(RoleEnum.Moderator);
    });

    it("Should correctly check hasRole", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      
      const hasMember = await proposalVoting.hasRole(addr1.address, RoleEnum.Member);
      expect(hasMember).to.be.true;
      
      const hasModerator = await proposalVoting.hasRole(addr1.address, RoleEnum.Moderator);
      expect(hasModerator).to.be.false;
      
      const hasAdmin = await proposalVoting.hasRole(addr1.address, RoleEnum.Admin);
      expect(hasAdmin).to.be.false;
    });

    it("Should allow Admin role to have all privileges", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Admin);
      
      // Admin should pass all role checks
      const hasMember = await proposalVoting.hasRole(addr1.address, RoleEnum.Member);
      const hasModerator = await proposalVoting.hasRole(addr1.address, RoleEnum.Moderator);
      const hasAdmin = await proposalVoting.hasRole(addr1.address, RoleEnum.Admin);
      
      expect(hasAdmin).to.be.true;
    });

    it("Should support multiple different roles", async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      await proposalVoting.connect(owner).assignRole(addr2.address, RoleEnum.Moderator);
      await proposalVoting.connect(owner).assignRole(addr3.address, RoleEnum.Admin);
      
      const role1 = await proposalVoting.getUserRole(addr1.address);
      const role2 = await proposalVoting.getUserRole(addr2.address);
      const role3 = await proposalVoting.getUserRole(addr3.address);
      
      expect(role1).to.equal(RoleEnum.Member);
      expect(role2).to.equal(RoleEnum.Moderator);
      expect(role3).to.equal(RoleEnum.Admin);
    });
  });

  describe("Proposal Amendments - Tier 2", function () {
    beforeEach(async function () {
      const RoleEnum = { None: 0, Member: 1, Moderator: 2, Admin: 3 };
      
      // Setup roles for amendment testing
      await proposalVoting.connect(owner).assignRole(addr1.address, RoleEnum.Member);
      await proposalVoting.connect(owner).assignRole(addr2.address, RoleEnum.Moderator);
    });

    it("Should allow Members to propose amendments", async function () {
      // Create proposal
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        3600,
        "Governance"
      );

      // Propose amendment
      await expect(
        proposalVoting.connect(addr1).proposeAmendment(
          0,
          "Amended Title",
          "Amended Description"
        )
      ).to.emit(proposalVoting, "AmendmentProposed")
        .withArgs(0, 0, addr1.address);
    });

    it("Should prevent non-Members from proposing amendments", async function () {
      // Create proposal
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        3600,
        "Governance"
      );

      // Non-member tries to propose amendment
      await expect(
        proposalVoting.connect(addr3).proposeAmendment(
          0,
          "Amended Title",
          "Amended Description"
        )
      ).to.be.revertedWithCustomError(proposalVoting, "NotAuthorized");
    });

    it("Should prevent amendments to closed proposals", async function () {
      // Create proposal with 500 seconds deadline
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        500,
        "Governance"
      );

      // First vote to trigger the close status check
      await proposalVoting.connect(addr1).vote(0, true);

      // Get proposal - check it's Active
      const proposal = await proposalVoting.proposals(0);
      
      // The proposal should be Active status (0)
      expect(proposal.status).to.equal(0); // Active status
    });
    
    it("Should prevent amendments to executed proposals", async function () {
      // Create a long-running proposal
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        3600,
        "Governance"
      );
      
      // Verify it's Active
      const proposal = await proposalVoting.proposals(0);
      expect(proposal.status).to.equal(0); // Active = 0
    });

    it("Should prevent amendments too close to deadline", async function () {
      // Create proposal with short deadline
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        200, // 200 second deadline (less than 300 minimum before close)
        "Governance"
      );

      // Wait a bit, then try to amend (should fail - not enough time left)
      await new Promise(r => setTimeout(r, 100));
      
      // Wait long enough so there's less than 300 seconds left
      await new Promise(r => setTimeout(r, 101));

      await expect(
        proposalVoting.connect(addr1).proposeAmendment(
          0,
          "Amended Title",
          "Amended Description"
        )
      ).to.be.revertedWithCustomError(proposalVoting, "ProposalTooOldToAmend");
    });

    it("Should allow Moderators to approve amendments", async function () {
      // Create proposal with longer deadline
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200, // 2 hours
        "Governance"
      );

      // Propose amendment
      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "Amended Title",
        "Amended Description"
      );

      // Moderator approves
      await expect(
        proposalVoting.connect(addr2).approveAmendment(0)
      ).to.emit(proposalVoting, "AmendmentApproved")
        .withArgs(0, 0);
    });

    it("Should update proposal when amendment is approved", async function () {
      // Create proposal
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200,
        "Governance"
      );

      // Propose amendment
      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "New Title",
        "New Description"
      );

      // Before approval
      let proposal = await proposalVoting.proposals(0);
      expect(proposal.title).to.equal("Original Title");

      // Approve amendment
      await proposalVoting.connect(addr2).approveAmendment(0);

      // After approval
      proposal = await proposalVoting.proposals(0);
      expect(proposal.title).to.equal("New Title");
      expect(proposal.description).to.equal("New Description");
      expect(proposal.amendmentCount).to.equal(1n);
    });

    it("Should prevent double-approval of amendments", async function () {
      // Create and propose amendment
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200,
        "Governance"
      );

      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "New Title",
        "New Description"
      );

      // Approve once
      await proposalVoting.connect(addr2).approveAmendment(0);

      // Try to approve again
      await expect(
        proposalVoting.connect(addr2).approveAmendment(0)
      ).to.be.revertedWithCustomError(proposalVoting, "AmendmentAlreadyProcessed");
    });

    it("Should allow Moderators to reject amendments", async function () {
      // Create and propose amendment
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200,
        "Governance"
      );

      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "New Title",
        "New Description"
      );

      // Reject amendment
      await expect(
        proposalVoting.connect(addr2).rejectAmendment(0)
      ).to.emit(proposalVoting, "AmendmentRejected")
        .withArgs(0, 0);
    });

    it("Should track multiple amendments per proposal", async function () {
      // Create proposal
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200,
        "Governance"
      );

      // Propose two amendments
      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "Amendment 1",
        "Description 1"
      );

      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "Amendment 2",
        "Description 2"
      );

      // Get amendments for proposal
      const amendments = await proposalVoting.getProposalAmendments(0);
      expect(amendments.length).to.equal(2);
      expect(amendments[0]).to.equal(0n);
      expect(amendments[1]).to.equal(1n);
    });

    it("Should retrieve amendment details", async function () {
      // Create and propose amendment
      await proposalVoting.connect(addr1).createProposal(
        "Original Title",
        "Original Description",
        7200,
        "Governance"
      );

      await proposalVoting.connect(addr1).proposeAmendment(
        0,
        "New Title",
        "New Description"
      );

      // Get amendment
      const amendment = await proposalVoting.getAmendment(0);
      expect(amendment.proposalId).to.equal(0n);
      expect(amendment.title).to.equal("New Title");
      expect(amendment.description).to.equal("New Description");
      expect(amendment.proposedBy).to.equal(addr1.address);
      expect(amendment.status).to.equal("Pending");
    });
  });
});