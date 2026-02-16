
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env for URL
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
const NEW_APP_ID = 754334795;

// Use service role key for full access
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updateAllMarkets() {
    console.log('🔧 Updating ALL markets with App ID:', NEW_APP_ID);
    console.log('========================\n');

    // First, list all markets
    const { data: markets, error: listError } = await supabase
        .from('markets')
        .select('*');

    if (listError) {
        console.error('❌ Failed to list markets:', listError);
        return;
    }

    console.log(`Found ${markets?.length || 0} market(s):\n`);
    markets?.forEach(m => {
        console.log(`- ${m.title} (ID: ${m.id})`);
        console.log(`  Current App ID: ${m.app_id}`);
    });

    // Update ALL markets to use the new App ID
    const { data: updated, error: updateError } = await supabase
        .from('markets')
        .update({ app_id: NEW_APP_ID })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all (dummy condition)
        .select();

    if (updateError) {
        console.error('\n❌ Update failed:', updateError);
        return;
    }

    console.log(`\n✅ Successfully updated ${updated?.length || 0} market(s)!`);
    updated?.forEach(m => {
        console.log(`- ${m.title}: App ID → ${m.app_id}`);
    });
}

updateAllMarkets();
