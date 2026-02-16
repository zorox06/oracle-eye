
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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
    const { data: markets, error } = await supabase
        .from('markets')
        .select('id, title, app_id, asset_symbol')
        .ilike('asset_symbol', 'eth');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Markets found:", JSON.stringify(markets, null, 2));
    }
}

check();
