# 🚀 DAO Voting DApp - Quick Start (2 Minutes)

## Installation (1 minute)

```bash
# Install all dependencies
npm install && cd frontend && npm install && cd ..
```

## Testing (30 seconds)

```bash
# Compile and test (should show 16 passing)
npm run compile && npm run test
```

## Launch (30 seconds)

**Terminal 1 - Start blockchain:**
```bash
npx hardhat node
```

**Terminal 2 - Deploy contract:**
```bash
npm run deploy -- --network localhost
```

**Terminal 3 - Start frontend:**
```bash
cd frontend && npm run dev
```

**Result**: App opens at http://localhost:3000 ✅

---

## 🎯 In the App

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Select account in MetaMask
   - Approve

2. **Create Proposal**
   - Click "+ Create Proposal"
   - Enter title and description
   - Submit

3. **Vote**
   - Click "View & Vote"
   - Click "Vote Yes" or "Vote No"
   - Confirm in MetaMask

4. **Results**
   - See vote counts
   - See status (Passing/Failing)
   - Try voting again (should fail - vote deduplication works!)

---

## 📊 What's Built

✅ **Smart Contract** - ProposalVoting.sol (Solidity ^0.8.20)
✅ **16 Tests** - All passing
✅ **3 Pages** - Home, Create, Vote
✅ **3 Components** - CreateProposal, ProposalList, VoteBox
✅ **MetaMask** - Full integration
✅ **Tailwind CSS** - Beautiful UI
✅ **Fully Documented** - Ready for production

---

## 📁 Key Files

- **Smart Contract**: `contracts/Counter.sol` (ProposalVoting)
- **Tests**: `test/Counter.test.ts` (16 passing ✅)
- **Frontend**: `frontend/src/pages/Home.jsx`
- **Docs**: `README.md`, `SETUP_DAO.md`, `CHECKLIST.md`

---

## ⚡ Common Issues

| Issue | Solution |
|-------|----------|
| MetaMask not found | Install from metamask.io |
| Wrong network | Select "Localhost 8545" in MetaMask |
| Port 8545 in use | Kill other processes on that port |
| Contract not found | Re-run: `npm run deploy -- --network localhost` |
| Tests fail | Make sure dependencies installed: `npm install` |

---

## 💡 Features

- Create proposals (owner only)
- Vote yes/no (anyone)
- See vote results in real-time
- Vote deduplication (one vote per person)
- 7-day voting window (automatic)
- Execute if yes > no votes

---

**That's it! You're ready. 🎉**

See SETUP_DAO.md for more detailed guide or README.md for complete documentation.
