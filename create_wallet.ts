import algosdk from 'algosdk';
import fs from 'fs';

const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log("✅ New Account Generated");
console.log("Address:", account.addr);
console.log("Mnemonic:", mnemonic);

const envContent = `DEPLOYER_ADDR=${account.addr}\nDEPLOYER_MNEMONIC="${mnemonic}"\n`;
fs.writeFileSync('.env.deploy', envContent);
console.log("Saved to .env.deploy");
