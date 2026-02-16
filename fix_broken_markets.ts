import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';

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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YXhvbHpjZ3ZvZmFscnBneWJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE2MzAzNSwiZXhwIjoyMDg0NzM5MDM1fQ.0KMZkYFNv-0BtzM9MyfBNzMqzzbGT__GN9zL9vtHl6g');

async function fixMarkets() {
    if (!fs.existsSync('markets_to_fix.json')) {
        console.log("No markets file found provided by diagnose script.");
        return;
    }

    const markets = JSON.parse(fs.readFileSync('markets_to_fix.json', 'utf-8'));
    console.log(`🔧 Fixing ${markets.length} markets...\n`);

    for (const market of markets) {
        console.log(`Processing: ${market.title} (ID: ${market.id})`);

        try {
            // We use the python script we made earlier to deploy a fresh contract
            // We need to capture its output to get the App ID

            // Note: The python script 'deploy_new_contract.py' writes to 'new_app_id.txt'
            // We can re-use it.
            console.log("  🚀 Deploying contract...");
            execSync('python deploy_new_contract.py', { stdio: 'inherit' });

            const newAppId = parseInt(fs.readFileSync('new_app_id.txt', 'utf-8').trim());
            console.log(`  ✅ Contract Deployed! App ID: ${newAppId}`);

            // Update DB
            const { error } = await supabase
                .from('markets')
                .update({ app_id: newAppId })
                .eq('id', market.id);

            if (error) {
                console.error("  ❌ DB Update Failed:", error);
            } else {
                console.log("  ✅ DB Updated.");
            }

        } catch (e) {
            console.error("  ❌ Migration failed:", e);
        }
        console.log("---");
    }

    console.log("\n✨ All repairs complete!");
}

fixMarkets();
