# Frontend Testing Guide - Tier 2 Features

**Purpose**: Step-by-step instructions to test all new Tier 2 frontend components

---

## Prerequisites

✅ Smart contract deployed on localhost  
✅ Frontend development server running  
✅ MetaMask connected to localhost  
✅ Multiple test accounts available  

### Setup

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npm run deploy

# Terminal 3: Start frontend
cd frontend && npm run dev
```

---

## Test 1: Vote Delegation

### Objective
Verify users can delegate voting power and see effective voting power updates.

### Steps

1. **Open Frontend**
   - Navigate to `http://localhost:5173`
   - Click "Connect Wallet"
   - Select first account (Account 1)

2. **Navigate to Tier 2 Features**
   - Click "⭐ Advanced Features (Tier 2)" button
   - Verify page loads with three tabs
   - Click "Vote Delegation" tab

3. **Verify Initial State**
   - Current Delegate: "None"
   - Effective Voting Power: "100 GOV" (first account has 100 tokens)

4. **Delegate Vote**
   - Copy second account address
   - Paste into "Enter delegate address" field
   - Click "Delegate" button
   - Approve transaction in MetaMask
   - Wait for confirmation

5. **Verify Delegation**
   - Current Delegate shows: `0xddbD...` (second account)
   - Effective Voting Power: "0 GOV" (delegated away)
   - Button changed to "Revoke Delegation"

6. **Test Revoke**
   - Click "Revoke Delegation" button
   - Approve transaction in MetaMask
   - Verify Current Delegate: "None"
   - Verify Effective Voting Power: "100 GOV" (restored)

### Expected Results
✅ Delegation succeeds with transaction  
✅ UI updates reflect delegation status  
✅ Effective voting power shows as 0 when delegated  
✅ Revoke restores voting power  

### Common Issues
- **"Invalid delegate address"**: Address format incorrect. Use `0x...` format
- **"Cannot delegate to self"**: Don't delegate to same account
- **Transaction fails**: Ensure wallet has ETH for gas

---

## Test 2: Role Management

### Objective
Verify Admin can assign and revoke roles.

### Steps

1. **Setup: Owner Account**
   - Owner account is automatically Admin
   - Go to Advanced Features → Role Management tab
   - Verify "Your Role: Admin"
   - Verify "You have permission to manage roles"

2. **Assign Member Role**
   - Copy a test account address (Account 3)
   - Paste into "User Address" field
   - Select "Member - Can vote & propose amendments"
   - Click "Assign Role"
   - Approve transaction
   - Wait for confirmation

3. **Verify Assignment**
   - Verify notification: "Role assigned successfully!"
   - User appears in "Managed Users" section
   - Shows "Current: Member"

4. **Change Role**
   - Same user, select "Moderator - Can approve amendments"
   - Click "Assign Role"
   - Approve transaction
   - Verify user's role updated to "Moderator"

5. **Revoke Role**
   - Click "Revoke" button for user
   - Approve transaction
   - Verify role changed to "None"

### Expected Results
✅ Only Admin can access role management  
✅ Roles assign successfully  
✅ Role changes update in UI  
✅ Revoke sets role to "None"  
✅ Managed users list stays current  

### Common Issues
- **"NotAuthorized" error**: Only Admins can assign roles
- **Can't see role management**: Check that account is Admin
- **User not appearing**: Page needs refresh after assignment

---

## Test 3: Proposal Amendments

### Objective
Verify Members can propose amendments and Moderators can approve/reject.

### Steps

1. **Create Test Proposal**
   - Go to Home → "➕ Create Proposal"
   - Fill in title, description
   - Set deadline to 1 hour
   - Create proposal
   - Note the proposal ID (e.g., Proposal 0)

2. **Setup Roles**
   - Switch to Owner account
   - Go to Advanced Features → Role Management
   - Assign Account 2 as "Member"
   - Assign Account 3 as "Moderator"
   - Keep Account 1 as "Admin"

3. **Member Proposes Amendment**
   - Switch to Account 2 (Member)
   - Go to Home → click on test proposal
   - Scroll to "Proposal Amendments" section
   - Fill in:
     - New Title: "Updated Proposal Title"
     - New Description: "Updated description with improvements"
   - Click "Propose Amendment"
   - Approve transaction
   - Wait for confirmation

4. **Verify Amendment Posted**
   - Amendment appears in list
   - Status shows "Pending"
   - Shows "Updated Proposal Title"
   - Shows "Updated description with improvements"
   - Displays proposer address

5. **Moderator Approves Amendment**
   - Switch to Account 3 (Moderator)
   - Go to same proposal page
   - Scroll to "Proposal Amendments"
   - Find pending amendment
   - Click "Approve" button
   - Approve transaction
   - Wait for confirmation

6. **Verify Amendment Approved**
   - Amendment status changed to "Approved" (green)
   - Approve/Reject buttons disappeared
   - Notification shows "Amendment approved!"
   - Proposal details should reflect new title/description

7. **Test Rejection (Optional)**
   - Create another amendment
   - As Moderator, click "Reject"
   - Amendment status changes to "Rejected" (red)
   - Buttons disappear

### Expected Results
✅ Members can propose amendments  
✅ Non-members cannot see form  
✅ Amendments appear in pending list  
✅ Moderators can approve/reject  
✅ Status updates immediately  
✅ Approved amendments update proposal  

### Common Issues
- **"NotAuthorized"**: Account doesn't have Member role
- **Cannot propose**: Proposal might be closed/too near deadline
- **Amendment not appearing**: Refresh page or wait a moment
- **No approve button**: User doesn't have Moderator role

---

## Test 4: Snapshot Display

### Objective
Verify snapshot information displays on vote page.

### Steps

1. **Navigate to Vote Page**
   - Go to Home
   - Click on any proposal
   - Go to VotePage

2. **Verify Snapshot Display**
   - Look for "Snapshot Information" box at top
   - Verify it shows a block number
   - Verify it says "Voting Mechanism: Snapshot-based voting"
   - Check informational text about block locking

3. **Create Multiple Proposals**
   - Create 3 different proposals
   - Each should have different snapshot block
   - Block numbers should increase

4. **Verify Block Numbers**
   - Blocks should be different for each proposal
   - Numbers should increase
   - All should be recent (within last few blocks)

### Expected Results
✅ Snapshot block displays on vote page  
✅ Block number is numeric and reasonable  
✅ Different proposals have different blocks  
✅ Information text is clear and helpful  

### Common Issues
- **Block not showing**: Page might not be loading properly
- **Wrong block number**: Contract might not be setting snapshot
- **Same block for different proposals**: Transactions happening in same block (normal)

---

## Test 5: Information Tab

### Objective
Verify Tier 2 information is displayed correctly.

### Steps

1. **Open Information Tab**
   - Go to Advanced Features page
   - Click "Information" tab

2. **Verify Content**
   - "Snapshot-Based Voting" section shows
   - "Vote Delegation" section shows
   - "Role-Based Access Control" section shows
   - "Proposal Amendments" section shows
   - Security & Fairness section at bottom

3. **Check Details**
   - Each section has description
   - Bullet points explain features
   - Code examples or role descriptions match contract

### Expected Results
✅ All Tier 2 features documented  
✅ Information is accurate  
✅ Format is clear and readable  
✅ All sections visible and accessible  

---

## Test 6: Full User Journey

### Objective
Complete realistic Tier 2 workflow.

### Scenario
- Owner creates DAO
- Admin assigns roles
- Member delegates vote
- Member proposes amendment
- Moderator approves
- All users view final state

### Steps

1. **Owner Setup** (Account 1)
   - Deploy contract (already done)
   - Owner is automatically Admin

2. **Assign Roles** (Owner)
   - Go to Role Management
   - Assign Account 2 as Member
   - Assign Account 3 as Moderator

3. **Member Delegates** (Account 2)
   - Go to Vote Delegation
   - Delegate to Account 4
   - Verify effective power is 0

4. **Create Proposal** (Any account)
   - Go to Create Proposal
   - Create test proposal
   - Voting period: 1 hour

5. **Propose Amendment** (Account 2 - Member)
   - Go to proposal vote page
   - Scroll to amendments
   - Propose amendment with new title/description

6. **Approve Amendment** (Account 3 - Moderator)
   - Go to same proposal
   - Approve the amendment
   - Verify status changed

7. **Verify Final State** (Any account)
   - View proposal - should show updated title
   - View amendments - should show Approved status
   - Check voting power calculations

### Expected Results
✅ Complete workflow succeeds  
✅ All components work together  
✅ No errors occur  
✅ Final state is correct  

---

## Test 7: Error Handling

### Objective
Verify error messages appear and are helpful.

### Steps

1. **Invalid Address Error**
   - Go to Vote Delegation
   - Enter invalid address (e.g., "abc123")
   - Click Delegate
   - Verify error: "Invalid delegate address"

2. **Insufficient Permissions Error**
   - Non-Member account
   - Go to proposal amendment
   - Verify form doesn't appear
   - Verify message: "You need to be a Member..."

3. **Duplicate Action Error**
   - Moderator approves amendment
   - Try to approve same amendment again
   - Verify error: "Amendment already processed"

4. **Self-Delegation Error**
   - Try to delegate to same account
   - Verify error: "Cannot delegate to self"

### Expected Results
✅ Error messages are clear  
✅ Errors prevent invalid actions  
✅ User knows how to fix  

---

## Test 8: Responsive Design

### Objective
Verify frontend works on different screen sizes.

### Steps

1. **Desktop** (1920x1080)
   - All components display properly
   - No text overflow
   - Buttons are clickable

2. **Tablet** (768x1024)
   - Layout adjusts for tablet
   - All elements visible
   - Touch-friendly buttons

3. **Mobile** (375x667)
   - Stack layout works
   - No horizontal scroll
   - Touch buttons are large enough

### Expected Results
✅ Responsive on all sizes  
✅ No overflow or cutoff text  
✅ Touch targets are adequate  

---

## Test 9: Performance

### Objective
Verify frontend performs well.

### Steps

1. **Load Time**
   - Measure page load time
   - Should be <2 seconds

2. **Interaction Time**
   - Time to approve amendment
   - Should be <5 seconds for confirmation

3. **Real-Time Updates**
   - Delegation status updates immediately
   - Amendment list updates within 5 seconds
   - No significant lag

### Expected Results
✅ Fast load times  
✅ Quick transactions  
✅ Real-time UI updates  

---

## Test 10: Edge Cases

### Objective
Test unusual but valid scenarios.

### Steps

1. **Multiple Delegations**
   - Account A delegates to B
   - Account B delegates to C
   - Verify voting power accumulates correctly
   - Note: Current implementation doesn't support delegation chains

2. **Rapid Role Changes**
   - Assign member role
   - Immediately change to moderator
   - Verify final state is correct

3. **Amendment to Closing Proposal**
   - Proposal has <5 minutes left
   - Try to propose amendment
   - Verify error

4. **Zero Balance Account**
   - Account with no tokens
   - Try to participate in voting
   - Verify appropriate message

### Expected Results
✅ Edge cases handled gracefully  
✅ Appropriate error messages  
✅ No crashes or hangs  

---

## Checklist

- [ ] Vote delegation works
- [ ] Roles can be assigned
- [ ] Amendments can be proposed
- [ ] Amendments can be approved
- [ ] Snapshot info displays
- [ ] Information tab complete
- [ ] Full journey works
- [ ] Error messages appear
- [ ] Responsive on all sizes
- [ ] Performance is good
- [ ] Edge cases handled

---

## Debugging

### Check Console
```javascript
// Open browser console (F12)
// Look for any JavaScript errors
// Check Network tab for failed requests
```

### Check MetaMask
- Ensure network is correct
- Ensure account has ETH for gas
- Check transaction history

### Check Contract
```bash
# Verify contract is deployed
npx hardhat run scripts/deploy.ts --network localhost

# Run tests to verify functions work
npm test
```

---

## Report Issues

If you find issues:
1. Note the exact steps to reproduce
2. Include error messages
3. Check browser console for errors
4. Try in incognito mode
5. Clear cache and refresh

---

## Next Steps

After testing:
1. Deploy to testnet
2. Run on live network
3. User acceptance testing
4. Mainnet deployment

---

**Testing Status**: Ready for comprehensive QA  
**Last Updated**: January 23, 2026

