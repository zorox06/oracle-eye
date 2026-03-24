import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";
import { APPROVAL_TEAL, CLEAR_TEAL } from "./contracts";
import { Buffer } from "buffer";

// Ensure Buffer is available globally (vite polyfill check)
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

const ALGOD_TOKEN = "";
const ALGOD_SERVER = "https://testnet-api.algonode.cloud"; // Empty placeholder
const PORT = 443;

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, PORT);


export async function optInToContract(
    appId: number,
    userAddress: string,
    peraWallet: PeraWalletConnect
): Promise<string> {
    console.log("🎯 optInToContract:", { appId, userAddress });

    try {
        const params = await algodClient.getTransactionParams().do();
        console.log("✅ Got params");

        // Use makeApplicationOptInTxnFromObject with correct signature
        const txn = (algosdk as any).makeApplicationOptInTxnFromObject({
            sender: userAddress,  // Try 'sender' instead of 'from'
            appIndex: appId,
            suggestedParams: params
        });

        console.log("✅ Transaction created");

        const signedTxns = await peraWallet.signTransaction([[{ txn }]]);
        const response = await algodClient.sendRawTransaction(signedTxns).do();
        const txId = response.txid;

        console.log("✅ Sent:", txId);
        await algosdk.waitForConfirmation(algodClient, txId, 4);

        return txId;
    } catch (error: any) {
        console.error("❌ Full error:", error);
        throw new Error(error.message || "Opt-in failed");
    }
}

export async function hasOptedIn(appId: number, userAddress: string): Promise<boolean> {
    try {
        const info = await algodClient.accountApplicationInformation(userAddress, appId).do();
        return info['app-local-state'] !== undefined;
    } catch {
        return false;
    }
}

export async function betYes(
    appId: number,
    userAddress: string,
    amountMicroAlgo: number,
    peraWallet: PeraWalletConnect
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    const appAddr = algosdk.getApplicationAddress(appId);

    const payTxn = (algosdk as any).makePaymentTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        receiver: appAddr,
        amount: amountMicroAlgo,
        suggestedParams: params
    });

    const appTxn = (algosdk as any).makeApplicationNoOpTxnFromObject({
        sender: userAddress,
        appIndex: appId,
        appArgs: [new Uint8Array(Buffer.from('bet_yes'))],
        suggestedParams: params
    });

    algosdk.assignGroupID([payTxn, appTxn]);
    const signed = await peraWallet.signTransaction([[{ txn: payTxn }, { txn: appTxn }]]);
    const response = await algodClient.sendRawTransaction(signed).do();
    const txId = response.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    return txId;
}

export async function betNo(
    appId: number,
    userAddress: string,
    amountMicroAlgo: number,
    peraWallet: PeraWalletConnect
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    const appAddr = algosdk.getApplicationAddress(appId);

    const payTxn = (algosdk as any).makePaymentTxnWithSuggestedParamsFromObject({
        sender: userAddress,
        receiver: appAddr,
        amount: amountMicroAlgo,
        suggestedParams: params
    });

    const appTxn = (algosdk as any).makeApplicationNoOpTxnFromObject({
        sender: userAddress,
        appIndex: appId,
        appArgs: [new Uint8Array(Buffer.from('bet_no'))],
        suggestedParams: params
    });

    algosdk.assignGroupID([payTxn, appTxn]);
    const signed = await peraWallet.signTransaction([[{ txn: payTxn }, { txn: appTxn }]]);
    const response = await algodClient.sendRawTransaction(signed).do();
    const txId = response.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    return txId;
}

export async function claimWinnings(
    appId: number,
    userAddress: string,
    peraWallet: PeraWalletConnect
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();

    const appTxn = (algosdk as any).makeApplicationNoOpTxnFromObject({
        sender: userAddress,
        appIndex: appId,
        appArgs: [new Uint8Array(Buffer.from('claim'))],
        suggestedParams: params
    });

    const signed = await peraWallet.signTransaction([[{ txn: appTxn }]]);
    const response = await algodClient.sendRawTransaction(signed).do();
    const txId = response.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    return txId;
}

export async function getContractState(appId: number) {
    try {
        const response = await fetch(`${ALGOD_SERVER || 'http://localhost'}/v2/applications/${appId}`);
        const data = await response.json();

        const state = data.params?.['global-state'];
        const decoded: Record<string, any> = {};

        if (!state) return decoded;

        state.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            const val = item.value;
            decoded[key] = val.type === 1
                ? Buffer.from(val.bytes, 'base64').toString()
                : val.uint;
        });

        console.log('📊 Contract state for App', appId, ':', decoded);
        return decoded;
    } catch (error) {
        console.error("Error fetching contract state:", error);
        return {};
    }
}

export async function getUserPosition(appId: number, userAddress: string) {
    try {
        const info = await algodClient.accountApplicationInformation(userAddress, appId).do();
        const state = info['app-local-state']['key-value'];

        let yesAmount = 0, noAmount = 0;
        state?.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            if (key === 'yes') yesAmount = item.value.uint;
            if (key === 'no') noAmount = item.value.uint;
        });

        return { yesAmount, noAmount };
    } catch {
        return { yesAmount: 0, noAmount: 0 };
    }
}
