import algosdk from 'algosdk';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const APP_ID = 754320381;

async function checkState() {
    try {
        const info = await algodClient.getApplicationByID(APP_ID).do();
        const state = info.params['global-state'];

        console.log("Global State (Raw):", JSON.stringify(state, null, 2));

        if (!state) {
            console.log("State is empty/undefined");
            return;
        }

        state.forEach((item: any) => {
            try {
                const key = Buffer.from(item.key, 'base64').toString();
                const val = item.value;
                const userVal = val.type === 1
                    ? Buffer.from(val.bytes, 'base64').toString()
                    : val.uint;
                console.log(`Key: ${key}, Value: ${userVal}`);
            } catch (err) {
                console.log("Error decoding item:", item);
            }
        });
    } catch (e) {
        console.error("Error fetching state:", e);
    }
}

checkState();
