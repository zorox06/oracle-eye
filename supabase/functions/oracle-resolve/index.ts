import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import algosdk from "npm:algosdk@2.7.0";

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const APP_ID = parseInt(Deno.env.get("VITE_ALGORAND_APP_ID") || "754320381");

// Oracle private key (should be stored securely in production)
const ORACLE_MNEMONIC = Deno.env.get("ORACLE_MNEMONIC") || "";

serve(async (req) => {
    try {
        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get current time
        const now = new Date();

        // Query expired markets that haven't been resolved
        const { data: expiredMarkets, error: queryError } = await supabase
            .from("markets")
            .select("*")
            .eq("status", "open")
            .lt("expiry_at", now.toISOString())
            .limit(10);

        if (queryError) throw queryError;

        console.log(`Found ${expiredMarkets?.length || 0} expired markets`);

        const results = [];

        for (const market of expiredMarkets || []) {
            try {
                console.log(`Resolving market: ${market.title}`);

                // 1. Get consensus price from oracle-price function
                const { data: oracleData, error: oracleError } = await supabase.functions.invoke(
                    "oracle-price",
                    {
                        body: { asset: market.asset_symbol },
                    }
                );

                if (oracleError) {
                    console.error(`Oracle error for ${market.title}:`, oracleError);
                    continue;
                }

                const consensusPrice = Math.round(oracleData.aggregatedPrice);
                const confidenceScore = oracleData.oracle?.confidence || 0;

                console.log(`Consensus price: $${consensusPrice}, Confidence: ${confidenceScore}%`);

                // 2. Submit resolution to smart contract
                if (!ORACLE_MNEMONIC) {
                    console.warn("No oracle mnemonic configured - skipping blockchain submission");
                } else {
                    const algodClient = new algosdk.Algodv2("", ALGOD_SERVER, "");
                    const privateKey = algosdk.mnemonicToSecretKey(ORACLE_MNEMONIC);

                    const suggestedParams = await algodClient.getTransactionParams().do();

                    // Create resolve transaction
                    const appArgs = [
                        new Uint8Array(Buffer.from("resolve")),
                        algosdk.encodeUint64(consensusPrice * 100), // Convert to cents
                    ];

                    const resolveTxn = algosdk.makeApplicationNoOpTxn(
                        privateKey.addr,
                        suggestedParams,
                        APP_ID,
                        appArgs
                    );

                    // Sign and submit
                    const signedTxn = resolveTxn.signTxn(privateKey.sk);
                    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

                    console.log(`Resolution tx submitted: ${txId}`);

                    // Wait for confirmation
                    await algosdk.waitForConfirmation(algodClient, txId, 4);

                    console.log(`Market resolved on-chain: ${txId}`);

                    // 3. Record oracle submission
                    await supabase.from("oracle_submissions").insert({
                        market_id: market.id,
                        app_id: APP_ID,
                        consensus_price: consensusPrice,
                        confidence_score: confidenceScore,
                        nodes_online: oracleData.nodes?.filter((n: any) => n.status === "online").length || 0,
                        nodes_data: oracleData.nodes,
                        tx_id: txId,
                    });

                    // 4. Update market status
                    await supabase
                        .from("markets")
                        .update({
                            status: "resolved",
                            resolved_at: now.toISOString(),
                            resolved_price: consensusPrice,
                        })
                        .eq("id", market.id);

                    results.push({
                        market: market.title,
                        price: consensusPrice,
                        txId,
                        success: true,
                    });
                }
            } catch (error) {
                console.error(`Failed to resolve ${market.title}:`, error);
                results.push({
                    market: market.title,
                    success: false,
                    error: error.message,
                });
            }
        }

        return new Response(
            JSON.stringify({
                resolved: results.length,
                results,
            }),
            {
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Oracle resolve error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});
