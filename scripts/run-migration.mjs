import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
let dbUrl = '';
for (const line of envContent.split(/\r?\n/)) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/["']/g, '').trim();
    break;
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  console.log('Connecting to Neon Lakebase Postgres...');
  const sqlFile = path.join(process.cwd(), 'scripts/init-neon-db.sql');
  const sqlText = fs.readFileSync(sqlFile, 'utf-8');

  try {
    const client = await pool.connect();
    await client.query(sqlText);
    console.log('✅ Schema migration executed successfully on Neon Lakebase Postgres!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Public tables in Neon DB:', res.rows.map(r => r.table_name));

    const membersRes = await client.query('SELECT count(*) FROM members');
    console.log('Members count:', membersRes.rows[0].count);

    const taskTypesRes = await client.query('SELECT count(*) FROM task_types');
    console.log('Task types count:', taskTypesRes.rows[0].count);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
