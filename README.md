# Glacier DAO | MAGA Orbit Market Governance
A full-stack decentralized autonomous organization (DAO) dApp for proposal management, token-weighted voting, and multi-sig execution. Built with React (Vite), Hardhat, and OpenZeppelin on Ethereum Sepolia.

**License:** MIT  
**Network:** Sepolia  
**Frontend:** Netlify  

## Live Links
- **Frontend (Netlify):** [https://maga-nft-marketplace.netlify.app/](https://maga-nft-marketplace.netlify.app/)

## Screenshot
![Glacier DAO Screenshot](https://via.placeholder.com/800x450?text=Glacier+DAO+Governance+Screenshot)

## Smart Contracts
- **Network:** Sepolia (11155111)
- **Governance Token:** `0x16233789c90fC085080e7df62C275b2549104CE3`
- **Proposal Voting:** `0x0edb054a3F8D594Ceb46E492E82310E4AD67DB79`

## Features
- **Wallet Connection:** Secure integration with MetaMask.
- **Token-Weighted Voting:** Voting power is proportional to GOV token holdings.
- **Snapshot Mechanism:** Prevents manipulation by locking voting power at the block of proposal creation.
- **Multi-Sig Execution:** Passed proposals require secondary approval from designated signers.
- **Role-Based Access (RBAC):** Tiered permissions for Members, Moderators, and Admins.
- **Vote Delegation:** Users can delegate their voting power to trusted community members.
- **Proposal Amendments:** Members can suggest changes to active proposals for moderator review.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Ethers.js v6
- **Smart Contracts:** Solidity 0.8.20, Hardhat, OpenZeppelin
- **State Management:** React Context API
- **Icons:** Lucide React

## Repository Structure
```
.
├── frontend/         # React dApp (Vite + Tailwind)
├── contracts/        # Solidity Smart Contracts
├── scripts/          # Deployment and maintenance scripts
├── test/             # Hardhat test suite
└── README.md
```

## Architecture Overview
This project uses a decentralized architecture for transparent governance:
1. **Frontend (frontend/):** A responsive React UI that interacts directly with the blockchain via Ethers.js.
2. **Governance Token (contracts/GovernanceToken.sol):** An ERC-20 token used to measure community participation and voting weight.
3. **Voting Logic (contracts/ProposalVoting.sol):** Handles proposal lifecycles, vote counting, delegation, and multi-sig execution logic.

**Flow:**
1. A member initiates a proposal by providing a title, description, and category.
2. The contract captures a "snapshot" of all token balances at that block.
3. Community members cast votes; their weight is determined by their snapshot balance.
4. Once the deadline passes, if the proposal is successful, it enters the multi-sig approval phase.
5. Designated approvers sign off, and the proposal is marked as Executed.

## Smart Contract Features
The `ProposalVoting` contract provides robust governance tools:
- **Snapshot-Based Voting:** Uses `getVoterSnapshotBalance` to ensure fair voting.
- **Delegation System:** `delegateVote` and `revokeDelegation` for liquid democracy.
- **Amendment Workflow:** `proposeAmendment` and `approveAmendment` for collaborative drafting.
- **Filtering:** Efficient on-chain filtering by category and status.
- **Analytics:** `getVoterStats` provides participation data for the frontend.

## Security Patterns Used
- **Reentrancy Protection:** Critical state changes happen before external calls.
- **Snapshot Integrity:** Voting power is immutable once a proposal starts.
- **Multi-Sig Safety:** Prevents single-point-of-failure for protocol changes.
- **Access Control:** Strict role checks for administrative and moderator actions.

## Local Development
1. **Clone**
   ```bash
   git clone https://github.com/Maga-khiva/maga-nft-marketplace
   cd maga-nft-marketplace
   ```
2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```
3. **Configure env values**
   - Create a `.env` file in the root with `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY`.
4. **Run locally**
   - Terminal A: `npx hardhat node`
   - Terminal B: `npm run deploy` (deploys to localhost and updates frontend config)
   - Terminal C: `npm run frontend`

## NPM Scripts
- **Root:** `npm run compile`, `npm run test`, `npm run deploy`, `npm run dev`
- **Frontend:** `npm run dev`, `npm run build`, `npm run preview`

## License
MIT

Built by Maga-khiva.