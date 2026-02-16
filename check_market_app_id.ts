import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXhvbHpjZ3ZvZmFscnBneWJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE2MzAzNSwiZXhwIjoyMDg0NzM5MDM1fQ.0KMZkYFNv-0BtzM9MyfBNzMqzzbGT__GN9zL9vtHl6g';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkMarketAppId() {
    // Get the market
    const { data: market } = await supabase
        .from('markets')
        .select('*')
        .single();

    console.log('📊 Market from database:');
    console.log('  ID:', market?.id);
    console.log('  Title:', market?.title);
    console.log('  App ID in DB:', market?.app_id);

    // Get a recent position to see which app was actually used
    const { data: position } = await (supabase as any)
        .from('positions')
        .select('*')
        .limit(1)
        .order('created_at', { ascending: false })
        .single();

    console.log('\n📊 Most recent position:');
    console.log('  Market ID:', position?.market_id);
    console.log('  User:', position?.user_address?.slice(0, 10) + '...');
    console.log('  Side:', position?.side);
    console.log('  Amount:', position?.amount / 1_000_000, 'ALGO');
    console.log('  Tx ID:', position?.tx_id);

    if (position?.tx_id) {
        console.log('\n🔍 Check transaction on TestNet:');
        console.log(`  https://testnet.explorer.perawallet.app/tx/${position.tx_id}`);
    }
}

checkMarketAppId();
