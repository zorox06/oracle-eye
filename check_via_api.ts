import algosdk from 'algosdk';
import https from 'https';

const APP_ID = 754334300;

async function checkViaAPI() {
    const url = `https://testnet-api.algonode.cloud/v2/applications/${APP_ID}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('\n📊 Application Details:');
                console.log('========================\n');
                console.log('App ID:', json.id);
                console.log('Created at round:', json['created-at-round']);

                const globalState = json.params?.['global-state'];

                if (!globalState || globalState.length === 0) {
                    console.log('\n⚠️  WARNING: Contract has NO global state!');
                    console.log('This means on_creation did not execute properly.');
                    console.log('The contract exists but was not initialized.\n');
                } else {
                    console.log('\n✅ Global State Found:');
                    console.log('========================\n');

                    globalState.forEach((item: any) => {
                        const key = Buffer.from(item.key, 'base64').toString();

                        if (item.value.type === 1) {
                            const val = Buffer.from(item.value.bytes, 'base64').toString();
                            console.log(`${key}: "${val}"`);
                        } else if (item.value.type === 2) {
                            console.log(`${key}: ${item.value.uint}`);

                            if (key === 'expiry') {
                                const date = new Date(item.value.uint * 1000);
                                console.log(`  → ${date.toISOString()}`);
                            }
                        }
                    });
                }

            } catch (e: any) {
                console.error('Error parsing response:', e.message);
            }
        });
    }).on('error', (e) => {
        console.error('Request error:', e.message);
    });
}

checkViaAPI();
