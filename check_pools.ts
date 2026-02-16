
import algosdk from 'algosdk';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const APP_ID = 754330380;

async function checkState() {
    try {
        const info = await algodClient.getApplicationByID(APP_ID).do();
        const state = info.params['global-state'];

        console.log("On-Chain State for App", APP_ID);
        if (!state) {
            console.log("No global state found.");
            return;
        }

        const decoded: any = {};
        state.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            const val = item.value;
            const value = val.type === 1
                ? Buffer.from(val.bytes, 'base64').toString()
                : val.uint;
            decoded[key] = value;
            console.log(`${key}: ${value}`);
        });

        console.log("\n--- Pool Status ---");
        console.log("YES Pool:", decoded['pool_yes'] || 0);
        console.log("NO Pool:", decoded['pool_no'] || 0);

    } catch (e) {
        console.error("Error:", e);
    }
}

checkState();
