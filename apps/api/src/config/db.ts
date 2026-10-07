import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './env.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface QueryResult<R = pg.QueryResultRow> {
  rows: R[];
  rowCount: number;
}

export interface DbClient {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>>;
  exec(sql: string): Promise<void>;
  release(): void;
}

export interface DbPool {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>>;
  exec(sql: string): Promise<void>;
  connect(): Promise<DbClient>;
  end(): Promise<void>;
  isPGlite: boolean;
}

let activePool: DbPool | null = null;
let pgliteInstance: PGlite | null = null;
let initPromise: Promise<DbPool> | null = null;
let schemaEnsured = false;

// Real PostgreSQL connection pool
const realPgPool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Suppress unhandled error crashes from idle clients when using PGlite fallback
realPgPool.on('error', (err) => {
  if (activePool?.isPGlite) return;
  console.warn('PostgreSQL pool connection notice:', err.message);
});

let pgliteLock: Promise<void> = Promise.resolve();

async function acquirePGliteLock(): Promise<() => void> {
  let releaseLock: () => void = () => {};
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const currentLock = pgliteLock;
  pgliteLock = pgliteLock.then(() => nextLock);
  await currentLock;
  return releaseLock;
}

/**
 * Robustly instantiates and validates PGlite.
 * If an existing data directory is corrupt (e.g., missing pg_notify from incomplete git checkouts or crashed locks),
 * it purges and re-initializes or falls back to in-memory mode.
 */
async function createPGliteInstance(): Promise<PGlite> {
  const isMemory = process.env.PGLITE_MEMORY === 'true' || ENV.PGLITE_MEMORY === true;
  const configuredDir = process.env.PGLITE_DATA_DIR || ENV.PGLITE_DATA_DIR;
  const defaultDir = path.join(__dirname, '..', '..', '.data', 'pglite');
  const dataDir = isMemory ? undefined : (configuredDir || defaultDir);

  const cleanStalePid = (dir: string) => {
    try {
      const pidPath = path.join(dir, 'postmaster.pid');
      if (fs.existsSync(pidPath)) {
        fs.unlinkSync(pidPath);
      }
    } catch {
      // Ignore pid cleanup errors
    }
  };

  const isCorruptedCluster = (dir: string): boolean => {
    if (!fs.existsSync(dir)) return false;
    const hasVersion = fs.existsSync(path.join(dir, 'PG_VERSION'));
    // In PostgreSQL clusters, if PG_VERSION exists, vital subdirectories like pg_notify must also exist
    const hasNotify = fs.existsSync(path.join(dir, 'pg_notify'));
    return hasVersion && !hasNotify;
  };

  const tryBoot = async (targetDir?: string): Promise<PGlite> => {
    if (targetDir) {
      if (isCorruptedCluster(targetDir)) {
        console.warn(`⚠️  PGlite cluster at "${targetDir}" is incomplete (missing pg_notify). Purging corrupted data...`);
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDir, { recursive: true });
      cleanStalePid(targetDir);
    }
    const inst = new PGlite(targetDir);
    await inst.waitReady;
    return inst;
  };

  if (!dataDir) {
    console.log('📦  Starting In-Memory Embedded PostgreSQL (PGlite)...');
    const inst = await tryBoot(undefined);
    console.log('✅  In-Memory Embedded PostgreSQL initialized successfully.');
    return inst;
  }

  try {
    const inst = await tryBoot(dataDir);
    return inst;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  Failed to start PGlite from disk path "${dataDir}": ${msg}`);
    if (fs.existsSync(dataDir)) {
      console.warn('🔄  Purging corrupted PGlite data directory and re-initializing clean database...');
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        const inst = await tryBoot(dataDir);
        console.log('✅  Fresh on-disk PGlite database initialized successfully.');
        return inst;
      } catch (retryErr: unknown) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        console.warn(`⚠️  Disk re-initialization failed: ${retryMsg}`);
      }
    }

    // Fallback: clean in-memory instance
    console.warn('🔄  Falling back to In-Memory PGlite instance...');
    const memInst = await tryBoot(undefined);
    console.log('✅  In-Memory PGlite instance ready.');
    return memInst;
  }
}

async function createPGlitePool(): Promise<DbPool> {
  if (!pgliteInstance) {
    pgliteInstance = await createPGliteInstance();
  }

  const pglite = pgliteInstance;

  return {
    isPGlite: true,
    async query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
      const res = await pglite.query<R>(text, params);
      return {
        rows: res.rows,
        rowCount: res.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await pglite.exec(sql);
    },
    async connect(): Promise<DbClient> {
      const releaseLock = await acquirePGliteLock();
      let released = false;
      const safeRelease = () => {
        if (!released) {
          released = true;
          releaseLock();
        }
      };

      return {
        async query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
          const res = await pglite.query<R>(text, params);
          return {
            rows: res.rows,
            rowCount: res.rows.length,
          };
        },
        async exec(sql: string): Promise<void> {
          await pglite.exec(sql);
        },
        release() {
          safeRelease();
        },
      };
    },
    async end(): Promise<void> {
      if (pgliteInstance) {
        await pgliteInstance.close();
        pgliteInstance = null;
      }
    },
  };
}

async function ensureSchemaAndSeed(pool: DbPool): Promise<void> {
  if (schemaEnsured) return;
  schemaEnsured = true;

  try {
    const { runMigrations } = await import('../db/migrate.js');
    await runMigrations();

    const res = await pool.query<{ count: string }>(`
      SELECT count(*) as count FROM events;
    `);

    const eventsCount = parseInt(res.rows[0]?.count || '0', 10);

    if (eventsCount === 0 && process.env.NODE_ENV !== 'production') {
      console.log('🌱  Auto-seeding development catalog and demo users...');
      const { seedDatabase } = await import('../db/seed.js');
      await seedDatabase();
    }
  } catch (err: unknown) {
    console.warn('⚠️  Could not auto-apply migrations/seed:', err);
  }
}

async function _doInitDb(): Promise<DbPool> {
  if (activePool) return activePool;

  const forcePGlite = process.env.FORCE_PGLITE === 'true' || ENV.FORCE_PGLITE === true;

  if (forcePGlite) {
    console.log('📦  FORCE_PGLITE requested: Using Embedded PostgreSQL (PGlite)');
    activePool = await createPGlitePool();
    await ensureSchemaAndSeed(activePool);
    return activePool;
  }

  try {
    const client = await realPgPool.connect();
    client.release();
    activePool = {
      isPGlite: false,
      async query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
        const res = await realPgPool.query<R>(text, params);
        return {
          rows: res.rows,
          rowCount: res.rowCount ?? res.rows.length,
        };
      },
      async exec(sql: string): Promise<void> {
        await realPgPool.query(sql);
      },
      async connect(): Promise<DbClient> {
        const c = await realPgPool.connect();
        return {
          async query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
            const res = await c.query<R>(text, params);
            return {
              rows: res.rows,
              rowCount: res.rowCount ?? res.rows.length,
            };
          },
          async exec(sql: string): Promise<void> {
            await c.query(sql);
          },
          release() {
            c.release();
          },
        };
      },
      async end(): Promise<void> {
        await realPgPool.end();
      },
    };
    console.log('🐘  Connected to PostgreSQL at', ENV.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    await ensureSchemaAndSeed(activePool);
    return activePool;
  } catch (_err) {
    console.warn('⚠️  Could not connect to external PostgreSQL server at', ENV.DATABASE_URL);
    console.warn('🔄  Auto-switching to Embedded PostgreSQL (PGlite Engine)...');
    activePool = await createPGlitePool();
    console.log('📦  Initialized Embedded PostgreSQL successfully.');
    await ensureSchemaAndSeed(activePool);
    return activePool;
  }
}

export async function initDb(): Promise<DbPool> {
  if (activePool) return activePool;
  if (initPromise) return initPromise;

  initPromise = _doInitDb().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

export const db: DbPool = {
  get isPGlite() {
    return activePool?.isPGlite ?? true;
  },
  async query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
    const p = await initDb();
    return p.query<R>(text, params);
  },
  async exec(sql: string): Promise<void> {
    const p = await initDb();
    return p.exec(sql);
  },
  async connect(): Promise<DbClient> {
    const p = await initDb();
    return p.connect();
  },
  async end(): Promise<void> {
    if (activePool) {
      await activePool.end();
      activePool = null;
    }
  },
};
