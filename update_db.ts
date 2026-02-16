
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
        env[key] = val;
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", SUPABASE_URL);

// New App ID from deployment
const APP_ID = 754332542;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function update() {
    console.log("Updating 'btc' market to App ID:", APP_ID);

    // Find the market first
    const { data: markets, error: findError } = await supabase
        .from('markets')
        .select('*')
        .eq('asset_symbol', 'BTC');

    if (findError) {
        console.error("Find error:", findError);
        return;
    }

    if (!markets || markets.length === 0) {
        console.error("No 'btc' market found.");
        return;
    }

    const market = markets[0];
    console.log("Found market:", market.id, market.title);

    // Update
    const { data: updatedData, error: updateError, count } = await supabase
        .from('markets')
        .update({ app_id: APP_ID })
        .eq('id', market.id)
        .select(); // Needed to get data back and count

    if (updateError) {
        console.error("Update error:", updateError);
        fs.writeFileSync('db_result.txt', "ERROR: " + JSON.stringify(updateError));
    } else {
        console.log(`✅ Market updated! Rows affected: ${updatedData?.length}`);
        fs.writeFileSync('db_result.txt', "SUCCESS");
    }
}

update();
