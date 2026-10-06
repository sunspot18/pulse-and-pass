import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<number> {
  console.log('🚀  Running Pulse & Pass SQL Migration Runner...');
  await initDb();

  const client = await db.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch applied migrations
    const { rows: appliedRows } = await client.query<{ name: string }>(
      'SELECT name FROM _migrations ORDER BY id ASC;',
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Read migration directory
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found at', migrationsDir);
      return 0;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩  Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`⏳  Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.exec(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`✅  Successfully applied migration: ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`❌  Failed to apply migration ${file}:`, migrationErr);
        throw migrationErr;
      }
    }

    console.log(`\n🎉  Migration run completed. ${appliedCount} new migrations applied.\n`);
    return appliedCount;
  } finally {
    client.release();
  }
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
