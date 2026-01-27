# Frontend Integration Guide - Tier 1 Features

This guide covers integrating the new Tier 1 smart contract features into the React frontend.

## 📋 Table of Contents

1. [Token Voting Integration](#token-voting-integration)
2. [Multi-Sig Approval UI](#multi-sig-approval-ui)
3. [Proposal Filtering & Search](#proposal-filtering--search)
4. [Voter Analytics Dashboard](#voter-analytics-dashboard)
5. [Updated ABIs](#updated-abis)

---

## Token Voting Integration

### 1. Update Web3Provider to Include Token Contract

**File: `frontend/src/context/Web3Provider.jsx`**

Add token contract instance to context:

```javascript
// Add to state
const [tokenContract, setTokenContract] = useState(null);

// In connectWallet function, after proposalVoting is initialized:
const governanceTokenAddress = contractConfig.tokenAddress;
const tokenAbi = [
  "function balanceOf(address owner) public view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transfer(address to, uint256 amount) public returns (bool)",
];

const tokenInstance = new ethers.Contract(
  governanceTokenAddress,
  tokenAbi,
  signer
);

setTokenContract(tokenInstance);

// Add tokenContract to context value
value={{
  // ... existing values
  tokenContract,
}}
```

### 2. Create Token Balance Hook

**File: `frontend/src/hooks/useTokenBalance.js`**

```javascript
import { useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Provider";

export function useTokenBalance() {
  const { account, tokenContract } = useContext(Web3Context);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !tokenContract) {
      setLoading(false);
      return;
    }

    const getBalance = async () => {
      try {
        const balanceWei = await tokenContract.balanceOf(account);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setBalance("0");
      } finally {
        setLoading(false);
      }
    };

    getBalance();
  }, [account, tokenContract]);

  return { balance, loading };
}
```

### 3. Update VoteBox Component

**File: `frontend/src/components/VoteBox.jsx`**

```javascript
import { useTokenBalance } from "../hooks/useTokenBalance";

function VoteBox({ proposal, proposalId }) {
  const { account, contract } = useContext(Web3Context);
  const { balance } = useTokenBalance();
  const [loading, setLoading] = useState(false);

  const canVote = 
    account && 
    proposal.isVotingOpen && 
    !proposal.userVoted && 
    parseFloat(balance) > 0;

  const handleVote = async (support) => {
    if (!canVote) return;
    if (parseFloat(balance) === 0) {
      alert("You need at least 1 token to vote");
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      
      // Refresh proposal data
      const updated = await contract.getProposal(proposalId);
      // Update state...
    } catch (error) {
      console.error("Voting error:", error);
      alert("Vote failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      {/* Show user's voting power */}
      <p className="text-sm text-gray-600 mb-3">
        💰 Your voting power: <strong>{parseFloat(balance).toFixed(2)} votes</strong>
      </p>

      {!account ? (
        <p className="text-sm text-gray-500">Connect wallet to vote</p>
      ) : !proposal.isVotingOpen ? (
        <p className="text-sm text-red-600">🔴 Voting has ended</p>
      ) : parseFloat(balance) === 0 ? (
        <p className="text-sm text-red-600">❌ Need at least 1 token to vote</p>
      ) : proposal.userVoted ? (
        <p className="text-sm text-blue-600">✅ You have voted</p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={loading}
            className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "⏳ Voting..." : "👍 Vote Yes"}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "⏳ Voting..." : "👎 Vote No"}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. Update ProposalList to Show Token Weights

**File: `frontend/src/components/ProposalList.jsx`**

```javascript
function ProposalList({ proposals }) {
  return (
    <div className="space-y-4">
      {proposals.map((proposal, index) => {
        const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
        const yesPercentage = totalVotes > 0 
          ? ((Number(proposal.yesVotes) / totalVotes) * 100).toFixed(1) 
          : 0;

        return (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="font-bold">{proposal.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>

            {/* Token-weighted votes */}
            <div className="mb-3">
              <p className="text-sm font-semibold">💰 Token-Weighted Votes:</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
                <span className="text-sm">
                  <strong>{proposal.yesVotes}</strong> Yes
                </span>
                <span className="text-sm">
                  <strong>{proposal.noVotes}</strong> No
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Yes: {yesPercentage}% ({Number(proposal.yesVotes)} tokens) | 
                No: {(100 - yesPercentage).toFixed(1)}% ({Number(proposal.noVotes)} tokens)
              </p>
            </div>

            {/* Rest of component... */}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Multi-Sig Approval UI

### 1. Create ApprovalBox Component

**File: `frontend/src/components/ApprovalBox.jsx`**

```javascript
import { useState, useContext } from "react";
import { Web3Context } from "../context/Web3Provider";

function ApprovalBox({ proposal, proposalId, userAddress }) {
  const { contract } = useContext(Web3Context);
  const [approving, setApproving] = useState(false);

  const isApprover = proposal.approvers?.includes(userAddress);
  const isReadyForApproval = proposal.status === "Closed";

  const handleApprove = async () => {
    if (!isApprover || !isReadyForApproval) return;

    setApproving(true);
    try {
      const tx = await contract.approveExecution(proposalId);
      await tx.wait();
      alert("✅ Approval recorded!");
      // Refresh...
    } catch (error) {
      console.error("Approval error:", error);
      alert("Approval failed: " + error.message);
    } finally {
      setApproving(false);
    }
  };

  if (!isApprover || !isReadyForApproval) {
    return null; // Hide for non-approvers
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
      <p className="text-sm font-semibold mb-3">🔐 Multi-Sig Approval Required</p>
      <p className="text-sm text-gray-700 mb-3">
        Approvals: <strong>{proposal.approvalsGiven}/{proposal.requiredApprovals}</strong>
      </p>
      <button
        onClick={handleApprove}
        disabled={approving}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {approving ? "⏳ Approving..." : "✅ Approve Execution"}
      </button>
    </div>
  );
}

export default ApprovalBox;
```

### 2. Update CreateProposal Component

**File: `frontend/src/components/CreateProposal.jsx`**

Add category selector:

```javascript
// In form
<div>
  <label className="block text-sm font-semibold mb-2">Category</label>
  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">Select category...</option>
    <option value="Treasury">💰 Treasury</option>
    <option value="Governance">🏛️ Governance</option>
    <option value="Operations">⚙️ Operations</option>
    <option value="Other">📌 Other</option>
  </select>
</div>

// Update createProposal call
const tx = await contract.createProposal(
  title,
  description,
  BigInt(duration),
  category  // NEW
);
```

---

## Proposal Filtering & Search

### 1. Create Filter Component

**File: `frontend/src/components/ProposalFilter.jsx`**

```javascript
import { useState } from "react";

function ProposalFilter({ onFilterChange }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const handleChange = () => {
    onFilterChange({ search, category, status });
  };

  return (
    <div className="p-4 bg-white rounded-lg border mb-4">
      <h3 className="font-bold mb-3">🔍 Filter Proposals</h3>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleChange();
          }}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-3">
        <label className="text-sm font-semibold">Category:</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            handleChange();
          }}
          className="w-full border rounded px-3 py-2 mt-1"
        >
          <option value="All">All Categories</option>
          <option value="Treasury">💰 Treasury</option>
          <option value="Governance">🏛️ Governance</option>
          <option value="Operations">⚙️ Operations</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="mb-3">
        <label className="text-sm font-semibold">Status:</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            handleChange();
          }}
          className="w-full border rounded px-3 py-2 mt-1"
        >
          <option value="All">All Statuses</option>
          <option value="Active">🟢 Active</option>
          <option value="Closed">🔵 Closed</option>
          <option value="Executed">✅ Executed</option>
          <option value="Rejected">❌ Rejected</option>
        </select>
      </div>
    </div>
  );
}

export default ProposalFilter;
```

### 2. Update ProposalList with Filtering

**File: `frontend/src/pages/VotePage.jsx`**

```javascript
import { useState, useEffect, useContext } from "react";
import ProposalFilter from "../components/ProposalFilter";
import { Web3Context } from "../context/Web3Provider";

function VotePage() {
  const { contract } = useContext(Web3Context);
  const [proposals, setProposals] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    status: "All",
  });

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch = p.title
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === "All" || p.category === filters.category;
    const matchesStatus =
      filters.status === "All" || p.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <ProposalFilter onFilterChange={setFilters} />
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredProposals.length} of {proposals.length} proposals
      </p>
      {/* Render filteredProposals instead of all proposals */}
    </div>
  );
}
```

---

## Voter Analytics Dashboard

### 1. Create Analytics Page

**File: `frontend/src/pages/Analytics.jsx`**

```javascript
import { useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Provider";

function Analytics() {
  const { account, contract } = useContext(Web3Context);
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    executedProposals: 0,
    userVotes: 0,
    participationRate: "0%",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const proposals = await contract.getProposals();
        const totalCount = proposals.titles.length;
        const activeCount = proposals.statuses.filter(
          (s) => s === "Active"
        ).length;
        const executedCount = proposals.statuses.filter(
          (s) => s === "Executed"
        ).length;

        let userVoteCount = 0;
        for (let i = 0; i < totalCount; i++) {
          const hasVoted = await contract.hasVoted(i, account);
          if (hasVoted) userVoteCount++;
        }

        setStats({
          totalProposals: totalCount,
          activeProposals: activeCount,
          executedProposals: executedCount,
          userVotes: userVoteCount,
          participationRate: totalCount > 0 
            ? ((userVoteCount / totalCount) * 100).toFixed(1) 
            : "0",
        });
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (account && contract) loadAnalytics();
  }, [account, contract]);

  if (loading)
    return <div className="text-center p-8">Loading analytics...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">📊 Voter Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="📝"
          label="Total Proposals"
          value={stats.totalProposals}
        />
        <StatCard
          icon="🟢"
          label="Active"
          value={stats.activeProposals}
        />
        <StatCard
          icon="✅"
          label="Executed"
          value={stats.executedProposals}
        />
        <StatCard
          icon="🗳️"
          label="You Voted"
          value={stats.userVotes}
        />
      </div>

      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-bold mb-2">👤 Your Participation</h3>
        <p className="text-lg">
          <strong>{stats.participationRate}%</strong> of proposals
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${stats.participationRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-4 bg-white rounded-lg border text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default Analytics;
```

### 2. Add Analytics Link to Navigation

**File: `frontend/src/App.jsx`**

```javascript
// Add to routing
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... existing routes ... */}
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
      {/* Navigation links */}
      <nav>
        <a href="/">Home</a>
        <a href="/vote">Vote</a>
        <a href="/analytics">Analytics</a>
      </nav>
    </BrowserRouter>
  );
}
```

---

## Updated ABIs

### 1. Update GovernanceToken ABI

**File: `frontend/src/abi/GovernanceToken.json`**

```json
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### 2. Update ProposalVoting ABI

Key changes to track:
- `vote()` now emits `(proposalId, voter, support, tokenWeight)`
- `getProposal()` returns `status` as string instead of boolean
- `createProposal()` requires `category` parameter
- New functions: `getProposalsByCategory()`, `getProposalsByStatus()`, `requestExecution()`, `approveExecution()`, `getVoterStats()`, `getMultiSigDetails()`

---

## Testing Integration

### Test Tier 1 Features Locally

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Start frontend
cd frontend && npm run dev

# Terminal 4: Run tests
npm test
```

### Manual Testing Checklist

- [ ] User can see token balance
- [ ] User with 0 tokens cannot vote
- [ ] User with tokens can vote and vote weight is correct
- [ ] Proposals can be filtered by category
- [ ] Proposals can be filtered by status
- [ ] Multi-sig approvers see approval button
- [ ] Approval counter increases correctly
- [ ] Analytics page shows correct stats
- [ ] Participation rate calculates correctly

---

## Troubleshooting

### Issue: "No token balance showing"
**Solution**: Ensure contract config has `tokenAddress` and token instance is initialized in Web3Provider

### Issue: "Can't vote - says zero balance"
**Solution**: Make sure tokens were minted to user address via deployment script

### Issue: "Multi-sig buttons not showing"
**Solution**: Check user address against approvers array from `getMultiSigDetails()`

### Issue: "Filtering not working"
**Solution**: Ensure proposals have category set when created

---

## Next Steps

1. ✅ Deploy Tier 1 contracts
2. 🔄 Integrate token voting UI
3. 🔄 Add multi-sig approval interface
4. 🔄 Implement filtering system
5. 🔄 Build analytics dashboard
6. 🔄 Test end-to-end
7. 🔄 Deploy to testnet

---

For more details, see [TIER1_IMPLEMENTATION.md](./TIER1_IMPLEMENTATION.md)
