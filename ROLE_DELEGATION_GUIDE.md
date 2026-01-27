# Role Delegation Guide 🔐

## Problem: "ethers is not defined" Error

**Solution**: The `ethers` library IS imported in the component, but the issue occurs when you enter an **invalid address format**.

---

## How to Properly Delegate Roles

### 1. Get the Target Address

You need a **valid Ethereum address** in the format `0x...` (42 characters total, including the 0x prefix).

#### Option A: From MetaMask
```
1. Open MetaMask
2. Click on the account you want to copy
3. Click "Copy address to clipboard"
4. Paste into the form (should look like: 0x1234567890123456789012345678901234567890)
```

#### Option B: From Local Node
```bash
# If running on localhost, get your account addresses:
npm run compile  # First compile

# Then in a new terminal:
npx hardhat console --network localhost

# In the console:
> const accounts = await ethers.getSigners()
> await accounts[0].getAddress()
'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

> await accounts[1].getAddress()
'0x70997970C51812e339D9B73b0245ad59E8eBF98d'
```

### 2. Format Requirements

✅ **Valid Address Format**:
```
0x1234567890123456789012345678901234567890
├─┬─┘
│ └─ Lowercase 0x prefix (required)
└──── 40 hexadecimal characters (0-9, a-f)
      Total: 42 characters including 0x
```

❌ **Invalid Formats** (Will cause ethers validation to fail):
```
1234567890123456789012345678901234567890    (Missing 0x)
0X1234567890123456789012345678901234567890  (Uppercase X)
0x123456789012345678901234567890123456789   (Only 39 hex chars)
0x12345678901234567890123456789012345678901 (41 hex chars)
john.eth                                      (ENS name - not supported)
```

### 3. Step-by-Step Delegation

#### Step 1: Navigate to Role Management
```
Home → ⭐ Advanced Features (Tier 2) → Tab "Role Management"
```

#### Step 2: Verify You're an Admin
- Check the "Your Role" card displays **"Admin"**
- If it shows "Member" or "Moderator", you cannot assign roles
- Contact an Admin to get Admin role first

#### Step 3: Enter Target Address
```
User Address Input:
[0x70997970C51812e339D9B73b0245ad59E8eBF98d]
```

**Important**: 
- Copy the FULL address (all 42 characters)
- Don't truncate or modify it
- Whitespace is automatically trimmed

#### Step 4: Select Role
```
Role Selection Dropdown:
- Member    (basic voting rights)
- Moderator (can approve amendments)
- Admin     (can assign/revoke roles)
```

#### Step 5: Click "Assign Role"
- Wait for transaction confirmation
- Success message: `Role assigned successfully!`

---

## Testing on Localhost

### Initial Setup
```bash
# Terminal 1: Start the blockchain
npm run dev

# Terminal 2: In the deployed contract, check initial accounts
npx hardhat console --network localhost
```

### Get Test Accounts
```javascript
// In hardhat console
const accounts = await ethers.getSigners();

// Get the addresses
const owner = await accounts[0].getAddress();
const user1 = await accounts[1].getAddress();
const user2 = await accounts[2].getAddress();

console.log("Owner:", owner);
console.log("User 1:", user1);
console.log("User 2:", user2);
```

### Test Delegation Flow

**1. Connect MetaMask to Account 0 (Owner/Admin)**
- Owner is automatically Admin
- Can assign roles to other accounts

**2. Test Assignment**
```
Enter User 1 address: 0x70997970C51812e339D9B73b0245ad59E8eBF98d
Select role: Moderator
Click: Assign Role
```

**3. Verify in Contract**
```javascript
// In hardhat console
const contract = await ethers.getContractAt('ProposalVoting', '0x5FbDB2315678afccb333f8a9c60204c0e94c52fb');

// Check user role
const role = await contract.getUserRole('0x70997970C51812e339D9B73b0245ad59E8eBF98d');
console.log("Role:", role.toString()); // 2 = Moderator
```

**4. Switch to User 1 in MetaMask**
- Copy User 1 address from hardhat console
- In MetaMask: Import Account → Add account number 2
- Select the newly imported account
- Now you're "logged in" as User 1
- Refresh the app
- Verify you now have "Moderator" role

---

## Common Errors & Solutions

### ❌ Error: "Invalid address format"
```
Error: Invalid address format. Expected Ethereum address starting with 0x.
Got: "1234567890123456789012345678901234567890"
```

**Fix**: Add `0x` prefix
```
❌ 1234567890123456789012345678901234567890
✅ 0x1234567890123456789012345678901234567890
```

---

### ❌ Error: "Invalid address format. Expected Ethereum address starting with 0x"
```
Error: Invalid address format. Expected Ethereum address starting with 0x.
Got: "0x123"
```

**Fix**: Use FULL 42-character address
```
❌ 0x123 (too short)
✅ 0x70997970C51812e339D9B73b0245ad59E8eBF98d (correct)
```

---

### ❌ Error: "Invalid address format. Expected Ethereum address starting with 0x"
```
Error: Invalid address format. Expected Ethereum address starting with 0x.
Got: "john.eth"
```

**Fix**: Use Ethereum address, not ENS name
```
❌ john.eth (ENS name not supported)
✅ 0x70997970C51812e339D9B73b0245ad59E8eBF98d (correct format)
```

---

### ❌ Error: "Only Admin role can assign roles"
```
Error: Caller is not an admin
```

**Fix**: Switch to Admin account in MetaMask
1. Open MetaMask
2. Click account dropdown
3. Select account with Admin role
4. Try again

---

### ❌ Error: "ethers is not defined" (Rare)
```
ReferenceError: ethers is not defined
```

**Causes**:
1. Address validation fails (most common - see above fixes)
2. Browser cache issue (rare)

**Fix**:
1. Verify address format first (see "Invalid address format" error above)
2. If address format is correct, clear browser cache:
   - Open DevTools (F12)
   - Right-click refresh button
   - Click "Empty cache and hard refresh"
   - Try again

---

## Address Validation Function

The component uses this validation:

```javascript
const trimmedAddress = targetAddress.trim();
if (!ethers.isAddress(trimmedAddress)) {
  throw new Error(
    `Invalid address format. Expected Ethereum address starting with 0x...`
  );
}
```

**What this checks**:
- ✅ Must start with `0x`
- ✅ Must be exactly 42 characters total
- ✅ Remaining 40 characters must be valid hex (0-9, a-f)
- ✅ Whitespace is automatically trimmed
- ✅ Case-insensitive (0xAbc... same as 0xabc...)

---

## Role Hierarchy

```
┌─────────────────────────────────┐
│          Admin (3)              │
│  ✅ Assign/revoke roles         │
│  ✅ Approve amendments          │
│  ✅ Create proposals            │
│  ✅ Vote                        │
│  ✅ Delegate votes              │
└─────────────────────────────────┘
             ▲
             │ Can be assigned by
             │
┌─────────────────────────────────┐
│       Moderator (2)             │
│  ✅ Approve/reject amendments   │
│  ✅ Create proposals            │
│  ✅ Vote                        │
│  ✅ Delegate votes              │
│  ❌ Assign roles (need Admin)   │
└─────────────────────────────────┘
             ▲
             │ Can be assigned by
             │
┌─────────────────────────────────┐
│        Member (1)               │
│  ✅ Create proposals            │
│  ✅ Vote                        │
│  ✅ Delegate votes              │
│  ✅ Propose amendments          │
│  ❌ Approve amendments          │
│  ❌ Assign roles                │
└─────────────────────────────────┘
```

---

## Live Testing Checklist

- [ ] Started dev server: `npm run dev`
- [ ] Connected MetaMask wallet
- [ ] Have 2+ test accounts available
- [ ] Account 1 is Admin (automatic)
- [ ] Account 1 address copied correctly (0x...)
- [ ] No whitespace in address
- [ ] Selected appropriate role (Member/Moderator/Admin)
- [ ] Clicked "Assign Role"
- [ ] Saw success message
- [ ] Switched to Account 2 in MetaMask
- [ ] Verified Account 2 now shows new role
- [ ] Repeated with different roles

---

## FAQ

**Q: Can I copy from MetaMask in uppercase?**
A: Yes! ethers.isAddress() accepts both uppercase and lowercase: `0xABC...` and `0xabc...` are treated the same.

**Q: What happens if I enter an invalid address?**
A: The form shows an error message with the specific problem. The transaction is NOT submitted to the blockchain.

**Q: Can I delegate roles to a contract address?**
A: Yes, as long as it's a valid Ethereum address format. The smart contract will accept it.

**Q: How do I see which roles I've assigned?**
A: In the "Managed Users" section below the form, all users you've assigned roles to are listed with their current roles.

**Q: Can I revoke a role?**
A: Yes! As an Admin, click the "Revoke" button next to any user in the "Managed Users" list.

---

## Next Steps

✅ Follow the guide above to properly delegate roles  
✅ Test with multiple accounts on localhost  
✅ Deploy to testnet when ready  
✅ Use on mainnet with production accounts  

