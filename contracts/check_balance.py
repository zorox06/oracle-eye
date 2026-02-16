from algosdk.v2client import algod

# TestNet API endpoint
client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

# Check balance
address = "OJJJHG2JTM4IF4LJ6Y47YGQEK2YWCWHG5ALQLX62MBI6FLZXBXXEJMDNPA"
info = client.account_info(address)

balance_algo = info["amount"] / 1_000_000

print(f"✅ TestNet Wallet Balance")
print(f"   Address: {address}")
print(f"   Balance: {balance_algo} ALGO")

if balance_algo >= 10:
    print(f"\n🎉 Funded! Ready to deploy contract.")
elif balance_algo > 0:
    print(f"\n⚠️  Partially funded. Get more from faucet.")
else:
    print(f"\n❌ No ALGO yet. Please dispense from faucet.")
