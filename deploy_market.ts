
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MNEMONIC = "situate catalog minor sad boat way advice glance curious amateur treat ketchup vague raise search inside idle cycle check twice combine square siren above coast";

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

function log(msg: string) {
    console.log(msg);
    try { fs.appendFileSync('deploy_log.txt', msg + '\n'); } catch { }
}

async function deploy() {
    try {
        log("Starting deployment with ATC...");
        const account = algosdk.mnemonicToSecretKey(MNEMONIC);
        log("Deploying from: " + account.addr);

        // Read TEAL
        const approvalProgram = fs.readFileSync(path.join(__dirname, 'contracts', 'approval.teal'));
        const clearProgram = fs.readFileSync(path.join(__dirname, 'contracts', 'clear.teal'));

        // Compile
        const approvalCompile = await algodClient.compile(approvalProgram).do();
        const clearCompile = await algodClient.compile(clearProgram).do();

        const approvalBin = new Uint8Array(Buffer.from(approvalCompile.result, 'base64'));
        const clearBin = new Uint8Array(Buffer.from(clearCompile.result, 'base64'));

        // Define Method
        const method = new algosdk.ABIMethod({
            name: 'create',
            args: [
                { type: 'string', name: 'asset' },
                { type: 'uint64', name: 'strike' },
                { type: 'uint64', name: 'expiry' }
            ],
            returns: { type: 'void' }
        });

        const expiry = Math.floor(new Date('2026-01-25').getTime() / 1000);

        // ATC
        const atc = new algosdk.AtomicTransactionComposer();
        const signer = algosdk.makeBasicAccountTransactionSigner(account);

        atc.addMethodCall({
            appID: 0,
            method: method,
            methodArgs: [
                'eth',
                BigInt(300000), // 3000 USD
                BigInt(expiry)
            ],
            sender: account.addr,
            signer: signer,
            approvalProgram: approvalBin,
            clearProgram: clearBin,
            numGlobalByteSlices: 2,
            numGlobalInts: 6,
            numLocalByteSlices: 0,
            numLocalInts: 2,
            suggestedParams: await algodClient.getTransactionParams().do()
        });

        log("Sending transaction...");
        const result = await atc.execute(algodClient, 4);

        const txid = result.txIDs[0];
        log("Deploy Tx: " + txid);

        const txInfo = await algodClient.pendingTransactionInformation(txid).do() as any;
        const appId = txInfo['application-index'];
        log("Created App ID: " + appId);

        fs.writeFileSync('.app_id', appId.toString());

    } catch (e: any) {
        log("Error: " + (e.message || JSON.stringify(e)));
        console.error(e);
    }
}

deploy();
