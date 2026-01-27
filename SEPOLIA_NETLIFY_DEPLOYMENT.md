# 🚀 Sepolia Testnet & Netlify Deployment Setup

Complete step-by-step guide to deploy your DAO Voting DApp to Sepolia testnet and Netlify.

## 📋 Prerequisites

Before starting, you need:
- Node.js 16+ installed
- npm or yarn
- MetaMask browser extension
- GitHub account
- Infura account
- Netlify account (free)

## 🔑 Step 1: Get Infura API Key

1. Go to [infura.io](https://infura.io)
2. Sign up or log in
3. Create a new project
4. Select "Ethereum" from the dropdown
5. Copy your Sepolia endpoint URL (looks like `https://sepolia.infura.io/v3/YOUR_KEY`)
6. Save this for later

## 💰 Step 2: Get Sepolia Testnet ETH

1. Go to [sepoliafaucet.com](https://sepoliafaucet.com)
2. Connect with your Ethereum wallet (MetaMask)
3. Request Sepolia ETH (you'll get 0.05 ETH)
4. Wait a few minutes for confirmation

Alternative faucets:
- [goerlifaucet.com](https://goerlifaucet.com)
- [alchemy.com/faucets/sepolia](https://www.alchemy.com/faucets/sepolia)

## 🔧 Step 3: Setup Environment Variables

1. **In your project root directory**, create a `.env` file:

```bash
cp .env.example .env
```

2. **Edit `.env` with your values:**

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY_HERE
SEPOLIA_PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ IMPORTANT:**
- Never share your `.env` file
- Never commit it to GitHub
- It's in `.gitignore` by default
- To get your private key from MetaMask:
  - Click account → settings → security & privacy → Show Private Key

3. **Get Etherscan API key** (optional, for contract verification):
   - Go to [etherscan.io](https://etherscan.io)
   - Create account
   - Go to API Keys
   - Create new key
   - Copy and paste into .env

## 📦 Step 4: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## 🧪 Step 5: Verify Tests Pass Locally

```bash
npm run test
```

Expected output:
```
  Tier 1 Tests
    ✓ ... (22 tests)
  
  Tier 2 Tests
    ✓ ... (36 tests)

58 passing
```

If all tests pass, continue. If not, debug before deploying.

## 🌐 Step 6: Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**What to expect:**
- This will compile your contracts
- Deploy to Sepolia
- Show deployed addresses:

```
✓ Deploying contracts to Sepolia...
✓ Governance Token deployed to: 0x...
✓ ProposalVoting deployed to: 0x...
✓ Deployment successful!
```

**Save these addresses!** You'll need them next.

## 📝 Step 7: Update Contract Address in Frontend

1. Open `frontend/src/config/contract.json`
2. Update with your new deployment addresses:

```json
{
  "contractAddress": "0x_PROPOSAL_VOTING_ADDRESS",
  "tokenAddress": "0x_GOVERNANCE_TOKEN_ADDRESS",
  "chainId": 11155111
}
```

## 🌍 Step 8: Add Sepolia to MetaMask

If you don't have Sepolia network in MetaMask:

1. Open MetaMask
2. Click network selector (top left)
3. Click "Add network"
4. Fill in:
   - Network name: `Sepolia`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY`
   - Chain ID: `11155111`
   - Currency symbol: `SepoliaETH`
   - Block explorer: `https://sepolia.etherscan.io`
5. Click "Save"
6. Switch to Sepolia network

## 🧪 Step 9: Test Frontend Against Sepolia

### Option A: Local Frontend Testing

1. Create `frontend/.env.local`:

```env
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_LOCAL_RPC_URL=http://localhost:8545
```

2. Start frontend:

```bash
cd frontend
npm run dev
```

3. Open http://localhost:3000
4. Switch MetaMask to Sepolia
5. Click "Connect Wallet"
6. Test features:
   - Create a proposal
   - Vote on it
   - Test delegation

### Option B: Use Hardhat Node (Local Blockchain)

```bash
npm run dev
```

This starts a local blockchain with frontend. Good for testing without spending testnet ETH.

## 📦 Step 10: Build Frontend for Production

```bash
cd frontend
npm run build
```

Creates a `dist/` folder with optimized build (~500KB gzipped).

## 🚀 Step 11: Deploy to Netlify

### Method A: Using GitHub (Recommended)

1. **Push to GitHub:**

```bash
git add .
git commit -m "feat: deploy to sepolia testnet"
git push origin main
```

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Select GitHub
   - Choose your repository
   - Configure build:
     - **Build command**: `cd frontend && npm run build`
     - **Publish directory**: `frontend/dist`
   - Click "Deploy site"

3. **Add environment variables:**
   - In Netlify: Site settings → Environment
   - Add variable: `VITE_SEPOLIA_RPC_URL` = Your Infura Sepolia URL
   - Redeploy the site

4. **Get your live URL:**
   - After deployment: Click the URL (looks like `https://abc123.netlify.app`)
   - This is your live dApp!

### Method B: Using Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## ✅ Step 12: Verify Live Deployment

1. Visit your Netlify URL
2. Click "Connect Wallet"
3. Select MetaMask
4. Switch to Sepolia in MetaMask
5. Approve connection
6. Test features:
   - ✓ Create proposal
   - ✓ Vote on it
   - ✓ Check voting power
   - ✓ Test delegation

## 📊 Verify Contract on Etherscan

Make your contract verified and readable on Etherscan:

```bash
npx hardhat verify --network sepolia \
  0x_YOUR_CONTRACT_ADDRESS
```

Then go to [sepolia.etherscan.io](https://sepolia.etherscan.io) and search for your contract address. You should see:
- Source code
- Read/Write functions
- Transactions

## 🔗 Share Your dApp

Now you can share:
- **Live URL**: Your Netlify link
- **GitHub**: Your GitHub repository
- **Contract**: Your Etherscan contract link

Example format:
```
Check out my DAO Voting DApp:
- Live Demo: https://my-dao-app.netlify.app
- GitHub: https://github.com/username/dao-voting-dapp
- Smart Contract: https://sepolia.etherscan.io/address/0x...
```

## 🐛 Troubleshooting

### "RPC URL error" when deploying
- Check your `SEPOLIA_RPC_URL` in .env
- Verify Infura API key is correct
- Ensure you didn't add extra spaces

### "Insufficient funds" error
- Make sure you have testnet ETH
- Go back to Step 2 and request more from faucet
- Check your MetaMask balance

### Contract not found on Etherscan
- Use the correct Sepolia explorer: [sepolia.etherscan.io](https://sepolia.etherscan.io)
- Copy full contract address (0x...)
- Wait a few minutes for indexing

### Frontend shows "Network error"
- Check `VITE_SEPOLIA_RPC_URL` in Netlify environment variables
- Verify RPC URL is correct
- Check MetaMask is connected to Sepolia
- Look at browser console for detailed errors

### No contract address displayed
- Refresh the page
- Check `frontend/src/config/contract.json` has correct addresses
- Verify contract was actually deployed (check in .env values)

### MetaMask keeps asking to switch networks
- Your frontend might be trying to connect to localhost
- Update your RPC URLs to Sepolia
- Clear MetaMask cache and reconnect

## 📈 Next Steps After Deployment

1. **Verify contract on Etherscan**
   - Makes it look professional
   - Allows people to view code

2. **Update your GitHub README**
   - Add live demo link
   - Add contract address
   - Add screenshot

3. **Share on Twitter/LinkedIn**
   - Show off your deployment
   - Great for networking

4. **Add to your portfolio**
   - Link from personal website
   - Share in job applications
   - GitHub profile highlight

## 💡 Pro Tips

- Keep testnet ETH in wallet for multiple deployments
- Use [tenderly.co](https://tenderly.co) to debug transactions
- Monitor [sepolia faucets status](https://sepolia-faucet.pk910.de/)
- Verify on Etherscan for credibility
- Document your deployment addresses

## 📝 Deployment Checklist

- [ ] Created `.env` file with Sepolia RPC URL and private key
- [ ] All 58 tests passing locally
- [ ] Deployed to Sepolia testnet
- [ ] Updated contract address in frontend config
- [ ] Added Sepolia network to MetaMask
- [ ] Frontend builds without errors
- [ ] Tested frontend against Sepolia contract
- [ ] Deployed frontend to Netlify
- [ ] Added environment variables to Netlify
- [ ] Verified contract on Etherscan
- [ ] Updated GitHub README with live links
- [ ] Tested live deployment in production

## 🎓 Learning Resources

- [Hardhat Docs](https://hardhat.org)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Sepolia Faucets](https://www.alchemy.com/faucets/sepolia)
- [Etherscan Sepolia](https://sepolia.etherscan.io)

---

**Congratulations!** Your DAO dApp is now live on Sepolia testnet and deployed to Netlify! 🎉

Questions? Check the main README.md or GitHub issues.
