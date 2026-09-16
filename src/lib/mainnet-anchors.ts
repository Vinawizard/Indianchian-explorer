/**
 * Mainnet L1-anchor data. On the node host this reads the mainnet app DB directly
 * (MAINNET_APP_DB_URL); anywhere else (Vercel) it falls back to the public read-only
 * JSON the host explorer serves at MAINNET_ANCHORS_URL. Preview is untouched.
 */
// Small in-memory TTL cache instead of next/cache: the on-disk data cache was serving
// stale entries for these fast-changing tables.
const memo = new Map<string, { at: number; v: unknown }>();
async function ttl<T>(key: string, ms: number, fn: () => Promise<T>): Promise<T> {
    const hit = memo.get(key); if (hit && Date.now() - hit.at < ms) return hit.v as T;
    const v = await fn(); memo.set(key, { at: Date.now(), v }); return v;
}

export type AnchorBatch = {
    batch_index: number; merkle_root: string; records_hash: string | null; record_count: number;
    l2_from_block: number | null; l2_to_block: number | null; cardano_tx_hash: string | null;
    cardano_block_number: number | null; cardanoscan_url: string | null; submission_status: string;
    anchor_script_address: string | null; confirmed_at: string | null;
};
export type AnchorLink = { merkle_root: string | null; cardano_tx_hash: string | null; l1_batch_index: number | null };

const DB_URL = process.env.MAINNET_APP_DB_URL;
const PUBLIC_URL = process.env.MAINNET_ANCHORS_URL || "http://139.59.11.86/mainnet-api/anchors";

let pool: import("pg").Pool | null = null;
async function getPool() {
    if (!DB_URL) return null;
    if (!pool) { const { Pool } = await import("pg"); pool = new Pool({ connectionString: DB_URL, max: 3 }); }
    return pool;
}

async function fetchBatches(): Promise<AnchorBatch[]> {
    const p = await getPool();
    if (p) {
        const r = await p.query(`select batch_index, merkle_root, records_hash, record_count, l2_from_block, l2_to_block,
            cardano_tx_hash, cardano_block_number, cardanoscan_url, submission_status, anchor_script_address, confirmed_at
            from l1_merkle_batches order by batch_index desc`);
        return r.rows.map((x: any) => ({ ...x, confirmed_at: x.confirmed_at ? new Date(x.confirmed_at).toISOString() : null }));
    }
    try { const res = await fetch(PUBLIC_URL, { cache: "no-store" }); if (!res.ok) return []; return (await res.json()).batches ?? []; }
    catch { return []; }
}
export function getMainnetAnchorBatches() { return ttl("batches", 20_000, fetchBatches); }

/** record_id:version -> anchor link, for enriching chain-sourced event rows. */
async function fetchLinks(): Promise<Record<string, AnchorLink>> {
    const p = await getPool();
    if (p) {
        const r = await p.query(`select record_id, version, merkle_root, cardano_tx_hash, l1_batch_index from extrinsic_payloads where l1_anchored = true`);
        const out: Record<string, AnchorLink> = {};
        for (const x of r.rows) out[`${x.record_id}:${x.version}`] = { merkle_root: x.merkle_root, cardano_tx_hash: x.cardano_tx_hash, l1_batch_index: x.l1_batch_index };
        return out;
    }
    try { const res = await fetch(PUBLIC_URL + "?links=1", { cache: "no-store" }); if (!res.ok) return {}; return (await res.json()).links ?? {}; }
    catch { return {}; }
}
export function getMainnetAnchorLinks() { return ttl("links", 20_000, fetchLinks); }
export { cardanoscanTx } from "./cardanoscan";
