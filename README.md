# MAGA Orbit Market
A full-stack NFT marketplace dApp for minting, listing, buying, and bidding on NFTs. Built with React (Vite), Express, Hardhat, and OpenZeppelin on Ethereum Sepolia.

**License:** MIT  
**Network:** Sepolia  
**Frontend:** Netlify  
**Backend:** Render

## Live Links
- **Frontend (Netlify):** [https://maga-nft-marketplace.netlify.app/](https://maga-nft-marketplace.netlify.app/)
- **Backend (Render):** [https://maga-nft-marketplace.onrender.com](https://maga-nft-marketplace.onrender.com)

## Screenshot
![Maga NFT Marketplace Screenshot](https://via.placeholder.com/800x450?text=Maga+NFT+Marketplace+Screenshot)

## Smart Contract
- **Network:** Sepolia (11155111)
- **Address:** `0x3eCc0a9De856Fc9169668a3e581A4C513F61C369`

## Features
- Wallet connection (MetaMask)
- Mint NFT with image + metadata upload to IPFS (Pinata)
- NFT gallery with search and ownership filtering
- List / cancel / buy fixed-price listings
- Place / cancel / accept top offers (bid flow)
- Responsive UI with dark/light theme and animated glacier-style design

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Ethers.js
- **Backend:** Express, Multer, Axios, CORS
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin
- **Storage:** IPFS via Pinata
- **Hosting:** Netlify (frontend), Render (backend)

## Repository Structure
```
.
├── frontend/         # React dApp
├── backend/          # API for uploads + IPFS pinning
├── smart-contracts/  # Solidity contracts + tests + deploy scripts
└── README.md
```

## Architecture Overview
This project uses a simple 3-layer dApp architecture:
1. **Frontend (frontend/):** React + Ethers.js UI for wallet connection, minting, listings, purchases, and offers.
2. **Backend (backend/):** Express API that accepts uploads and pins NFT media/metadata to IPFS through Pinata.
3. **Smart contract (smart-contracts/contracts/MagaMarketplace.sol):** On-chain ERC-721 marketplace logic for ownership, listing state, and offer escrow.

**Flow:**
1. User uploads NFT data in the frontend.
2. Backend pins files/metadata to IPFS and returns a metadata URI.
3. Frontend calls `mint(tokenURI)` on MagaMarketplace.
4. Marketplace actions (list, buy, placeOffer, cancelOffer, acceptOffer) are executed fully on-chain.

## Smart Contract Features
MagaMarketplace combines NFT minting and marketplace features in one ERC-721 contract:
- ERC-721 + metadata storage using OpenZeppelin `ERC721URIStorage`.
- Incremental minting with `mint(string tokenURI)` and `totalSupply()` tracking via `_nextTokenId`.
- Fixed-price listings using `list(tokenId, price)`, `cancel(tokenId)`, and `buy(tokenId)`.
- Listing seller snapshot via `listingSellers[tokenId]` to prevent paying outdated owners.
- Offer/bid system with escrowed ETH via `placeOffer(tokenId)`, `cancelOffer(tokenId)`, and `acceptOffer(tokenId)`.
- Event emission for all trading actions: `Listed`, `ListingCancelled`, `Bought`, `OfferPlaced`, `OfferCancelled`, `OfferAccepted`.

## Security Patterns Used
The contract applies multiple defensive patterns:
- **Reentrancy protection:** `buy`, `placeOffer`, `cancelOffer`, and `acceptOffer` are guarded with `nonReentrant`.
- **Checks-Effects-Interactions ordering:** state is updated/deleted before external ETH transfers.
- **Strict authorization checks:** owner-only listing/cancel/accept paths (`ownerOf(tokenId) == msg.sender`).
- **Stale listing prevention:** `buy` verifies `ownerOf(tokenId) == listingSellers[tokenId]` before transfer/payment.
- **Escrowed highest-offer model:** only the top offer is stored; previous bidder is refunded before replacement.
- **Safe NFT transfer semantics:** uses `_safeTransfer` to reduce token loss risk with receiver contracts.

## Local Development
1. **Clone**
   ```bash
   git clone https://github.com/Maga-khiva/maga-nft-marketplace
   cd maga-nft-marketplace
   ```
2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../smart-contracts && npm install
   ```
3. **Create env files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp smart-contracts/.env.example smart-contracts/.env
   ```
4. **Configure env values**
   - **backend/.env:** `PINATA_API_KEY`, `PINATA_API_SECRET`, `CORS_ALLOWED_ORIGINS`
   - **frontend/.env:** `VITE_CONTRACT_ADDRESS`, `VITE_API_BASE_URL`, `VITE_REQUIRED_CHAIN_ID`
   - **smart-contracts/.env:** `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`
5. **Run locally (Hardhat node)**
   - Terminal A: `cd smart-contracts && npx hardhat node`
   - Terminal B: `cd smart-contracts && npm run deploy:localhost && npm run export:abi`
   - Terminal C: `cd backend && npm start`
   - Terminal D: `cd frontend && npm run dev`

## NPM Scripts
- **Frontend:** `npm run dev`, `npm run build`, `npm run preview`
- **Backend:** `npm start`, `npm run dev`
- **Smart Contracts:** `npm test`, `npm run deploy:localhost`, `npm run deploy:sepolia`, `npm run export:abi`

## Troubleshooting
- **invalid ENS name:** Your env var value is wrong. Set value to only `0x....`
- **Mint stuck on “Processing…”:** Check `VITE_API_BASE_URL` and backend CORS settings.
- **Local minted NFTs not visible on Netlify:** Local Hardhat chain data is separate from Sepolia.

## License
MIT

Built by Maga-khiva.