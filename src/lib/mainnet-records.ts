/**
 * Mainnet event records for the explorer.
 *
 * - Headline totals come from the CHAIN itself: the pallet's own `indianchain.totalRecords`
 *   counter (one storage read, ~13 ms).
 * - Row data (events list, record pages, charts) comes from the mainnet app database, one
 *   page at a time through indexed queries. That database is the ledger the oracle writes
 *   back to only after each extrinsic is FINALIZED, and ops/verify-and-export.js re-checks
 *   every row against the live chain (payload hash, both timestamps, submitter, block hash,
 *   tx hash and position).
 *
 * Why not walk chain storage any more: at 500k+ records a full walk takes minutes, and
 * holding every row (plus a 514k-key anchor map) in memory grew the server to its 4 GB heap
 * limit and crashed it on 22 Sep. Paged queries keep memory flat whatever the record count.
 *
 * Rows keep EXACTLY the shape (and ordering) the chain-sourced version produced, so the
 * events UI and remote copies need no change. Preview is untouched (Supabase). Remote
 * copies (Vercel, no MAINNET_APP_DB_URL) ask the host's /mainnet-api/records endpoint,
 * whose request and response format is unchanged.
 */
import { buildChartSeries } from "@/lib/chart-series";
import { getApi } from "./polkadot";
import { getPool } from "./mainnet-anchors";
import { hostApi } from "./host-api";

/** Shape mirrors the Supabase `event_payload_data` columns the events UI selects. */
export type MainnetRecordRow = {
    payload_id: string;
    block_number: number;
    submission_status: string;
    chain: string;
    record_type: string;
    type: string | null;
    tx_hash: string | null;
    block_hash: string | null;
    signer_address: string | null;
    tx_fee: number | null;
    tx_index: number | null;
    timestamp: string | null;
    confirmed_at: string | null;
    entity_id: string | null;
    farmer_id: string | null;
    record_id: string | null;
    version: number | null;
    payload_hash: string | null;
    merkle_root: string | null;
    cardano_tx_hash: string | null;
    /** Cardano anchor batch this version is sealed in (null until anchored). */
    batch_index?: number | null;
    /** The record this version hangs off (agri -> farmer, credit -> first linked agri). */
    parent_record_id?: string | null;
};

const IS_HOST = !!process.env.MAINNET_APP_DB_URL;

/** record_type -> the `type` label Preview uses for the same data (unchanged mapping). */
const TYPE_OF: Record<string, string> = {
    farmer: "farmer_registration",
    agri_record: "agri_record",
    credit_app: "credit_app",
    generic_record: "generic_record",
};
const RECORD_TYPES = Object.keys(TYPE_OF);

const iso = (d: unknown): string | null => (d == null ? null : new Date(d as string).toISOString());
const with0x = (h: unknown): string | null => (h == null ? null : String(h).startsWith("0x") ? String(h) : "0x" + String(h));

/** Race a promise against a deadline so a stalled chain/DB call can never hang a page. */
function within<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
    let t: ReturnType<typeof setTimeout>;
    return Promise.race([
        p.finally(() => clearTimeout(t)),
        new Promise<T>((_, reject) => { t = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms); }),
    ]);
}

const ROW_COLS = `record_id, version, record_type, type, block_number, block_hash, tx_hash, tx_index, tx_fee,
    signer_address, timestamp, chain_timestamp, farmer_id, payload_hash, merkle_root, cardano_tx_hash, l1_anchored,
    l1_batch_index, parent_id`;

/** DB row -> the exact row the chain-sourced explorer produced. */
function toRow(x: any): MainnetRecordRow {
    const anchored = !!x.l1_anchored;
    return {
        payload_id: `${x.record_id}_${x.version}`,
        block_number: Number(x.block_number),
        submission_status: anchored && x.cardano_tx_hash ? "anchored" : "confirmed",
        chain: "indianchain",
        record_type: x.record_type,
        type: TYPE_OF[x.record_type] ?? x.type ?? null,
        tx_hash: x.tx_hash ?? null,
        block_hash: x.block_hash ?? null,
        signer_address: x.signer_address ?? null,
        tx_fee: x.tx_fee == null ? null : Number(x.tx_fee),
        tx_index: x.tx_index == null ? null : Number(x.tx_index),
        timestamp: iso(x.timestamp),
        confirmed_at: iso(x.chain_timestamp),        // block time of inclusion, as before
        entity_id: x.record_id,
        farmer_id: x.farmer_id ?? (x.record_type === "farmer" ? x.record_id : null),
        record_id: x.record_id,
        version: x.version == null ? null : Number(x.version),
        merkle_root: anchored ? x.merkle_root ?? null : null,
        cardano_tx_hash: anchored ? x.cardano_tx_hash ?? null : null,
        payload_hash: with0x(x.payload_hash),        // ledger stores bare hex; chain JSON had 0x
        batch_index: anchored && x.l1_batch_index != null ? Number(x.l1_batch_index) : null,
        parent_record_id: x.parent_id ?? null,
    };
}

/** Filters the events page and the API share, so host and remote copies behave the same. */
export type RecordQuery = {
    status?: string; record_type?: string;
    minBlock?: number | null; maxBlock?: number | null;
    find?: string;            // block number, payload_id, tx hash or record_id
    farmer?: string;          // every record of one farmer (the farmer's versions and its agri / credit records)
    batch?: number | null;    // the records sealed in one Cardano anchor batch
    before?: string;          // keyset cursor "block:record_id:version": rows strictly after it in list order
    noCount?: boolean;        // skip the total (unfiltered lists use the chain counter instead)
    limit?: number;           // rows returned (newest first); total is always the full match count
};
export const DEFAULT_ROW_LIMIT = 2000;
const MAX_ROW_LIMIT = 10_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * WHERE clause for a query. Every predicate is served by an index:
 * idx_extrinsic_confirmed_block (block_number DESC, record_id) INCLUDE (record_type,
 * l1_anchored) WHERE CONFIRMED, idx_extrinsic_tx_hash, the (record_type, record_id,
 * version) unique key and the payload_id primary key. Returns null when nothing can match.
 */
function buildWhere(q: RecordQuery): { sql: string; args: unknown[] } | null {
    const parts = ["submission_status = 'CONFIRMED'"];
    const args: unknown[] = [];
    const arg = (v: unknown) => { args.push(v); return `$${args.length}`; };

    const status = q.status?.toLowerCase();
    if (status) {
        // "anchored" = its batch is on Cardano. The anchor write-back sets l1_anchored and
        // cardano_tx_hash in the same statement, so the flag alone is exact.
        if (status === "anchored") parts.push("l1_anchored");
        else if (status === "confirmed") parts.push("not l1_anchored");
        else return null;                     // no mainnet record has any other status
    }
    const rt = q.record_type?.toLowerCase();
    if (rt) parts.push(`record_type = ${arg(rt)}`);
    if (q.minBlock != null) parts.push(`block_number >= ${arg(q.minBlock)}`);
    if (q.maxBlock != null) parts.push(`block_number <= ${arg(q.maxBlock)}`);
    const farmer = q.farmer?.trim().toLowerCase();
    if (farmer) {
        if (!UUID.test(farmer)) return null;
        // farmer rows carry their own id in farmer_id too; idx_payload_farmer serves both
        parts.push(`(farmer_id = ${arg(farmer)} or (record_type = 'farmer' and record_id = ${arg(farmer)}))`);
    }
    if (q.batch != null) {
        if (!Number.isInteger(q.batch) || q.batch < 0) return null;
        parts.push(`payload_id in (select payload_id from l1_anchor_queue where batch_index = ${arg(q.batch)})`);
    }
    if (q.before) {
        const m = q.before.match(/^(\d+):([0-9a-f-]{36}):(\d+)$/);
        if (!m) return null;
        const b = arg(Number(m[1])), r = arg(m[2]), v = arg(Number(m[3]));
        parts.push(`(block_number < ${b} or (block_number = ${b} and (record_id > ${r} or (record_id = ${r} and version > ${v}))))`);
    }

    const find = q.find?.trim().toLowerCase();
    if (find) {
        const composite = find.match(/^([0-9a-f-]{36})_(\d+)$/);   // the explorer's own payload_id form
        if (/^\d+$/.test(find)) parts.push(`block_number = ${arg(Number(find))}`);
        else if (/^0x[0-9a-f]{64}$/.test(find)) parts.push(`tx_hash = ${arg(find)}`);
        else if (composite && UUID.test(composite[1]))
            parts.push(`record_type = any(${arg(RECORD_TYPES)}) and record_id = ${arg(composite[1])} and version = ${arg(Number(composite[2]))}`);
        else if (UUID.test(find))
            parts.push(`((record_type = any(${arg(RECORD_TYPES)}) and record_id = ${arg(find)}) or payload_id = ${arg(find)}::uuid)`);
        else return null;
    }
    return { sql: parts.join(" and "), args };
}

function queryString(q: RecordQuery): string {
    const p = new URLSearchParams();
    if (q.status) p.set("status", q.status);
    if (q.record_type) p.set("record_type", q.record_type);
    if (q.minBlock != null) p.set("start", String(q.minBlock));
    if (q.maxBlock != null) p.set("end", String(q.maxBlock));
    if (q.find) p.set("find", q.find);
    if (q.farmer) p.set("farmer", q.farmer);
    if (q.batch != null) p.set("batch", String(q.batch));
    if (q.before) p.set("before", q.before);
    if (q.noCount) p.set("nocount", "1");
    p.set("limit", String(q.limit ?? DEFAULT_ROW_LIMIT));
    return p.toString();
}

const REMOTE_ROWS_URL = hostApi("records", process.env.MAINNET_RECORDS_URL);
const REMOTE_TIMEOUT_MS = 25_000;

// Process-wide state (Next.js bundles this module once per route; globalThis is shared).
type SharedState = {
    summary: { at: number; v: MainnetSummary } | null;
    chart: { at: number; v: ReturnType<typeof buildChartSeries> } | null;
    daily: { at: number; v: DailyTypes[] } | null;
    refreshing: Promise<void> | null;
    timer: ReturnType<typeof setInterval> | null;
    lastGood: Map<string, { rows: MainnetRecordRow[]; total: number }>;
    remoteSummary: { at: number; v: MainnetSummary } | null;
};
const S: SharedState = ((globalThis as unknown as { __icMainnetDb?: SharedState }).__icMainnetDb ??= {
    summary: null, chart: null, daily: null, refreshing: null, timer: null, lastGood: new Map(), remoteSummary: null,
});

/**
 * Rows matching a query, newest block first (then record_id — the chain-sourced order),
 * capped at `limit`, plus the full match count. Host: indexed SQL. Remote copies: ask the host.
 */
export async function queryMainnetRecords(q: RecordQuery): Promise<{ rows: MainnetRecordRow[]; total: number }> {
    const limit = Math.max(1, Math.min(q.limit ?? DEFAULT_ROW_LIMIT, MAX_ROW_LIMIT));
    if (IS_HOST) {
        const w = buildWhere(q);
        if (!w) return { rows: [], total: 0 };
        const key = `${w.sql}|${JSON.stringify(w.args)}|${limit}`;
        try {
            const pool = (await getPool())!;
            const [rows, count] = await Promise.all([
                pool.query(`select ${ROW_COLS} from extrinsic_payloads where ${w.sql}
                            order by block_number desc, record_id, version limit ${limit}`, w.args),
                q.noCount ? Promise.resolve(null)
                    : pool.query(`select count(*)::bigint as n from extrinsic_payloads where ${w.sql}`, w.args),
            ]);
            const out = { rows: rows.rows.map(toRow), total: count ? Number(count.rows[0].n) : -1 };
            if (S.lastGood.size > 200) S.lastGood.clear();
            S.lastGood.set(key, out);
            return out;
        } catch (e) {
            console.error("[mainnet-records] query failed:", (e as Error)?.message ?? e);
            const stale = S.lastGood.get(key);
            if (stale) return stale;             // last good answer beats an error page
            throw e;
        }
    }
    try {
        const res = await fetch(`${REMOTE_ROWS_URL}?${queryString({ ...q, limit })}`, { cache: "no-store", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
        if (!res.ok) return { rows: [], total: 0 };
        const j = await res.json();
        return { rows: (j.rows ?? []) as MainnetRecordRow[], total: Number(j.total ?? (j.rows?.length ?? 0)) };
    } catch { return { rows: [], total: 0 }; }
}

/** Single record for the detail page: accepts a block number, payload_id, record_id or tx hash. */
export async function findMainnetRecord(needle: string): Promise<MainnetRecordRow | null> {
    const { rows } = await queryMainnetRecords({ find: needle, limit: 1 });
    return rows[0] ?? null;
}

/** The chain's own record counter — the headline number, straight from IndianChain. */
export async function chainTotalRecords(): Promise<number | null> {
    try {
        const api = await within(getApi("mainnet"), 8_000, "mainnet RPC connect");
        const counter = (api.query as unknown as Record<string, Record<string, (() => Promise<{ toString(): string }>) | undefined> | undefined>).indianchain?.totalRecords;
        if (!counter) return null;
        const n = Number((await within(counter(), 5_000, "totalRecords read")).toString());
        return Number.isFinite(n) && n > 0 ? n : null;
    } catch (e) {
        console.error("[mainnet-records] chain counter unavailable:", (e as Error)?.message ?? e);
        return null;
    }
}

/** Home-page numbers + chart series, computed on the host (a few KB) and served to everyone. */
export type DailyTypes = { day: string; farmer: number; agri_record: number; credit_app: number };
export type MainnetSummary = {
    totalEvents: number; totalBlocks: number; anchored: number; fallbackLatestBlock: number;
    /** Confirmed rows in the ledger (the anchored share is measured against this, not the chain counter). */
    ledgerTotal?: number;
    byType?: { farmer: number; agri_record: number; credit_app: number };
    /** Records finalized per UTC day and type, the last 31 days (zeros filled), oldest first. */
    daily?: DailyTypes[];
    transactionChartData: ReturnType<typeof buildChartSeries>["transactionChartData"];
    distributionChartData: ReturnType<typeof buildChartSeries>["distributionChartData"];
};
function emptySummary(): MainnetSummary {
    return { totalEvents: 0, totalBlocks: 0, anchored: 0, fallbackLatestBlock: 0, transactionChartData: [], distributionChartData: [] };
}

const SUMMARY_EVERY_MS = 15_000;       // background refresh — visitors never wait for it
const CHART_EVERY_MS = 600_000;        // per-day series: ~2 s of index reads, refreshed every 10 min in the background

async function refreshSummary(): Promise<void> {
    if (S.refreshing) return S.refreshing;
    S.refreshing = (async () => {
        try {
            const pool = (await getPool())!;
            const needChart = !S.daily || Date.now() - S.daily.at > CHART_EVERY_MS;
            const [counts, chainTotal, chartRows] = await Promise.all([
                pool.query(`select count(*)::bigint as total,
                                   count(*) filter (where l1_anchored)::bigint as anchored,
                                   count(distinct block_number)::bigint as blocks,
                                   max(block_number)::bigint as latest,
                                   count(*) filter (where record_type = 'farmer')::bigint as farmer,
                                   count(*) filter (where record_type = 'agri_record')::bigint as agri,
                                   count(*) filter (where record_type = 'credit_app')::bigint as credit
                              from extrinsic_payloads where submission_status = 'CONFIRMED'`),
                chainTotalRecords(),
                needChart
                    // Records finalized per UTC day and type over the last 31 days. The day comes from
                    // the block number (6 s slots, 100% production) counted back from the newest row's
                    // block time, so the scan stays on idx_extrinsic_confirmed_block.
                    ? pool.query(`with ref as (select block_number b, chain_timestamp t from extrinsic_payloads
                                                where submission_status = 'CONFIRMED' order by block_number desc limit 1)
                                  select to_char(((select t from ref) - ((select b from ref) - e.block_number) * interval '6 seconds') at time zone 'UTC', 'YYYY-MM-DD') as day,
                                         e.record_type, count(*)::int as n
                                    from extrinsic_payloads e
                                   where e.submission_status = 'CONFIRMED' and e.block_number > (select b from ref) - 14400 * 32
                                   group by 1, 2`)
                    : Promise.resolve(null),
            ]);
            if (chartRows) {
                const byDay = new Map<string, DailyTypes>();
                const today = new Date();
                for (let i = 30; i >= 0; i--) {
                    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)).toISOString().slice(0, 10);
                    byDay.set(d, { day: d, farmer: 0, agri_record: 0, credit_app: 0 });
                }
                for (const r of chartRows.rows as { day: string; record_type: string; n: number }[]) {
                    const slot = byDay.get(r.day);
                    if (slot && (r.record_type === "farmer" || r.record_type === "agri_record" || r.record_type === "credit_app")) slot[r.record_type] += Number(r.n);
                }
                S.daily = { at: Date.now(), v: [...byDay.values()] };
            }
            const c = counts.rows[0];
            const v: MainnetSummary = {
                totalEvents: chainTotal ?? Number(c.total),     // chain counter first; ledger count if RPC is down
                totalBlocks: Number(c.blocks),
                anchored: Number(c.anchored),
                fallbackLatestBlock: Number(c.latest ?? 0),
                ledgerTotal: Number(c.total),
                byType: { farmer: Number(c.farmer), agri_record: Number(c.agri), credit_app: Number(c.credit) },
                transactionChartData: S.chart?.v.transactionChartData ?? [],
                distributionChartData: S.chart?.v.distributionChartData ?? [],
                daily: S.daily?.v ?? [],
            };
            if (v.totalEvents > 0) S.summary = { at: Date.now(), v };   // never replace good data with zeros
        } catch (e) {
            console.error("[mainnet-records] summary refresh failed:", (e as Error)?.message ?? e);
        } finally {
            S.refreshing = null;
        }
    })();
    return S.refreshing;
}

function startBackgroundRefresh() {
    if (!IS_HOST || S.timer) return;
    S.timer = setInterval(() => { void refreshSummary(); }, SUMMARY_EVERY_MS);
    S.timer.unref?.();
}

export async function getMainnetSummary(): Promise<MainnetSummary> {
    if (IS_HOST) {
        startBackgroundRefresh();
        if (!S.summary) await refreshSummary();        // only the very first request after a start
        return S.summary?.v ?? emptySummary();
    }
    if (S.remoteSummary && Date.now() - S.remoteSummary.at < 20_000) return S.remoteSummary.v;
    try {
        const res = await fetch(`${REMOTE_ROWS_URL}?summary=1`, { cache: "no-store", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
        if (!res.ok) throw new Error(`summary ${res.status}`);
        const v = (await res.json()) as MainnetSummary;
        if (v.totalEvents > 0) S.remoteSummary = { at: Date.now(), v };
        return v;
    } catch (e) {
        console.error("mainnet summary fetch failed:", (e as Error)?.message ?? e);
        return S.remoteSummary?.v ?? emptySummary();    // stale beats zeros on a production page
    }
}
