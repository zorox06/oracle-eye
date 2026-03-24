import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import algosdk from "npm:algosdk@2.7.0";
import { Buffer } from "node:buffer";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const approvalTeal = `#pragma version 8
txn ApplicationID
int 0
==
bnz main_l35
txn OnCompletion
int OptIn
==
bnz main_l34
txn OnCompletion
int CloseOut
==
bnz main_l33
txn OnCompletion
int UpdateApplication
==
bnz main_l32
txn OnCompletion
int DeleteApplication
==
bnz main_l31
txna ApplicationArgs 0
byte "bet_yes"
==
bnz main_l30
txna ApplicationArgs 0
byte "bet_no"
==
bnz main_l29
txna ApplicationArgs 0
byte "resolve"
==
bnz main_l25
txna ApplicationArgs 0
byte "claim"
==
bnz main_l10
err
main_l10:
byte "resolved"
app_global_get
int 1
==
assert
byte "outcome"
app_global_get
int 1
==
bnz main_l22
txn Sender
byte "no"
app_local_get
int 0
>
byte "pool_no"
app_global_get
int 0
>
&&
bnz main_l21
int 0
main_l13:
int 0
>
assert
txn Sender
byte "yes"
int 0
app_local_put
txn Sender
byte "no"
int 0
app_local_put
itxn_begin
int pay
itxn_field TypeEnum
txn Sender
itxn_field Receiver
byte "outcome"
app_global_get
int 1
==
bnz main_l18
txn Sender
byte "no"
app_local_get
int 0
>
byte "pool_no"
app_global_get
int 0
>
&&
bnz main_l17
int 0
main_l16:
itxn_field Amount
int 0
itxn_field Fee
itxn_submit
int 1
return
main_l17:
txn Sender
byte "no"
app_local_get
byte "pool_yes"
app_global_get
byte "pool_no"
app_global_get
+
*
byte "pool_no"
app_global_get
/
b main_l16
main_l18:
txn Sender
byte "yes"
app_local_get
int 0
>
byte "pool_yes"
app_global_get
int 0
>
&&
bnz main_l20
int 0
b main_l16
main_l20:
txn Sender
byte "yes"
app_local_get
byte "pool_yes"
app_global_get
byte "pool_no"
app_global_get
+
*
byte "pool_yes"
app_global_get
/
b main_l16
main_l21:
txn Sender
byte "no"
app_local_get
byte "pool_yes"
app_global_get
byte "pool_no"
app_global_get
+
*
byte "pool_no"
app_global_get
/
b main_l13
main_l22:
txn Sender
byte "yes"
app_local_get
int 0
>
byte "pool_yes"
app_global_get
int 0
>
&&
bnz main_l24
int 0
b main_l13
main_l24:
txn Sender
byte "yes"
app_local_get
byte "pool_yes"
app_global_get
byte "pool_no"
app_global_get
+
*
byte "pool_yes"
app_global_get
/
b main_l13
main_l25:
txn Sender
byte "oracle"
app_global_get
==
assert
global LatestTimestamp
byte "expiry"
app_global_get
>=
assert
byte "resolved"
app_global_get
int 0
==
assert
byte "resolved"
int 1
app_global_put
byte "outcome"
txna ApplicationArgs 1
btoi
byte "strike"
app_global_get
>=
bnz main_l28
int 0
main_l27:
app_global_put
int 1
return
main_l28:
int 1
b main_l27
main_l29:
byte "resolved"
app_global_get
int 0
==
assert
global LatestTimestamp
byte "expiry"
app_global_get
<
assert
txn GroupIndex
int 1
-
gtxns TypeEnum
int pay
==
assert
txn GroupIndex
int 1
-
gtxns Receiver
global CurrentApplicationAddress
==
assert
txn GroupIndex
int 1
-
gtxns Amount
int 0
>
assert
txn Sender
byte "no"
txn Sender
byte "no"
app_local_get
txn GroupIndex
int 1
-
gtxns Amount
+
app_local_put
byte "pool_no"
byte "pool_no"
app_global_get
txn GroupIndex
int 1
-
gtxns Amount
+
app_global_put
int 1
return
main_l30:
byte "resolved"
app_global_get
int 0
==
assert
global LatestTimestamp
byte "expiry"
app_global_get
<
assert
txn GroupIndex
int 1
-
gtxns TypeEnum
int pay
==
assert
txn GroupIndex
int 1
-
gtxns Receiver
global CurrentApplicationAddress
==
assert
txn GroupIndex
int 1
-
gtxns Amount
int 0
>
assert
txn Sender
byte "yes"
txn Sender
byte "yes"
app_local_get
txn GroupIndex
int 1
-
gtxns Amount
+
app_local_put
byte "pool_yes"
byte "pool_yes"
app_global_get
txn GroupIndex
int 1
-
gtxns Amount
+
app_global_put
int 1
return
main_l31:
int 0
return
main_l32:
int 0
return
main_l33:
int 1
return
main_l34:
txn Sender
byte "yes"
int 0
app_local_put
txn Sender
byte "no"
int 0
app_local_put
int 1
return
main_l35:
byte "asset"
txna ApplicationArgs 0
app_global_put
byte "strike"
txna ApplicationArgs 1
btoi
app_global_put
byte "expiry"
txna ApplicationArgs 2
btoi
app_global_put
byte "pool_yes"
int 0
app_global_put
byte "pool_no"
int 0
app_global_put
byte "resolved"
int 0
app_global_put
byte "outcome"
int 0
app_global_put
byte "oracle"
txn Sender
app_global_put
int 1
return`;

const clearTeal = `#pragma version 8
int 1
return`;

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const { title, description, assetSymbol, strikePrice, expiryDate } = body;

        if (!title || !assetSymbol || !strikePrice || !expiryDate) {
            throw new Error("Missing required fields");
        }

        const MNEMONIC = Deno.env.get("ORACLE_MNEMONIC");
        if (!MNEMONIC) throw new Error("No ORACLE_MNEMONIC set in edge function env");

        const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
        const account = algosdk.mnemonicToSecretKey(MNEMONIC);

        console.log("Compiling TEAL...");
        const approvalCompile = await algodClient.compile(approvalTeal).do();
        const clearCompile = await algodClient.compile(clearTeal).do();

        // Fix for uint8array base64
        const atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
        const str2ab = (str: string) => {
            const buf = new ArrayBuffer(str.length);
            const bufView = new Uint8Array(buf);
            for (let i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return bufView;
        };

        const approvalBin = str2ab(atob(approvalCompile.result));
        const clearBin = str2ab(atob(clearCompile.result));

        const expiryUnix = Math.floor(new Date(expiryDate).getTime() / 1000);
        const strikeCents = Math.round(Number(strikePrice) * 100);

        console.log("Deploying contract to Algorand...");
        const suggestedParams = await algodClient.getTransactionParams().do();

        // Use raw application creation since the TEAL expects raw arguments!
        const appArgs = [
            new Uint8Array(Buffer.from(assetSymbol.toLowerCase())),
            algosdk.encodeUint64(strikeCents),
            algosdk.encodeUint64(expiryUnix)
        ];

        const txn = (algosdk as any).makeApplicationCreateTxnFromObject({
            from: account.addr,
            suggestedParams: suggestedParams,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array(approvalBin),
            clearProgram: new Uint8Array(clearBin),
            numGlobalByteSlices: 2,
            numGlobalInts: 6,
            numLocalByteSlices: 0,
            numLocalInts: 2,
            appArgs: appArgs,
        });

        const signedTxn = txn.signTxn(account.sk);
        const response = await algodClient.sendRawTransaction(signedTxn).do();
        const txid = response.txId;
        console.log("TxId:", txid);

        const txInfo = await algosdk.waitForConfirmation(algodClient, txid, 4);
        const appId = txInfo["application-index"];
        console.log("Deployed App ID:", appId);

        console.log("Saving to database...");
        // Insert into DB
        const { data, error } = await supabase
            .from("markets")
            .insert({
                title,
                description,
                asset_symbol: assetSymbol,
                strike_price: Number(strikePrice),
                expiry_at: new Date(expiryDate).toISOString(),
                status: "open",
                app_id: appId
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            throw new Error("Failed to insert market to DB. App ID deployed: " + appId);
        }

        return new Response(JSON.stringify({ success: true, market: data, appId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("market-create error:", error);
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
