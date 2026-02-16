# Algorand TestNet Setup Guide

## Step 1: Create a TestNet Account

You have two options:

### Option A: Use Pera Wallet (Recommended)
1. Install Pera Wallet mobile app or browser extension
2. Create a new account
3. Switch network to **TestNet** in settings
4. Copy your address (starts with algo...)

### Option B: Generate via Python
```bash
python -c "from algosdk import account, mnemonic; private_key, address = account.generate_account(); print(f'Address: {address}\nMnemonic: {mnemonic.from_private_key(private_key)}')"
```

**⚠️ SAVE YOUR MNEMONIC** - You'll need it to deploy!

---

## Step 2: Get Free TestNet ALGO

1. **Open the faucet**: https://bank.testnet.algorand.network/
2. **Paste your address** in the input field
3. **Click "Dispense"** - You'll receive **10 ALGO** (~15 seconds)
4. **Verify balance**: Check on https://testnet.explorer.perawallet.app/

---

## Step 3: Deploy the Contract

Once you have TestNet ALGO:

```bash
# Deploy with your mnemonic (replace with your 25 words)
python contracts/deploy.py "word1 word2 word3 ... word25"
```

**The script will:**
- ✅ Connect to TestNet
- ✅ Compile the TEAL programs
- ✅ Deploy the application
- ✅ Fund the contract with 10 ALGO
- ✅ Save APP_ID to `.env.local`

**Expected Output:**
```
Deploying from account: ABC123...
Account balance: 10.0 ALGO
Transaction ID: XYZ789...
Waiting for confirmation...

✅ Contract deployed successfully!
   APP ID: 123456789
   Explorer: https://testnet.explorer.perawallet.app/application/123456789/

📝 Added APP_ID to .env.local
💰 Funding contract with 10 ALGO...
✅ Contract funded: DEF456...
```

---

## Step 4: Verify Deployment

Check the contract on the explorer:
```
https://testnet.explorer.perawallet.app/application/{APP_ID}/
```

You should see:
- **Global State**: asset, strike, expiry, pools
- **Balance**: ~10 ALGO

---

## Troubleshooting

**"Low balance" error:**
- Go back to faucet and get more ALGO
- You need at least 0.5 ALGO to deploy

**"Invalid mnemonic" error:**
- Make sure you have exactly 25 words
- Use quotes around the mnemonic

**Connection timeout:**
- TestNet might be slow, retry after 30 seconds

---

## Next Steps After Deployment

Once deployed, the frontend will automatically:
1. Read `VITE_ALGORAND_APP_ID` from `.env.local`
2. Connect to the contract via algosdk
3. Enable real betting transactions

Ready to proceed? 🚀
