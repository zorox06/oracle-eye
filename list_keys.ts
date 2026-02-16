
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

async function list() {
    const { data, error } = await supabase.from('markets').select('*');
    if (error) {
        console.error("Error fetching markets:", error);
    } else {
        console.log("Markets found:", data.length);
        data.forEach((m: any) => {
            console.log(`ID: ${m.id} | Symbol: ${m.asset_symbol} | AppID: ${m.app_id}`);
        });
    }
}

list();
