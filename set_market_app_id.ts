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
const APP_ID = 754334795; // The working contract with proper state

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setMarketAppId() {
    console.log('Setting market App ID to:', APP_ID);

    // Update all markets
    const { data, error } = await supabase
        .from('markets')
        .update({ app_id: APP_ID })
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Updated markets:');
        data?.forEach(m => {
            console.log(`  - ${m.title}: App ID = ${m.app_id}`);
        });
    }
}

setMarketAppId();
