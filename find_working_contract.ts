import algosdk from 'algosdk';

const APP_IDS = [754334795, 754334300, 754332542, 754330380];
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

async function findWorkingContract() {
    console.log('🔍 Checking all deployed contracts...\n');

    for (const appId of APP_IDS) {
        try {
            const info = await algodClient.getApplicationByID(appId).do();
            const state = info.params['global-state'];

            if (!state || state.length === 0) {
                console.log(`❌ App ${appId}: No state`);
                continue;
            }

            const decoded: Record<string, any> = {};
            state.forEach((item: any) => {
                const key = Buffer.from(item.key, 'base64').toString();
                const val = item.value;
                decoded[key] = val.type === 1
                    ? Buffer.from(val.bytes, 'base64').toString()
                    : val.uint;
            });

            const yesPool = decoded.pool_yes || 0;
            const noPool = decoded.pool_no || 0;

            console.log(`✅ App ${appId}:`);
            console.log(`   YES Pool: ${yesPool / 1_000_000} ALGO`);
            console.log(`   NO Pool: ${noPool / 1_000_000} ALGO`);
            console.log(`   Total: ${(yesPool + noPool) / 1_000_000} ALGO`);

            if (yesPool > 0 || noPool > 0) {
                console.log(`\n🎯 FOUND IT! This is the contract with your bets!`);
                console.log(`   Update .env.local to: VITE_ALGORAND_APP_ID=${appId}`);
            }

        } catch (error: any) {
            console.log(`❌ App ${appId}: ${error.message}`);
        }
    }
}

findWorkingContract();
