import https from 'https';

const APP_ID = 754341344;

function checkContract() {
    const url = `https://testnet-api.algonode.cloud/v2/applications/${APP_ID}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);

                console.log('📊 App ID:', APP_ID);
                console.log('Created at round:', json['created-at-round']);

                const params = json.params;
                console.log('\n📊 Global State:');

                if (!params || !params['global-state']) {
                    console.log('⚠️ No global-state in params!');
                    console.log('\nFull params:');
                    console.log(JSON.stringify(params, null, 2));
                    return;
                }

                const state = params['global-state'];
                console.log(`Found ${state.length} state variables:\n`);

                state.forEach((item: any) => {
                    const keyB64 = item.key;
                    const key = Buffer.from(keyB64, 'base64').toString();

                    let value;
                    if (item.value.type === 1) {
                        value = Buffer.from(item.value.bytes, 'base64').toString();
                    } else if (item.value.type === 2) {
                        value = item.value.uint;
                    }

                    console.log(`  ${key}: ${value}`);

                    if (key === 'pool_yes' || key === 'pool_no') {
                        console.log(`    → ${(value / 1_000_000).toFixed(2)} ALGO`);
                    }
                });

            } catch (e: any) {
                console.error('Parse error:', e.message);
                console.log('Raw response:', data.substring(0, 500));
            }
        });
    }).on('error', (e) => {
        console.error('Request error:', e.message);
    });
}

checkContract();
