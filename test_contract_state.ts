import algosdk from 'algosdk';

const APP_ID = 754334795;
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

async function testContractState() {
    console.log('Testing contract state for App ID:', APP_ID);

    try {
        const info = await algodClient.getApplicationByID(APP_ID).do();
        const state = info.params['global-state'];

        console.log('\n📊 Raw global state:');
        console.log(JSON.stringify(state, null, 2));

        const decoded: Record<string, any> = {};
        if (!state) {
            console.log('⚠️ No state found!');
            return;
        }

        state.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            const val = item.value;
            const decodedValue = val.type === 1
                ? Buffer.from(val.bytes, 'base64').toString()
                : val.uint;

            decoded[key] = decodedValue;
            console.log(`${key}: ${decodedValue}`);
        });

        console.log('\n📊 Decoded state:');
        console.log(JSON.stringify(decoded, null, 2));

        console.log('\n🎯 Expected keys: pool_yes, pool_no');
        console.log('Got keys:', Object.keys(decoded));
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testContractState();
