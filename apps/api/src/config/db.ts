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

// Real PostgreSQL connection pool
const realPgPool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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

function createPGlitePool(): DbPool {
  if (!pgliteInstance) {
    const isMemory = process.env.PGLITE_MEMORY === 'true';
    const dataDir = isMemory ? undefined : path.join(__dirname, '..', '..', '.data', 'pglite');
    if (dataDir && !fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
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

export async function initDb(): Promise<DbPool> {
  if (activePool) return activePool;

  if (process.env.FORCE_PGLITE === 'true') {
    activePool = createPGlitePool();
    console.log('📦  Using Embedded PostgreSQL 16 (PGlite Engine)');
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
    return activePool;
  } catch (_err) {
    console.warn('⚠️  Could not connect to external PostgreSQL server at', ENV.DATABASE_URL);
    console.warn('🔄  Auto-switching to Embedded PostgreSQL 16 (PGlite Engine)...');
    activePool = createPGlitePool();
    console.log('📦  Initialized Embedded PostgreSQL 16 successfully.');
    return activePool;
  }
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
