# 🎯 Deployment Checklist & Quick Reference

## ✅ Pre-Deployment Checklist

### Smart Contract
- [ ] All tests passing (58/58)
  ```bash
  npm run test
  ```
- [ ] Code compiles without errors
  ```bash
  npm run compile
  ```
- [ ] No hardcoded addresses or private keys
- [ ] Comments explain complex logic
- [ ] Error handling in place

### Frontend
- [ ] React components working
- [ ] No console errors
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] MetaMask connection working
- [ ] All Tier 1 features functional
- [ ] All Tier 2 features integrated
- [ ] Error messages user-friendly

### Environment Setup
- [ ] `.env` file created with:
  - [ ] `SEPOLIA_RPC_URL` (from Infura)
  - [ ] `SEPOLIA_PRIVATE_KEY` (from MetaMask)
  - [ ] `ETHERSCAN_API_KEY` (optional)
- [ ] `.env` file in `.gitignore`
- [ ] `.env.example` committed with placeholders
- [ ] No secrets in code comments

### Security
- [ ] Private key never exposed in code
- [ ] No API keys in GitHub repository
- [ ] Environment variables documented
- [ ] Access control properly implemented
- [ ] Input validation in place

## 🚀 Deployment Steps (Quick)

### 1. Verify Everything Works Locally
```bash
npm run test        # All 58 tests pass
npm run compile     # No compilation errors
npm run dev         # Frontend connects to localhost
```

### 2. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
**Save the contract addresses!**

### 3. Update Frontend Config
Edit `frontend/src/config/contract.json`:
```json
{
  "contractAddress": "0x_NEW_SEPOLIA_ADDRESS",
  "tokenAddress": "0x_NEW_TOKEN_ADDRESS",
  "chainId": 11155111
}
```

### 4. Build Frontend
```bash
cd frontend
npm run build
```

### 5. Deploy to Netlify
```bash
# Method A: GitHub integration (recommended)
# - Push to GitHub
# - Connect repo to Netlify
# - Set build command: cd frontend && npm run build
# - Set publish dir: frontend/dist
# - Add env var: VITE_SEPOLIA_RPC_URL

# Method B: CLI
netlify deploy --prod
```

## 📊 Important Links

| Resource | URL |
|----------|-----|
| Infura API | https://infura.io |
| Sepolia Faucet | https://sepoliafaucet.com |
| Sepolia Etherscan | https://sepolia.etherscan.io |
| MetaMask | https://metamask.io |
| Netlify | https://netlify.com |
| GitHub | https://github.com |

## 🔧 Environment Variables Reference

### Root `.env` (for Hardhat)
```env
# Required for Sepolia deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here

# Optional, for contract verification
ETHERSCAN_API_KEY=your_etherscan_key
```

### Frontend `.env.local` (for local testing)
```env
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_LOCAL_RPC_URL=http://localhost:8545
```

### Netlify Environment Variables
Set in Netlify dashboard:
```
VITE_SEPOLIA_RPC_URL = https://sepolia.infura.io/v3/YOUR_KEY
```

## 🌍 Network Configuration

**Sepolia Testnet:**
- Chain ID: `11155111`
- Currency: `SepoliaETH`
- Block time: ~12 seconds
- RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY`
- Explorer: `https://sepolia.etherscan.io`

**Localhost (Hardhat Node):**
- Chain ID: `31337`
- RPC URL: `http://localhost:8545`
- Block time: Instant (or set manually)
- Used for local testing

## 📝 Git Workflow

```bash
# Clone project
git clone https://github.com/yourusername/dao-voting-dapp.git
cd dao-voting-dapp

# Create feature branch
git checkout -b feat/deployment

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "feat: prepare for sepolia deployment"

# Push
git push origin feat/deployment

# Create PR on GitHub, merge after review

# Deploy
git push origin main
# Netlify auto-deploys from main branch
```

## 🧪 Testing Commands

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/Counter.test.ts

# Run tests matching pattern
npx hardhat test --grep "Tier 2"

# Run tests with verbosity
npx hardhat test --verbose

# Run tests on specific network
npx hardhat test --network localhost
```

## 📊 Deployment Addresses Format

When you deploy, save these:

```markdown
# Sepolia Deployment (Date: YYYY-MM-DD)

## Smart Contracts
- ProposalVoting: `0x...`
- GovernanceToken: `0x...`

## Frontend
- Netlify URL: `https://xxx.netlify.app`
- GitHub Repo: `https://github.com/.../repo`

## Verification
- Etherscan: `https://sepolia.etherscan.io/address/0x...`
```

## 🔍 Verification Commands

```bash
# Verify contract on Etherscan
npx hardhat verify --network sepolia 0x_ADDRESS

# Check Sepolia network status
npx hardhat run scripts/deploy.ts --network sepolia --dry-run

# Get network info
npx hardhat run -e "console.log(await ethers.provider.getNetwork())" --network sepolia
```

## 💡 Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| RPC timeout | Check Infura API key, rate limits |
| Insufficient funds | Get testnet ETH from faucet |
| Contract not found | Verify contract address, chain ID |
| MetaMask network mismatch | Switch to Sepolia (11155111) |
| Build fails | Run `npm install` in frontend dir |
| Frontend shows blank | Check browser console for errors |

## 📈 Performance Monitoring

### Check deployment size:
```bash
cd frontend && npm run build && du -sh dist/
```
Target: < 1MB

### Check test coverage:
```bash
npx hardhat test
# Look for "passing" in output
```
Target: 58/58 passing

### Check contract gas:
```bash
npx hardhat test --reporter json > test-results.json
```

## 🔐 Security Checklist

- [ ] No private keys in code
- [ ] No API keys in code
- [ ] `.env` in `.gitignore`
- [ ] Contract verified on Etherscan
- [ ] Input validation in contract
- [ ] Access control in place
- [ ] Error handling robust
- [ ] No console.log of sensitive data

## 📞 Support Resources

- Hardhat docs: https://hardhat.org/docs
- Ethers.js docs: https://docs.ethers.org/
- Sepolia faucets: https://sepoliafaucet.com
- GitHub actions: https://github.com/features/actions
- Netlify docs: https://docs.netlify.com

## ✨ Portfolio Showcase

Once deployed, share:
1. **GitHub README** - Clear explanation and setup
2. **Live demo link** - Working Netlify deployment
3. **Contract verification** - Etherscan source code
4. **Test results** - Show all 58 tests passing
5. **Architecture diagram** - System design

---

**Ready to deploy?** Start with "Deploy to Sepolia" step above! 🚀
