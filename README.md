# MAGA DAO | Glacier Governance

A full-stack decentralized autonomous organization (DAO) dApp for proposal management, token-weighted voting, and multi-sig execution. 
Built with React (Vite), Hardhat, and OpenZeppelin on Ethereum Sepolia.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: Sepolia](https://img.shields.io/badge/Network-Sepolia-6f42c1)](https://sepolia.etherscan.io/address/0x0edb054a3F8D594Ceb46E492E82310E4AD67DB79)
[![Frontend: Netlify](https://img.shields.io/badge/Frontend-Netlify-00c7b7)](https://maga-nft-marketplace.netlify.app/)

## Live Links
- Frontend (Netlify):[ https://maga-nft-marketplace.netlify.app/](https://dao-voting-dapp.netlify.app/)

## Screenshot
![MAGA DAO Screenshot](./frontend/screenshot.png)

## Smart Contracts
- Network: **Sepolia (11155111)**
- Governance Token: **`0x16233789c90fC085080e7df62C275b2549104CE3`**
- Proposal Voting: **`0x0edb054a3F8D594Ceb46E492E82310E4AD67DB79`**

## Features
- Wallet connection (MetaMask)
- Token-weighted voting (Voting power proportional to GOV holdings)
- Snapshot mechanism (Locks voting power at the block of proposal creation)
- Multi-sig execution (Passed proposals require secondary approval from designated signers)
- Role-Based Access Control (RBAC) for Members, Moderators, and Admins
- Vote delegation (Liquid Democracy system)
- Proposal amendments with moderator review workflow
- Real-time analytics and protocol health monitoring
- Responsive UI with dark/light theme and animated glacier-style design

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Ethers.js v6, Framer Motion
- Smart Contracts: Solidity 0.8.20, Hardhat, OpenZeppelin
- State Management: React Context API
- Icons: Lucide React
- Hosting: Netlify

## Repository Structure
```text
.
├── frontend/         # React dApp (Vite + Tailwind)
├── contracts/        # Solidity Smart Contracts
├── scripts/          # Deployment and maintenance scripts
├── test/             # Hardhat test suite
└── README.md
```

## Architecture Overview
This project uses a decentralized architecture for transparent governance:
- **Frontend (`frontend/`)**: A responsive React UI that interacts directly with the blockchain via Ethers.js to manage proposals and votes.
- **Governance Token (`contracts/GovernanceToken.sol`)**: An ERC-20 token used to measure community participation and voting weight.
- **Voting Logic (`contracts/ProposalVoting.sol`)**: Handles proposal lifecycles, vote counting, delegation, and multi-sig execution logic.

**Flow:**
1. A member initiates a proposal by providing a title, description, and category.
2. The contract captures a "snapshot" of all token balances at that specific block.
3. Community members cast votes; their weight is determined by their snapshot balance.
4. Once the deadline passes, if the proposal is successful, it enters the multi-sig approval phase.
5. Designated approvers sign off, and the proposal is marked as Executed.

## Smart Contract Features
The `ProposalVoting` contract provides robust governance tools:
- **Snapshot-Based Voting**: Uses `getVoterSnapshotBalance` to ensure fair voting and prevent flash-loan manipulation.
- **Delegation System**: `delegateVote` and `revokeDelegation` allow users to assign power to trusted representatives.
- **Amendment Workflow**: `proposeAmendment` and `approveAmendment` enable collaborative drafting of active proposals.
- **On-chain Filtering**: Efficient filtering of proposals by category (Treasury, Governance, etc.) and status.
- **Voter Analytics**: `getVoterStats` provides participation data for the frontend dashboard.

## Security Patterns Used
The protocol applies multiple defensive patterns:
- **Reentrancy Protection**: Critical state changes happen before external calls to prevent exploit loops.
- **Snapshot Integrity**: Voting power is immutable once a proposal starts, preventing "vote buying" via temporary transfers.
- **Multi-Sig Safety**: Prevents single-point-of-failure for protocol changes by requiring multiple signatures for execution.
- **Access Control**: Strict role checks for administrative and moderator actions using a tiered RBAC system.

## Local Development
### 1) Clone
```bash
git clone https://github.com/Maga-khiva/maga-nft-marketplace
cd maga-nft-marketplace
```

### 2) Install dependencies
```bash
npm install
cd frontend && npm install
```

### 3) Create env files
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 4) Configure env values
`.env`
- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`

### 5) Run locally (Hardhat node)
Terminal A:
```bash
npx hardhat node
```

Terminal B:
```bash
npm run deploy --network localhost
```

Terminal C:
```bash
npm run frontend
```

Open `http://localhost:3000`, connect MetaMask to Hardhat local network, then participate in governance.

## NPM Scripts
### Root
- `npm run compile` - Compile smart contracts
- `npm run test` - Run Hardhat test suite
- `npm run deploy` - Deploy contracts to network
- `npm run dev` - Start local node and frontend concurrently

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License
MIT

Built by Maga-khiva.
