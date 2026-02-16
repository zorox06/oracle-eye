"""
Simple contract deployment script that works on Windows
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
from algosdk.transaction import StateSchema, ApplicationCreateTxn
import base64

# Read mnemonic
with open('.env.deploy', 'r', encoding='utf-8') as f:
    for line in f:
        if 'DEPLOYER_MNEMONIC' in line:
            deployer_mnemonic = line.split('=', 1)[1].strip().strip('"')
            break

# Get private key
deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
deployer_address = account.address_from_private_key(deployer_private_key)

print(f"Deploying from: {deployer_address[:10]}...")

# Connect to TestNet
algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

# Read TEAL programs
with open('contracts/approval.teal', 'r') as f:
    approval_program = f.read()

with open('contracts/clear.teal', 'r') as f:
    clear_program = f.read()

# Compile programs
approval_result = algod_client.compile(approval_program)
approval_binary = base64.b64decode(approval_result['result'])

clear_result = algod_client.compile(clear_program)
clear_binary = base64.b64decode(clear_result['result'])

# Get transaction params
params = algod_client.suggested_params()

# State schema
global_schema = StateSchema(num_uints=6, num_byte_slices=2)
local_schema = StateSchema(num_uints=2, num_byte_slices=0)

# App args - expiry Dec 31, 2026
expiry_timestamp = 1798675200
app_args = [
    "BTC".encode(),
    (100_000_00).to_bytes(8, 'big'),
    expiry_timestamp.to_bytes(8, 'big')
]

# Create transaction
txn = ApplicationCreateTxn(
    sender=deployer_address,
    sp=params,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_binary,
    clear_program=clear_binary,
    global_schema=global_schema,
    local_schema=local_schema,
    app_args=app_args
)

# Sign
signed_txn = txn.sign(deployer_private_key)

# Send
print("Sending transaction...")
tx_id = algod_client.send_transaction(signed_txn)

# Wait for confirmation
print("Waiting for confirmation...")
confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)

app_id = confirmed_txn['application-index']
print(f"\nSUCCESS!")
print(f"App ID: {app_id}")

# Save to file
with open('new_app_id.txt', 'w') as f:
    f.write(str(app_id))

print(f"\nContract deployed with ZERO pools!")
print(f"Update your market's app_id to: {app_id}")
