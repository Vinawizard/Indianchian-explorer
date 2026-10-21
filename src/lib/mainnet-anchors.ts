/**
 * Mainnet app database (L1-anchor data + the records ledger). On the node host this reads
 * the mainnet app DB directly (MAINNET_APP_DB_URL); anywhere else (Vercel) there is no
 * database access and callers use the host's public read-only endpoints instead.
 * Preview is untouched.
 */
// Small in-memory TTL cache instead of next/cache: the on-disk data cache was serving
// stale entries for these fast-changing tables.
// shared across route bundles (see mainnet-records.ts)
const memo: Map<string, { at: number; v: unknown }> = ((globalThis as unknown as { __icAnchorMemo?: Map<string, { at: number; v: unknown }> }).__icAnchorMemo ??= new Map());
async function ttl<T>(key: string, ms: number, fn: () => Promise<T>): Promise<T> {
    const hit = memo.get(key); if (hit && Date.now() - hit.at < ms) return hit.v as T;
    const v = await fn(); memo.set(key, { at: Date.now(), v }); return v;
}

export type AnchorBatch = {
    batch_index: number; merkle_root: string; records_hash: string | null; record_count: number;
    l2_from_block: number | null; l2_to_block: number | null; cardano_tx_hash: string | null;
    cardano_block_number: number | null; cardanoscan_url: string | null; submission_status: string;
    anchor_script_address: string | null; metadata_version: number; manifest_hash: string | null;
    manifest_schema: string | null; confirmed_at: string | null;
};

const DB_URL = process.env.MAINNET_APP_DB_URL;
const PUBLIC_URL = process.env.MAINNET_ANCHORS_URL || "http://139.59.11.86/mainnet-api/anchors";

/**
 * One pool per process (globalThis: Next.js bundles this module once per route, and a
 * pool per bundle would multiply connections). Every connection is READ-ONLY at the
 * server — the explorer cannot modify the ledger even by mistake — and every query is
 * bounded, so a slow database can never hang a page.
 */
type PoolState = { pool: import("pg").Pool | null };
const PS: PoolState = ((globalThis as unknown as { __icPgPool?: PoolState }).__icPgPool ??= { pool: null });
export async function getPool(): Promise<import("pg").Pool | null> {
    if (!DB_URL) return null;
    if (!PS.pool) {
        const { Pool } = await import("pg");
        PS.pool = new Pool({
            connectionString: DB_URL,
            max: 5,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            statement_timeout: 15_000,
            query_timeout: 20_000,
            application_name: "indianchain-explorer",
            options: "-c default_transaction_read_only=on",
        });
        PS.pool.on("error", (e) => console.error("[mainnet-db] idle client error:", e.message));
    }
    return PS.pool;
}

async function fetchBatches(): Promise<AnchorBatch[]> {
    const p = await getPool();
    if (p) {
        const r = await p.query(`select batch_index, merkle_root, records_hash, record_count, l2_from_block, l2_to_block,
            cardano_tx_hash, cardano_block_number, cardanoscan_url, submission_status, anchor_script_address,
            metadata_version, manifest_hash, manifest_schema, confirmed_at
            from l1_merkle_batches order by batch_index desc`);
        return r.rows.map((x: any) => ({ ...x, confirmed_at: x.confirmed_at ? new Date(x.confirmed_at).toISOString() : null }));
    }
    try { const res = await fetch(PUBLIC_URL, { cache: "no-store" }); if (!res.ok) return []; return (await res.json()).batches ?? []; }
    catch { return []; }
}
export function getMainnetAnchorBatches() { return ttl("batches", 20_000, fetchBatches); }

export { cardanoscanTx } from "./cardanoscan";

/* ---------- explorer views over the anchor batches (host: cached table; remote: host endpoint) ---------- */

const REMOTE_BASE = (process.env.MAINNET_ANCHORS_URL || "http://139.59.11.86/mainnet-api/anchors").replace(/\/$/, "");

async function remote<T>(qs: string, fallback: T): Promise<T> {
    try {
        const res = await fetch(`${REMOTE_BASE}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
        if (!res.ok) return fallback;
        return (await res.json()) as T;
    } catch { return fallback; }
}

/** Newest first, `limit` per page; `before` = show batches with a lower index. */
export async function listAnchors(limit = 25, before?: number | null): Promise<{ batches: AnchorBatch[]; total: number }> {
    if (!DB_URL) return remote(`limit=${limit}${before != null ? `&before=${before}` : ""}`, { batches: [], total: 0 });
    const all = await getMainnetAnchorBatches();
    const start = before != null ? all.findIndex((b) => b.batch_index < before) : 0;
    return { batches: start < 0 ? [] : all.slice(start, start + limit), total: all.length };
}

export async function getAnchor(index: number): Promise<AnchorBatch | null> {
    if (!DB_URL) return (await remote<{ batch: AnchorBatch | null }>(`index=${index}`, { batch: null })).batch;
    return (await getMainnetAnchorBatches()).find((b) => b.batch_index === index) ?? null;
}

export async function findAnchorByTx(tx: string): Promise<AnchorBatch | null> {
    const t = tx.toLowerCase().replace(/^0x/, "");
    if (!DB_URL) return (await remote<{ batch: AnchorBatch | null }>(`tx=${t}`, { batch: null })).batch;
    return (await getMainnetAnchorBatches()).find((b) => (b.cardano_tx_hash ?? "").toLowerCase() === t) ?? null;
}

export type AnchorDay = { day: string; anchors: number; records: number };

/** Records sealed on Cardano per UTC day, the last `days` days ending today (zeros included). */
export async function anchorsPerDay(days = 14): Promise<AnchorDay[]> {
    if (!DB_URL) return (await remote<{ days: AnchorDay[] }>(`daily=${days}`, { days: [] })).days;
    const all = await getMainnetAnchorBatches();
    const out = new Map<string, AnchorDay>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)).toISOString().slice(0, 10);
        out.set(d, { day: d, anchors: 0, records: 0 });
    }
    for (const b of all) {
        if (!b.confirmed_at) continue;
        const slot = out.get(b.confirmed_at.slice(0, 10));
        if (slot) { slot.anchors += 1; slot.records += Number(b.record_count) || 0; }
    }
    return [...out.values()];
}
