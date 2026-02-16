
import algosdk from 'algosdk';
import fs from 'fs';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const TX_ID = "HVQMD4JC7M7TJHQYEL2UB7IC4O6I3OS4EXT737ZWDFAK2JNDJ3UQ";

async function check() {
    try {
        const info = await algodClient.pendingTransactionInformation(TX_ID).do();
        const keys = Object.keys(info);

        const appId = (info as any)['application-index'] || (info as any)['applicationIndex'];

        const debug = {
            keys,
            appId,
            full: info
        };

        fs.writeFileSync('app_id_debug.txt', JSON.stringify(debug, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
            , 2));
        console.log("Written debug info to app_id_debug.txt");

    } catch (e: any) {
        fs.writeFileSync('app_id_error.txt', e.message);
        console.error(e);
    }
}

check();
