
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listMarkets() {
    console.log("Listing all markets...");

    const { data: markets, error } = await supabase
        .from('markets')
        .select('*');

    if (error) {
        console.error("Error fetching markets:", error);
        return;
    }

    console.log(`Found ${markets.length} markets:`);
    markets.forEach(m => {
        console.log(`- ID: ${m.id}`);
        console.log(`  Title: ${m.title}`);
        console.log(`  Symbol: ${m.asset_symbol}`);
        console.log(`  App ID: ${m.app_id}`);
        console.log("---");
    });
}

listMarkets();
