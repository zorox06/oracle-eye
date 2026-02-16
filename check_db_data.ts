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

async function checkData() {
    console.log('🔍 Checking database data...\n');

    // Check markets
    const { data: markets } = await supabase
        .from('markets')
        .select('*');

    console.log(`📊 Markets (${markets?.length || 0}):`);
    markets?.forEach(m => {
        console.log(`  - ${m.title} (ID: ${m.id}, App ID: ${m.app_id})`);
    });

    // Check positions
    const { data: positions } = await (supabase as any)
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });

    console.log(`\n📊 Positions (${positions?.length || 0}):`);
    if (positions && positions.length > 0) {
        positions.forEach((p: any) => {
            console.log(`  - ${p.side.toUpperCase()}: ${p.amount / 1_000_000} ALGO by ${p.user_address.slice(0, 8)}...`);
            console.log(`    Market: ${p.market_id}`);
            console.log(`    Time: ${new Date(p.created_at).toLocaleString()}`);
        });
    } else {
        console.log('  ⚠️ No positions found in database!');
    }
}

checkData();
