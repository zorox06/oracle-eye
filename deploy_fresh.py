import subprocess

# Read mnemonic from .env.deploy
with open('.env.deploy', 'r') as f:
    for line in f:
        if 'DEPLOYER_MNEMONIC' in line:
            mnemonic = line.split('=', 1)[1].strip().strip('"')
            break

print("🚀 Deploying new contract with fresh pools...")
print("Using mnemonic:", mnemonic[:20] + "...\n")

# Run deploy script with mnemonic as argument
result = subprocess.run(['python', 'contracts/deploy.py', mnemonic], 
                       capture_output=True, 
                       text=True,
                       cwd='.')

print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

# Extract App ID from output
if 'App ID:' in result.stdout:
    for line in result.stdout.split('\n'):
        if 'App ID:' in line:
            app_id = line.split('App ID:')[1].strip()
            print(f"\n✅ New contract deployed!")
            print(f"📝 App ID: {app_id}")
            
            # Save to file
            with open('new_app_id.txt', 'w') as f:
                f.write(app_id)
            break
else:
    print("\n❌ Deploy failed!")
    print("Exit code:", result.returncode)
