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

async function runMigration() {
    console.log('Running positions table migration...\n');

    const sql = fs.readFileSync('supabase/migrations/create_positions_table.sql', 'utf-8');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration failed:', error);
            console.log('\nTrying alternative method...\n');

            // Alternative: Run each statement separately
            const statements = sql.split(';').filter(s => s.trim().length > 0);

            for (const statement of statements) {
                const trimmed = statement.trim();
                if (trimmed) {
                    console.log(`Executing: ${trimmed.substring(0, 50)}...`);
                    const result = await supabase.rpc('exec_sql', { sql_query: trimmed + ';' });
                    if (result.error) {
                        console.error('Error:', result.error.message);
                    } else {
                        console.log('✅ Success');
                    }
                }
            }
        } else {
            console.log('✅ Migration completed successfully!');
        }
    } catch (err: any) {
        console.error('Error:', err.message);
    }

    // Verify table was created
    console.log('\n📊 Checking if positions table exists...');
    const { data: tables, error: checkError } = await supabase
        .from('positions' as any)
        .select('*')
        .limit(1);

    if (checkError) {
        console.error('❌ Table does not exist:', checkError.message);
        console.log('\n⚠️  Please run the SQL manually in Supabase dashboard SQL Editor');
    } else {
        console.log('✅ Positions table exists and is accessible!');
    }
}

runMigration();
