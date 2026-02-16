import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
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

async function checkAllMarkets() {
    console.log("🔍 Diagnosing ALL Markets...\n");

    const { data: markets, error } = await supabase
        .from('markets')
        .select('*');

    if (error) {
        console.error("❌ Failed to fetch markets:", error);
        return;
    }

    console.log(`Found ${markets.length} markets.`);

    const needsFixing = [];

    for (const m of markets) {
        const appId = m.app_id;
        let status = "✅ OK";

        if (!appId) {
            status = "❌ MISSING APP ID";
            needsFixing.push(m);
        } else if (appId === 754334795 || appId === 754337104) {
            // Known good/recent IDs
            status = "✅ OK (Recent Deployment)";
        } else {
            status = "⚠️ UNKNOWN/OLD CONTRACT";
            // We might want to refresh these too to be safe
            needsFixing.push(m);
        }

        console.log(`- [${m.asset_symbol}] ${m.title.substring(0, 30)}... : ${status} (ID: ${appId})`);
    }

    if (needsFixing.length > 0) {
        console.log(`\n🛠️  ${needsFixing.length} markets need new smart contracts.`);
        fs.writeFileSync('markets_to_fix.json', JSON.stringify(needsFixing, null, 2));
    } else {
        console.log("\n✨ All markets look configured (or at least have IDs).");
    }
}

checkAllMarkets();
