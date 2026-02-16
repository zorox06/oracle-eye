
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
const NEW_APP_ID = 754334300;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function forceUpdate() {
    console.log(`Searching for market...`);

    // 1. Find the market by title (more robust than symbol)
    const { data: markets, error: findError } = await supabase
        .from('markets')
        .select('*')
        .ilike('title', '%91k%');

    if (findError) {
        console.error("Search failed:", findError);
        return;
    }

    if (!markets || markets.length === 0) {
        console.error("No market found with title containing '91k'");
        return;
    }

    const market = markets[0];
    console.log(`Found market:`);
    console.log(`  ID: ${market.id}`);
    console.log(`  Title: ${market.title}`);
    console.log(`  Current App ID: ${market.app_id}`);

    // 2. Update by ID
    const { data, error: updateError } = await supabase
        .from('markets')
        .update({ app_id: NEW_APP_ID })
        .eq('id', market.id)
        .select();

    if (updateError) {
        console.error("Update FAILED:", updateError);
    } else {
        console.log("Update response data:", data);
        if (data && data.length > 0) {
            console.log("✅ SUCCESS: App ID updated!");
            console.log("New ID in DB:", data[0].app_id);
        } else {
            console.log("⚠️ WARNING: No rows were updated even with ID match.");
        }
    }
}


forceUpdate();
