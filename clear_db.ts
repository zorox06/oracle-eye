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

async function clearDatabase() {
    console.log('🗑️  Clearing all positions from database...\n');

    // Delete all positions
    const { error } = await (supabase as any)
        .from('positions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ All positions cleared!');
    }

    // Show remaining markets
    const { data: markets } = await supabase
        .from('markets')
        .select('*');

    console.log('\n📊 Markets in database:');
    markets?.forEach(m => {
        console.log(`  - ${m.title}`);
        console.log(`    ID: ${m.id}`);
        console.log(`    App ID: ${m.app_id || 'NOT SET'}`);
        console.log(`    Status: ${m.status}`);
    });

    console.log('\n✅ Database cleared and ready for fresh start!');
    console.log('\nNext steps:');
    console.log('1. Deploy a NEW contract for each market');
    console.log('2. Update each market\'s app_id in the database');
    console.log('3. Each market will be completely independent!');
}

clearDatabase();
