import algosdk from 'algosdk';

const TX_ID = 'V6B7E27LCIQWC6CSXI36TFTAV4UZKSZV53COYDREWX2O2QNTGXGQ';
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

async function checkTransaction() {
    try {
        console.log('🔍 Checking transaction:', TX_ID);
        console.log('🔗 View on explorer: https://testnet.explorer.perawallet.app/tx/' + TX_ID);

        const txInfo = await algodClient.pendingTransactionInformation(TX_ID).do();
        console.log('\n📊 Transaction Info:');
        console.log(JSON.stringify(txInfo, null, 2));

        // Check if it's an app call
        if (txInfo['application-index']) {
            console.log('\n✅ App ID used:', txInfo['application-index']);
        }

        // Also try to get confirmed transaction
        const status = await algodClient.status().do();
        console.log('\nCurrent round:', status['last-round']);

    } catch (error: any) {
        console.log('Error with pending tx, trying confirmed...');

        // If not pending, search recent blocks
        try {
            const status = await algodClient.status().do();
            const currentRound = status['last-round'];

            console.log('Searching recent blocks...');

            // Search last 100 blocks
            for (let i = 0; i < 100; i++) {
                const round = currentRound - i;
                try {
                    const block = await algodClient.block(round).do();
                    const txns = block.block.txns || [];

                    for (const txn of txns) {
                        if (txn.txn && txn.txn.apid) {
                            console.log(`Found app call in round ${round}, App ID: ${txn.txn.apid}`);
                        }
                    }
                } catch (e) {
                    // Skip
                }
            }
        } catch (e: any) {
            console.error('Error:', e.message);
        }
    }
}

checkTransaction();
