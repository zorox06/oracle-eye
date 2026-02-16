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

// Read new App ID from file
const NEW_APP_ID = parseInt(fs.readFileSync('new_app_id.txt', 'utf-8').trim());

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updateMarket() {
    console.log(`\n🔄 Updating market with new App ID: ${NEW_APP_ID}\n`);

    const { data, error } = await supabase
        .from('markets')
        .update({ app_id: NEW_APP_ID })
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Market updated successfully!');
        data?.forEach(m => {
            console.log(`  - ${m.title}`);
            console.log(`    New App ID: ${m.app_id}`);
        });

        console.log('\n🎉 DONE! Fresh start with 0.00 ALGO in pools!');
        console.log('\n📋 Next steps:');
        console.log('1. Refresh your browser (Ctrl+Shift+R)');
        console.log('2. Click "Opt In Now"');
        console.log('3. Start placing bets!');
    }
}

updateMarket();
