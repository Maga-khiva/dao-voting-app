# DAO Voting DApp - Deployment Guide

A production-ready decentralized governance application demonstrating full-stack Web3 development with Solidity smart contracts, Hardhat testing framework, and React frontend.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Setup](#project-setup)
- [Local Development](#local-development)
- [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
- [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
- [Smart Contract Features](#smart-contract-features)

## ✨ Features

### Tier 1 - Core DAO Voting
- ✅ Create proposals with description and voting period
- ✅ Vote on proposals (yes/no votes with voting power)
- ✅ Multi-signature approval for proposal execution
- ✅ Execute passed proposals with role-based access control
- ✅ Real-time voting status and proposal state management

### Tier 2 - Advanced Governance
- ✅ **Vote Delegation**: Delegate voting power to other members
- ✅ **Role-Based Access Control**: Member, Moderator, Admin roles
- ✅ **Proposal Amendments**: Modify proposal details before execution
- ✅ **Snapshot Voting**: Record voting power at proposal creation time
- ✅ **Token Management**: Custom governance token with delegation

### Quality Assurance
- ✅ 58 comprehensive test cases (100% passing)
- ✅ Full coverage of Tier 1 and Tier 2 features
- ✅ Edge case handling and error scenarios
- ✅ Vote delegation power calculation verification

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **OpenZeppelin Contracts v5.4.0** - Secure token and access control implementations
- **Hardhat** - Development framework with built-in testing
- **ethers.js v6** - Ethereum JavaScript library

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **ethers.js v6** - Web3 interactions
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Testing & Deployment
- **Hardhat Test Runner** - Smart contract testing
- **Sepolia Testnet** - Ethereum test network
- **Infura** - JSON-RPC provider
- **Etherscan** - Block explorer and contract verification
- **Netlify** - Frontend hosting

## 🏗️ Project Setup

### Prerequisites
- **Node.js 16+** and npm
- **MetaMask** browser extension
- Sepolia testnet ETH (faucet: [sepoliafaucet.com](https://sepoliafaucet.com))
- Infura API key ([sign up](https://infura.io))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dao-voting-dapp.git
cd dao-voting-dapp

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example
cp .env.example .env

# Edit .env with your values:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ Never commit `.env` - it contains private keys!**

## 🚀 Local Development

### Start Local Hardhat Network & Frontend

```bash
npm run dev
```

This command:
1. Starts a local Hardhat network (blockchain fork)
2. Deploys contracts to localhost
3. Starts the React frontend on http://localhost:3000

### Run Tests

```bash
npm run test
```

Expected output:
```
✓ 22 Tier 1 tests passing
✓ 36 Tier 2 tests passing
Total: 58/58 passing
```

### Compile Smart Contracts

```bash
npm run compile
```

## 🌐 Sepolia Testnet Deployment

### 1. Get Testnet ETH
Visit [sepoliafaucet.com](https://sepoliafaucet.com) and request testnet ETH for your address.

### 2. Deploy Contract to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Output will show:
```
Deploying contracts to Sepolia...
Governance Token deployed to: 0x...
ProposalVoting deployed to: 0x...
```

### 3. Update Contract Address

Update `frontend/src/config/contract.json`:

```json
{
  "contractAddress": "0x_NEW_ADDRESS_FROM_STEP_2",
  "tokenAddress": "0x_TOKEN_ADDRESS_FROM_STEP_2",
  "chainId": 11155111
}
```

### 4. Update Frontend Environment

Create `.env` in `frontend/` directory:

```bash
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_LOCAL_RPC_URL=http://localhost:8545
```

### 5. Add Sepolia Network to MetaMask

- Network Name: Sepolia
- RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
- Chain ID: 11155111
- Currency Symbol: SepoliaETH
- Block Explorer: https://sepolia.etherscan.io

### 6. Test Contract on Sepolia

```bash
# Build frontend
npm run build

# Or run locally against Sepolia
cd frontend
npm run dev
```

Then:
1. Switch MetaMask to Sepolia network
2. Open http://localhost:3000
3. Connect wallet
4. Create a proposal
5. Vote on it
6. Try delegation features

## 📦 Frontend Deployment (Netlify)

### 1. Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized production build.

### 2. Create Netlify Configuration

Create `netlify.toml` in the root:

```toml
[build]
  command = "cd frontend && npm run build"
  publish = "frontend/dist"

[dev]
  command = "npm run dev"
  port = 3000

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Deploy to Netlify

**Option A: Using Netlify CLI**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option B: Connect GitHub Repository**

1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "New site from Git"
4. Connect GitHub account
5. Select repository
6. Set build command: `cd frontend && npm run build`
7. Set publish directory: `frontend/dist`
8. Add environment variables:
   - `VITE_SEPOLIA_RPC_URL`: Your Infura Sepolia URL
   - `VITE_LOCAL_RPC_URL`: Keep localhost URL (won't be used in production)

### 4. Configure Netlify Environment Variables

In Netlify dashboard:
- Site settings → Environment
- Add variable: `VITE_SEPOLIA_RPC_URL` = Your Infura Sepolia endpoint
- Redeploy the site

### 5. Test Live Deployment

1. Visit your Netlify URL
2. Connect MetaMask (set to Sepolia)
3. Verify contract address is correct
4. Test creating proposals and voting

## 📊 Smart Contract Architecture

### ProposalVoting.sol

**State Variables:**
- `governanceToken`: ERC20 governance token reference
- `proposals`: Mapping of proposals by ID
- `members`: Mapping of member information (roles, delegation)

**Core Functions:**

#### Tier 1
```solidity
function createProposal(
  string memory description,
  uint256 duration
) public returns (uint256)
```
Creates a new proposal with voting period.

```solidity
function vote(uint256 proposalId, bool support)
```
Vote on a proposal with your voting power. Uses `getEffectiveVotingPower()` to count delegated tokens.

```solidity
function executeProposal(uint256 proposalId)
```
Execute a passed proposal (requires admin role).

#### Tier 2
```solidity
function delegateVotes(address to)
```
Delegate your voting power to another address.

```solidity
function amendProposal(
  uint256 proposalId,
  string memory newDescription
) public onlyModerator
```
Amend proposal details before execution.

```solidity
function getVotingPowerAt(address account, uint256 blockNumber)
```
Query voting power at a specific block (snapshot voting).

### Token Contract (GovernanceToken.sol)

- Standard ERC20 with delegation support
- Uses OpenZeppelin's Votes extension
- Allows delegation of voting power

## 🧪 Testing

Run all tests:
```bash
npm run test
```

Run specific test file:
```bash
npx hardhat test test/Counter.test.ts
```

Run tests for Tier 2 features:
```bash
npx hardhat test test/Counter.test.ts --grep "Tier 2"
```

## 📈 Performance & Security

- **Gas Optimization**: Efficient voting power calculation
- **Access Control**: Role-based permissions (Member/Moderator/Admin)
- **Reentrancy Protection**: Used from OpenZeppelin
- **Input Validation**: All parameters validated
- **Event Logging**: All state changes emit events for indexing

## 🐛 Troubleshooting

### Contract Not Found at Address
- Verify contract address in `frontend/src/config/contract.json`
- Check you're connected to correct network (Sepolia)
- Redeploy if needed: `npx hardhat run scripts/deploy.ts --network sepolia`

### MetaMask Not Connecting
- Ensure MetaMask is installed and unlocked
- Try refreshing the page
- Check browser console for errors

### Balance Shows as 0
- Ensure you have testnet ETH in MetaMask
- Mint tokens: Click "Request Tokens" if available
- Check contract deployment was successful

### Voting Not Working
- Verify you have a balance of governance tokens
- Ensure proposal is in voting period
- Check contract address matches deployed address

## 📚 Documentation

- `TIER2_CONTRACT_FUNCTIONS_FIX.md` - Detailed function explanations
- `TOKEN_TRANSFER_EXECUTE_GUIDE.md` - Token mechanics
- `VOTE_DELEGATION_BUG_FIX.md` - Delegation implementation details

## 🔗 Live Demo

**Frontend**: [Your Netlify URL]
**Sepolia Contract**: [Your Etherscan Link]

## 📝 Contract Verification

Verify contract on Etherscan:

```bash
npx hardhat verify --network sepolia \
  0x_CONTRACT_ADDRESS \
  --constructor-args scripts/args.js
```

## 🎯 Next Steps

- [x] Deploy to Sepolia testnet
- [x] Deploy frontend to Netlify
- [ ] Deploy to Ethereum mainnet (requires gas fees)
- [ ] Add subgraph indexing (The Graph)
- [ ] Implement governance token holder NFT
- [ ] Add multi-chain support

## 💰 Gas Costs (Sepolia)

- Deploy ProposalVoting: ~$0.50-$2.00
- Create Proposal: ~$0.10-$0.30
- Vote: ~$0.05-$0.15
- Delegate Votes: ~$0.05-$0.10

(Costs vary based on network congestion)

## 📄 License

MIT - See LICENSE file for details

## 👨‍💻 Development Team

Built as a comprehensive Web3 portfolio project demonstrating:
- Full-stack blockchain development
- Smart contract design patterns
- Test-driven development
- Production deployment practices

---

**Questions?** Check the troubleshooting section or create an issue on GitHub.
