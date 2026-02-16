import algosdk from 'algosdk';

const APP_ID = 754334300;
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

async function checkContractState() {
    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

    try {
        const appInfo = await algodClient.getApplicationByID(APP_ID).do();
        console.log('\n📊 Contract Info:');
        console.log('========================\n');
        console.log('App ID:', appInfo.id);
        console.log('Creator:', appInfo.params.creator);
        console.log('\n📊 Contract Global State:');
        console.log('========================\n');

        const globalState = (appInfo.params as any)['global-state'];

        if (!globalState || globalState.length === 0) {
            console.log('⚠️ No global state found!');
            return;
        }

        globalState.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            const value = item.value;

            let displayValue;
            if (value.type === 1) { // bytes
                displayValue = Buffer.from(value.bytes, 'base64').toString();
            } else if (value.type === 2) { // uint
                displayValue = value.uint;

                // If this is the expiry key, show human-readable date
                if (key === 'expiry') {
                    const date = new Date(value.uint * 1000);
                    console.log(`${key}: ${displayValue} (${date.toISOString()})`);

                    const now = Date.now();
                    const nowTimestamp = Math.floor(now / 1000);
                    console.log(`Current Unix Time: ${nowTimestamp}`);
                    console.log(`Current Date: ${new Date(now).toISOString()}`);
                    console.log(`Expiry is in ${value.uint > nowTimestamp ? 'FUTURE ✅' : 'PAST ❌'}`);
                    console.log(`Difference: ${((value.uint - nowTimestamp) / 86400).toFixed(1)} days\n`);
                    return;
                }
            }

            console.log(`${key}: ${displayValue}`);
        });

    } catch (error: any) {
        console.error('Error:', error.message || error);
    }
}

checkContractState();
