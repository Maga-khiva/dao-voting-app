# 🧪 Frontend Testing Quick Reference

## Quick Start Testing

### 1. Start the Development Environment
```bash
# Terminal 1: Start Hardhat local blockchain
npm run dev

# Terminal 2: Start React frontend
cd frontend
npm run dev
```

### 2. Connect Wallet
- Open http://localhost:5173
- Click "🔗 Connect Wallet" button
- Approve in MetaMask (assumes local network configured)

---

## 🎯 Feature Testing Guide

### Feature 1: Token Voting Display
**What to test**:
1. ✅ After connecting wallet, should see "💰 Your Voting Power: X.XX votes"
2. ✅ Go to a proposal and click "View Details"
3. ✅ Token balance should display in VoteBox
4. ✅ If balance = 0, voting buttons should be disabled
5. ✅ When voting, should see "Used X tokens for this vote"

**Expected Behavior**:
- Token balance = your account's GovernanceToken balance
- Voting power = exact same number
- If no tokens, red message: "❌ You need at least 1 token to vote"

**Files Involved**:
- VoteBox.jsx (voting display)
- useTokenBalance.js (balance fetching)
- Web3Provider.jsx (token contract)

---

### Feature 2: Proposal Filtering & Search
**What to test**:
1. ✅ Create 3+ proposals with different categories (Treasury, Governance, Operations)
2. ✅ In Home page, type in search box → should filter by title/description
3. ✅ Select category dropdown → should filter by category
4. ✅ Select status dropdown → should filter by status
5. ✅ Combine multiple filters → all should work together
6. ✅ Click "Clear Filters" → should reset all

**Expected Behavior**:
- Search is case-insensitive
- Search matches title OR description
- Category filter shows only matching proposals
- Status filter shows only matching proposals
- Multiple filters = AND operation (all must match)
- Empty results show "No Matching Proposals"

**Files Involved**:
- ProposalFilter.jsx (filter UI)
- Home.jsx (filter state management)
- ProposalList.jsx (filter logic)

---

### Feature 3: Multi-Sig Approvals
**What to test**:
1. ✅ After proposal voting period ends, check if ApprovalBox appears
2. ✅ Should show "Approvals: X/2" (if 2-of-2 multi-sig configured)
3. ✅ If you ARE an approver (in contractConfig.approvers):
   - ApprovalBox should show "Approve" button
   - Click button → should trigger executeApprovals()
   - After approval, page should refresh
4. ✅ If you ARE NOT an approver:
   - ApprovalBox should not appear OR show as disabled

**Expected Behavior**:
- ApprovalBox only shows when voting is closed (deadline passed)
- ApprovalBox only shows if user is in approvers list
- Approval button triggers contract call
- On success, page reloads to show updated status
- On error, shows error message

**Files Involved**:
- ApprovalBox.jsx (approval UI)
- VoteBox.jsx (integration point)
- contractConfig (approvers list)

---

### Feature 4: Category Support
**What to test**:
1. ✅ Create a new proposal
2. ✅ In form, select category dropdown
3. ✅ Options should be: 💰 Treasury, 🏛️ Governance, ⚙️ Operations, 📌 Other
4. ✅ Select one category and submit
5. ✅ Back on home page, filter by that category
6. ✅ New proposal should appear in filtered results

**Expected Behavior**:
- Category dropdown available on create form
- 4 category options with emoji icons
- Category saved to blockchain
- Category filter matches saved category
- All proposals show category in listing

**Files Involved**:
- CreateProposal.jsx (category selection)
- ProposalList.jsx (category display & filtering)
- ProposalVoting.sol (category storage)

---

### Feature 5: Analytics Dashboard
**What to test**:
1. ✅ Click "📊 View Analytics" button on Home page
2. ✅ Should see dashboard with stat cards:
   - Total Proposals: X
   - Active: X
   - Executed: X
   - Rejected: X
   - Participation Rate: X%
3. ✅ Create/execute proposals and refresh → numbers should update
4. ✅ Vote on proposals → participation rate should increase
5. ✅ Verify all 5 Tier 1 features listed at bottom

**Expected Behavior**:
- Stat cards show accurate counts
- Participation rate = (votes you made / total proposals) * 100
- All 5 features listed: Token Voting, Multi-Sig, Filtering, Analytics, Categories
- Dashboard updates on page refresh
- Responsive layout on mobile/tablet

**Files Involved**:
- Analytics.jsx (dashboard page)
- App.jsx (routing)
- Home.jsx (navigation link)

---

## 🔍 Common Issues & Fixes

### Issue: "Balance shows 0 even though I have tokens"
**Cause**: Token contract not initialized in Web3Provider
**Fix**: 
- Check Web3Provider.jsx has token ABI
- Verify tokenAddress in contract.json is correct
- Try reconnecting wallet

### Issue: "Voting disabled even though I have tokens"
**Cause**: useTokenBalance hook not fetching correctly
**Fix**:
- Open browser console (F12)
- Check for errors in Network tab
- Verify token ABI includes balanceOf function

### Issue: "Filter not working"
**Cause**: ProposalList not receiving filters prop
**Fix**:
- Check Home.jsx is passing filters prop
- Check ProposalFilter is calling onFilterChange callback
- Verify filter logic in ProposalList.jsx

### Issue: "ApprovalBox not showing"
**Cause**: Wrong proposal status or user not approver
**Fix**:
- Verify proposal deadline has passed
- Verify your account in contractConfig.approvers
- Check VoteBox is rendering ApprovalBox

### Issue: "Analytics page blank"
**Cause**: App.jsx analytics route not configured
**Fix**:
- Check App.jsx imports Analytics
- Verify analytics case added to renderPage()
- Check Home page has analytics link

---

## 📊 Test Scenarios

### Scenario 1: Complete Voting Cycle
1. Create proposal as owner
2. Other user votes on proposal
3. Wait for deadline
4. Check results on Analytics
5. Approver approves execution
6. Verify proposal executed

### Scenario 2: Token-Gated Voting
1. User with 0 tokens tries to vote → denied
2. Transfer tokens to user
3. User now can vote → success
4. Vote weight = token amount

### Scenario 3: Filtering Workflow
1. Create proposals in multiple categories
2. Filter by category → only those show
3. Search for keyword → only matches show
4. Filter by status → only active/closed show
5. Combine filters → all conditions apply

### Scenario 4: Multi-Sig Execution
1. Create and close proposal with yes votes > no votes
2. Non-approver tries to approve → denied
3. Approver 1 approves → count becomes 1/2
4. Approver 2 approves → count becomes 2/2, proposal executes

---

## ✅ Testing Checklist

### Token Voting
- [ ] User sees token balance on vote page
- [ ] Voting disabled if balance = 0
- [ ] Vote succeeds if balance >= 1
- [ ] Token weight displays after voting

### Filtering
- [ ] Search filter works
- [ ] Category filter works (all 5 options)
- [ ] Status filter works (all 5 options)
- [ ] Multiple filters combine correctly
- [ ] Clear filters button resets all

### Multi-Sig
- [ ] ApprovalBox shows only to approvers
- [ ] ApprovalBox shows only when voting closed
- [ ] Approval counter displays correctly
- [ ] Approve button works

### Analytics
- [ ] Dashboard loads without errors
- [ ] Stat counts are accurate
- [ ] Participation rate calculates correctly
- [ ] All 5 features listed

### Categories
- [ ] Category dropdown in create form
- [ ] Category saved to blockchain
- [ ] Category filter works
- [ ] Category displays in listings

---

## 🚀 Browser Console Tips

### Check if token contract initialized
```javascript
// In browser console
window.ethereum // Should show provider
// After connecting wallet:
const web3Context = // Access from React DevTools
console.log(web3Context.tokenContract)
```

### Verify token balance
```javascript
const balance = await tokenContract.balanceOf(account)
console.log(balance.toString())
```

### Check proposal data
```javascript
const proposals = await contract.getProposals()
console.log(proposals) // Should show categories, statuses
```

---

## 📞 Support

**If tests fail**:
1. Check browser console for errors (F12 → Console)
2. Check terminal output for Hardhat errors
3. Verify contract.json has correct addresses
4. Try restarting both services
5. Check that you're on Hardhat Network in MetaMask

**Test Data Preparation**:
1. Ensure you have tokens via deploy script
2. Ensure you're configured as approver in deploy
3. Create test proposals before testing
4. Wait for deadlines to expire (use timestamp override in tests)

