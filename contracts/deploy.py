"""
Deploy Prediction Market Contract to Algorand TestNet

This script:
1. Connects to Algorand TestNet
2. Reads compiled TEAL programs
3. Deploys the application
4. Stores APP_ID for frontend integration
"""

from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
from algosdk.transaction import StateSchema, ApplicationCreateTxn
import base64
import json
import os

# TestNet connection
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Public node, no token needed

def get_algod_client():
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def compile_program(client, source_code):
    """Compile TEAL source code"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy_contract(creator_mnemonic, asset_symbol, strike_price, expiry_timestamp):
    """
    Deploy the prediction market contract

    Args:
        creator_mnemonic: 25-word mnemonic phrase of deployer account
        asset_symbol: e.g., "BTC"
        strike_price: strike price in cents (e.g., 10000000 for $100k)
        expiry_timestamp: Unix timestamp
    
    Returns:
        app_id: The deployed application ID
    """
    client = get_algod_client()
    
    # Recover account from mnemonic
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    
    print(f"Deploying from account: {sender}")
    
    # Check balance
    account_info = client.account_info(sender)
    balance = account_info.get('amount') / 1_000_000
    print(f"Account balance: {balance} ALGO")
    
    if balance < 0.5:
        print("\n⚠️  WARNING: Low balance!")
        print(f"   Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        print(f"   Paste your address: {sender}\n")
        return None
    
    # Read TEAL programs
    with open("contracts/approval.teal", "r") as f:
        approval_program_source = f.read()
    
    with open("contracts/clear.teal", "r") as f:
        clear_program_source = f.read()
    
    # Compile programs
    approval_program = compile_program(client, approval_program_source)
    clear_program = compile_program(client, clear_program_source)
    
    # Define state schema
    global_schema = StateSchema(num_uints=6, num_byte_slices=2)
    local_schema = StateSchema(num_uints=2, num_byte_slices=0)
    
    # Get suggested params
    params = client.suggested_params()
    
    # Create application args
    app_args = [
        asset_symbol.encode(),
        strike_price.to_bytes(8, 'big'),
        expiry_timestamp.to_bytes(8, 'big')
    ]
    
    # Create transaction
    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Submit transaction
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction ID: {tx_id}")
    
    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = transaction.wait_for_confirmation(client, tx_id, 4)
    
    # Get app ID
    app_id = confirmed_txn['application-index']
    print(f"\n✅ Contract deployed successfully!")
    print(f"   APP ID: {app_id}")
    print(f"   Explorer: https://testnet.explorer.perawallet.app/application/{app_id}/")
    
    # Save to .env file
    env_line = f"\nVITE_ALGORAND_APP_ID={app_id}\n"
    
    with open(".env.local", "a") as f:
        f.write(env_line)
    
    print(f"\n📝 Added APP_ID to .env.local")
    
    # Fund the contract (so it can send payouts)
    print("\n💰 Funding contract with 5 ALGO...")
    import algosdk
    app_address = algosdk.logic.get_application_address(app_id)
    
    fund_txn = transaction.PaymentTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=5_000_000  # 5 ALGO (leave room for fees)
    )
    
    signed_fund_txn = fund_txn.sign(private_key)
    fund_tx_id = client.send_transaction(signed_fund_txn)
    transaction.wait_for_confirmation(client, fund_tx_id, 4)
    
    print(f"✅ Contract funded: {app_address}")
    
    return app_id

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python deploy.py <25-word-mnemonic>")
        print("\nOr set DEPLOYER_MNEMONIC environment variable")
        print("\nGet a TestNet account from: https://bank.testnet.algorand.network/")
        sys.exit(1)
    
    # Get mnemonic from args or env
    creator_mnemonic = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DEPLOYER_MNEMONIC")
    
    # Example market: BTC > $100k by Dec 31, 2025
    deploy_contract(
        creator_mnemonic=creator_mnemonic,
        asset_symbol="BTC",
        strike_price=100_000_00,  # $100k in cents
        expiry_timestamp=1798675200  # Dec 31, 2026 00:00:00 UTC
    )
