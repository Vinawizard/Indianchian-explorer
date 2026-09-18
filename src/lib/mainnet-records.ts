/**
 * Mainnet event records, read DIRECTLY from the IndianChain node.
 *
 * Preview events come from Supabase (`event_payload_data`) and are untouched by
 * this module. Mainnet has no Supabase mirror, so every row here is derived from
 * chain state + block data and shaped to match the Supabase row exactly, which
 * lets the existing events UI render both networks with the same components.
 *
 * Cost per refresh is small and bounded:
 *   - 1 storage `.entries()` call per record type (all records at once)
 *   - ~17 RPC calls to binary-search a block number per DISTINCT chain timestamp
 *   - 2 calls per distinct block to attach tx hash / index / fee
 * Blocks are immutable, so both caches are permanent for the process lifetime.
 */
import fs from "node:fs";
import path from "node:path";
import { buildChartSeries } from "@/lib/chart-series";
import { getApi } from "./polkadot";
import { getMainnetAnchorLinks } from "./mainnet-anchors";

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
};

/** Pallet storage map -> the record_type/type values Preview uses for the same data. */
const STORAGES: { key: string; record_type: string; type: string }[] = [
    { key: "farmers", record_type: "farmer", type: "farmer_registration" },
    { key: "agriculturalRecords", record_type: "agri_record", type: "agri_record" },
    { key: "creditApplications", record_type: "credit_app", type: "credit_app" },
    { key: "genericRecords", record_type: "generic_record", type: "generic_record" },
];

/** `0xab6ceec7e10e…` (16 bytes) -> `ab6ceec7-e10e-…` so IDs match the operational DB. */
function hexToUuid(hex: string): string {
    const h = String(hex).replace(/^0x/, "");
    if (h.length !== 32) return h;
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const isoOrNull = (ms: unknown): string | null => {
    const n = Number(ms);
    return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null;
};

type BlockFacts = {
    block_number: number;
    block_hash: string;
    /** `${entityUuid}:${version}` -> extrinsic facts */
    byEntity: Map<string, { tx_hash: string; tx_index: number; tx_fee: number | null }>;
};

// One process-wide state object: Next.js bundles this module once per route (API route,
// pages…), so plain module variables would give every route its own cache and its own
// full rebuild. globalThis is shared by all of them.
type SharedState = {
    blockByTimestamp: Map<number, number>;
    factsByBlock: Map<number, BlockFacts>;
    blockCacheSavedSize: number;
    genesisTs: number | null;
    scannedThrough: number;
    rowsMemo: { at: number; v: MainnetRecordRow[] } | null;
    rowsBuild: Promise<MainnetRecordRow[]> | null;
    summaryMemo: { at: number; v: MainnetSummary } | null;
    fullBuiltAt: number;
};
const S: SharedState = ((globalThis as unknown as { __icMainnetRecords?: SharedState }).__icMainnetRecords ??= {
    blockByTimestamp: new Map(), factsByBlock: new Map(), blockCacheSavedSize: -1, genesisTs: null,
    scannedThrough: 0, rowsMemo: null, rowsBuild: null, summaryMemo: null, fullBuiltAt: 0,
});
// Blocks are immutable once finalized, so these never need invalidating.
const blockByTimestamp = S.blockByTimestamp;
const factsByBlock = S.factsByBlock;

// …and therefore safe to persist: a restart must not re-walk every block (minutes at 100k+ records).
const BLOCK_CACHE_FILE = path.join(process.cwd(), "data", "mainnet-block-cache.json");
(function loadBlockCache() {
    if (S.blockCacheSavedSize >= 0 || factsByBlock.size) return;   // another route bundle loaded it already
    try {
        const j = JSON.parse(fs.readFileSync(BLOCK_CACHE_FILE, "utf8"));
        for (const [ts, b] of j.blockByTimestamp ?? []) blockByTimestamp.set(Number(ts), Number(b));
        for (const f of j.facts ?? []) factsByBlock.set(f.block_number, { block_number: f.block_number, block_hash: f.block_hash, byEntity: new Map(f.byEntity) });
        S.blockCacheSavedSize = factsByBlock.size;
    } catch { /* first run: nothing cached yet */ }
})();
function saveBlockCache() {
    if (factsByBlock.size === S.blockCacheSavedSize) return;
    try {
        fs.mkdirSync(path.dirname(BLOCK_CACHE_FILE), { recursive: true });
        const tmp = BLOCK_CACHE_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify({
            blockByTimestamp: [...blockByTimestamp],
            facts: [...factsByBlock.values()].map((f) => ({ block_number: f.block_number, block_hash: f.block_hash, byEntity: [...f.byEntity] })),
        }));
        fs.renameSync(tmp, BLOCK_CACHE_FILE);
        S.blockCacheSavedSize = factsByBlock.size;
    } catch (e) { console.error("mainnet block cache not saved:", e); }
}

const SLOT_MS = 6000;

async function timestampAt(
    api: Awaited<ReturnType<typeof getApi>>,
    blockNumber: number
): Promise<number> {
    const hash = await api.rpc.chain.getBlockHash(blockNumber);
    const at = await api.at(hash);
    return Number((await at.query.timestamp.now()).toString());
}

/**
 * Block number for a record's chain timestamp.
 *
 * Aura slots are a fixed 6s, so `block = 1 + (ts - genesisTs) / 6000` is exact on a
 * chain with no missed slots — ONE cached RPC call instead of ~17 sequential ones.
 * That difference matters when this runs on a serverless host far from the node.
 * The result is always checked against the real block, and any mismatch (a missed
 * slot would shift every later block) falls back to a binary search.
 */
async function resolveBlockByTimestamp(
    api: Awaited<ReturnType<typeof getApi>>,
    targetMs: number
): Promise<number> {
    const cached = blockByTimestamp.get(targetMs);
    if (cached !== undefined) return cached;

    if (S.genesisTs === null) S.genesisTs = await timestampAt(api, 1);

    const head = (await api.rpc.chain.getHeader()).number.toNumber();
    const guess = Math.min(Math.max(1 + Math.floor((targetMs - S.genesisTs) / SLOT_MS), 1), head);

    let best: number;
    const guessTs = await timestampAt(api, guess);
    if (guessTs <= targetMs && (guess === head || (await timestampAt(api, guess + 1)) > targetMs)) {
        best = guess; // arithmetic held
    } else {
        // Missed slots somewhere — fall back to an exact search.
        let lo = 1;
        let hi = head;
        best = 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const ts = await timestampAt(api, mid);
            if (ts <= targetMs) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
    }

    blockByTimestamp.set(targetMs, best);
    return best;
}

/**
 * Attach tx hash / index / fee by decoding the block's `indianchain` extrinsics.
 * Args are located by metadata NAME (not position) so this holds for all four
 * submit_* calls even though their signatures differ.
 */
async function getBlockFacts(
    api: Awaited<ReturnType<typeof getApi>>,
    blockNumber: number
): Promise<BlockFacts> {
    const cached = factsByBlock.get(blockNumber);
    if (cached) return cached;

    const hash = await api.rpc.chain.getBlockHash(blockNumber);
    const [block, at] = await Promise.all([api.rpc.chain.getBlock(hash), api.at(hash)]);
    const events = await at.query.system.events();

    const facts: BlockFacts = {
        block_number: blockNumber,
        block_hash: hash.toHex(),
        byEntity: new Map(),
    };

    block.block.extrinsics.forEach((ext, index) => {
        if (ext.method.section !== "indianchain") return;

        let entityHex: string | null = null;
        let version: string | null = null;
        ext.method.meta.args.forEach((meta, i) => {
            const name = meta.name.toString();
            const value = ext.method.args[i];
            if (entityHex === null && /Id$/.test(name) && meta.type.toString() === "[u8;16]") {
                entityHex = value.toHex();
            }
            if (name === "version") version = value.toString();
        });
        if (entityHex === null || version === null) return;

        // actual_fee for THIS extrinsic only
        let fee: number | null = null;
        for (const record of events as unknown as {
            phase: { isApplyExtrinsic: boolean; asApplyExtrinsic: { eq: (n: number) => boolean } };
            event: { section: string; method: string; data: unknown[] };
        }[]) {
            if (!record.phase.isApplyExtrinsic || !record.phase.asApplyExtrinsic.eq(index)) continue;
            if (record.event.section === "transactionPayment" && record.event.method === "TransactionFeePaid") {
                const parsed = Number(String(record.event.data[1]).replace(/,/g, ""));
                if (Number.isFinite(parsed)) fee = parsed;
            }
        }

        facts.byEntity.set(`${hexToUuid(entityHex)}:${version}`, {
            tx_hash: ext.hash.toHex(),
            tx_index: index,
            tx_fee: fee,
        });
    });

    factsByBlock.set(blockNumber, facts);
    return facts;
}

/** Finalized head at the last build: blocks up to here are reflected in S.rowsMemo. */
async function finalizedHead(api: Awaited<ReturnType<typeof getApi>>): Promise<number> {
    const h = await api.rpc.chain.getFinalizedHead();
    return (await api.rpc.chain.getHeader(h)).number.toNumber();
}
function rawToRow(r: RawRecord, blockNumber: number, f: BlockFacts | undefined, links: Awaited<ReturnType<typeof getMainnetAnchorLinks>>): MainnetRecordRow {
    const tx = f?.byEntity.get(`${r.entityUuid}:${r.version}`) ?? null;
    const link = links[`${r.entityUuid}:${r.version}`];
    return {
        payload_id: `${r.entityUuid}_${r.version}`,
        block_number: blockNumber,
        submission_status: link?.cardano_tx_hash ? "anchored" : "confirmed",
        chain: "indianchain",
        record_type: r.record_type,
        type: r.type,
        tx_hash: tx?.tx_hash ?? null,
        block_hash: f?.block_hash ?? null,
        signer_address: r.submitter,
        tx_fee: tx?.tx_fee ?? null,
        tx_index: tx?.tx_index ?? null,
        timestamp: isoOrNull(r.eventTimestamp),
        confirmed_at: isoOrNull(r.chainTimestamp),
        entity_id: r.entityUuid,
        farmer_id: r.farmerUuid ?? (r.record_type === "farmer" ? r.entityUuid : null),
        record_id: r.entityUuid,
        version: r.version,
        merkle_root: link?.merkle_root ?? null,
        cardano_tx_hash: link?.cardano_tx_hash ?? null,
        payload_hash: r.payloadHash,
    };
}
function decodeRaw(entityHex: string, version: number, v: Record<string, unknown>, source: (typeof STORAGES)[number]): RawRecord {
    const linkedFarmer = v.farmerId ? String(v.farmerId) : null;
    return {
        entityUuid: hexToUuid(entityHex),
        version,
        payloadHash: v.payloadHash ? String(v.payloadHash) : null,
        eventTimestamp: Number(v.eventTimestamp ?? 0),
        chainTimestamp: Number(v.chainTimestamp ?? 0),
        submitter: v.submitter ? String(v.submitter) : null,
        farmerUuid: linkedFarmer ? hexToUuid(linkedFarmer) : null,
        record_type: source.record_type,
        type: source.type,
    };
}
type RawRecord = {
    entityUuid: string; version: number; payloadHash: string | null; eventTimestamp: number;
    chainTimestamp: number; submitter: string | null; farmerUuid: string | null; record_type: string; type: string;
};

/**
 * Incremental refresh: records can only appear through extrinsics in NEW blocks, so scan
 * finalized blocks since the last build, read storage just for the keys found there, and
 * refresh the anchor status of every row from the app DB. Milliseconds per block instead
 * of decoding all storage (tens of seconds, blocking the event loop) on every refresh.
 */
async function refreshMainnetRecordRows(prev: MainnetRecordRow[]): Promise<MainnetRecordRow[]> {
    const api = await getApi("mainnet");
    const pallet = api.query.indianchain as unknown as Record<string, ((id: string, version: number) => Promise<{ isEmpty: boolean; toJSON: () => Record<string, unknown> | null }>) | undefined>;
    const head = await finalizedHead(api);
    const byId = new Map(prev.map((r) => [r.payload_id, r]));
    const blockOfId = new Map(prev.map((r) => [r.payload_id, r.block_number]));
    const fresh: { raw: RawRecord; block: number }[] = [];
    for (let n = S.scannedThrough + 1; n <= head; n++) {
        const f = await getBlockFacts(api, n);
        for (const key of f.byEntity.keys()) {
            const [uuid, ver] = key.split(":");
            const hex = "0x" + uuid.replace(/-/g, "");
            for (const source of STORAGES) {
                const getter = pallet[source.key];
                if (!getter) continue;
                let v: { isEmpty: boolean; toJSON: () => Record<string, unknown> | null };
                try { v = await getter(hex, Number(ver)); } catch { continue; }
                const j = v.isEmpty ? null : v.toJSON();
                if (!j) continue;
                fresh.push({ raw: decodeRaw(hex, Number(ver), j, source), block: n });
                break;
            }
        }
    }
    saveBlockCache();
    const links = await getMainnetAnchorLinks();
    for (const { raw, block } of fresh) {
        const row = rawToRow(raw, block, factsByBlock.get(block), links);
        byId.set(row.payload_id, row); blockOfId.set(row.payload_id, block);
    }
    // anchor status changes for existing rows as batches land on Cardano — cheap map pass
    const rows = [...byId.values()].map((r) => {
        const link = links[`${r.record_id}:${r.version}`];
        const status = link?.cardano_tx_hash ? "anchored" : "confirmed";
        return r.submission_status === status && r.cardano_tx_hash === (link?.cardano_tx_hash ?? null)
            ? r
            : { ...r, submission_status: status, merkle_root: link?.merkle_root ?? null, cardano_tx_hash: link?.cardano_tx_hash ?? null };
    });
    rows.sort((a, b) => b.block_number - a.block_number || a.record_id!.localeCompare(b.record_id!));
    S.scannedThrough = head;
    return rows;
}

const FULL_REBUILD_EVERY = 15 * 60_000;   // safety net: a periodic full storage read backs the incremental scan
async function fetchMainnetRecordRows(): Promise<MainnetRecordRow[]> {
    if (S.rowsMemo && S.scannedThrough > 0 && Date.now() - S.fullBuiltAt < FULL_REBUILD_EVERY) return refreshMainnetRecordRows(S.rowsMemo.v);
    const api = await getApi("mainnet");
    const pallet = api.query.indianchain;
    if (!pallet) return [];
    const headBefore = await finalizedHead(api);   // storage read below reflects at least this block

    const raw: RawRecord[] = [];

    for (const source of STORAGES) {
        const storage = (pallet as Record<string, unknown>)[source.key] as
            | { entries: () => Promise<[{ args: unknown[] }, { toJSON: () => Record<string, unknown> }][]> }
            | undefined;
        if (!storage?.entries) continue;

        let entries: [{ args: unknown[] }, { toJSON: () => Record<string, unknown> }][];
        try {
            entries = await storage.entries();
        } catch {
            continue; // storage item absent in this runtime — skip, don't fail the page
        }

        for (const [key, value] of entries) {
            const v = value.toJSON() as Record<string, unknown>;
            raw.push(decodeRaw(String(key.args[0]), Number(key.args[1]), v, source));
        }
    }

    if (raw.length === 0) return [];

    // One binary search per DISTINCT chain timestamp, then one index pass per block.
    const timestamps = [...new Set(raw.map((r) => r.chainTimestamp))].filter((t) => t > 0);
    const blockOf = new Map<number, number>();
    for (const ts of timestamps) {
        blockOf.set(ts, await resolveBlockByTimestamp(api, ts));
    }
    const facts = new Map<number, BlockFacts>();
    for (const blockNumber of new Set(blockOf.values())) {
        facts.set(blockNumber, await getBlockFacts(api, blockNumber));
    }

    saveBlockCache();

    const links = await getMainnetAnchorLinks();
    const rows: MainnetRecordRow[] = raw.map((r) => {
        const blockNumber = blockOf.get(r.chainTimestamp) ?? 0;
        return rawToRow(r, blockNumber, facts.get(blockNumber), links);
    });
    S.scannedThrough = headBefore;
    S.fullBuiltAt = Date.now();

    rows.sort((a, b) => b.block_number - a.block_number || a.record_id!.localeCompare(b.record_id!));
    return rows;
}

/**
 * All mainnet records, newest block first. Cached 30s.
 * Walking every block needs hundreds of RPC calls; that is fine next to the node but
 * not from a remote serverless host through the rate-limited public RPC. Remote copies
 * (no MAINNET_APP_DB_URL) therefore fetch the rows the node host has already built.
 */
const REMOTE_ROWS_URL = process.env.MAINNET_RECORDS_URL || "http://139.59.11.86/mainnet-api/records";
const REMOTE_TIMEOUT_MS = 25_000;
async function fetchRowsRemote(): Promise<MainnetRecordRow[]> {
    const res = await fetch(`${REMOTE_ROWS_URL}?limit=10000`, { cache: "no-store", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`records feed ${res.status}`);
    return ((await res.json()).rows ?? []) as MainnetRecordRow[];
}
/**
 * Stale-while-revalidate: a full rebuild walks chain storage (tens of seconds at 100k+
 * records), so requests always get the last good row set immediately and ONE background
 * rebuild refreshes it once it is older than ROWS_TTL. Only the very first request after
 * a restart waits. A failed rebuild keeps the previous rows.
 */
const ROWS_TTL = 60_000;
function rebuildRows(): Promise<MainnetRecordRow[]> {
    if (!S.rowsBuild) {
        S.rowsBuild = (process.env.MAINNET_APP_DB_URL ? fetchMainnetRecordRows : fetchRowsRemote)()
            .then((v) => { S.rowsMemo = { at: Date.now(), v }; return v; })
            .catch((e) => { console.error("mainnet rows rebuild failed:", e?.message ?? e); return S.rowsMemo?.v ?? []; })
            .finally(() => { S.rowsBuild = null; });
    }
    return S.rowsBuild;
}
export async function getMainnetRecordRows(): Promise<MainnetRecordRow[]> {
    if (S.rowsMemo) {
        if (Date.now() - S.rowsMemo.at > ROWS_TTL) void rebuildRows();   // refresh in the background
        return S.rowsMemo.v;
    }
    return rebuildRows();
}

/** Filters the events page and the API share, so host and remote copies behave the same. */
export type RecordQuery = {
    status?: string; record_type?: string;
    minBlock?: number | null; maxBlock?: number | null;
    find?: string;            // block number, payload_id, tx hash or record_id
    limit?: number;           // rows returned (newest first); total is always the full match count
};
export const DEFAULT_ROW_LIMIT = 2000;
export function filterRows(rows: MainnetRecordRow[], q: RecordQuery): MainnetRecordRow[] {
    const status = q.status?.toLowerCase(), rt = q.record_type?.toLowerCase();
    const find = q.find?.trim();
    const findNum = find && /^\d+$/.test(find) ? parseInt(find, 10) : null;
    const findLower = find?.toLowerCase();
    return rows.filter((r) => {
        if (rt && r.record_type !== rt) return false;
        if (status && r.submission_status !== status) return false;
        if (q.minBlock != null && r.block_number < q.minBlock) return false;
        if (q.maxBlock != null && r.block_number > q.maxBlock) return false;
        if (find) {
            if (findNum !== null) return r.block_number === findNum;
            return r.payload_id.toLowerCase() === findLower || r.tx_hash?.toLowerCase() === findLower || r.record_id?.toLowerCase() === findLower;
        }
        return true;
    });
}
function queryString(q: RecordQuery): string {
    const p = new URLSearchParams();
    if (q.status) p.set("status", q.status);
    if (q.record_type) p.set("record_type", q.record_type);
    if (q.minBlock != null) p.set("start", String(q.minBlock));
    if (q.maxBlock != null) p.set("end", String(q.maxBlock));
    if (q.find) p.set("find", q.find);
    p.set("limit", String(q.limit ?? DEFAULT_ROW_LIMIT));
    return p.toString();
}
/**
 * Rows matching a query, newest first, capped at `limit`, plus the full match count.
 * Host: filters the cached rows. Remote copies: ask the host — never pull every row
 * across the network (100k+ rows is ~100 MB, which breaks a serverless function).
 */
export async function queryMainnetRecords(q: RecordQuery): Promise<{ rows: MainnetRecordRow[]; total: number }> {
    const limit = q.limit ?? DEFAULT_ROW_LIMIT;
    if (process.env.MAINNET_APP_DB_URL) {
        const all = filterRows(await getMainnetRecordRows(), q);
        return { rows: all.slice(0, limit), total: all.length };
    }
    try {
        const res = await fetch(`${REMOTE_ROWS_URL}?${queryString({ ...q, limit })}`, { cache: "no-store", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
        if (!res.ok) return { rows: [], total: 0 };
        const j = await res.json();
        return { rows: (j.rows ?? []) as MainnetRecordRow[], total: Number(j.total ?? (j.rows?.length ?? 0)) };
    } catch { return { rows: [], total: 0 }; }
}

/** Home-page numbers + chart series, computed once on the host (a few KB) instead of shipping every row. */
export type MainnetSummary = {
    totalEvents: number; totalBlocks: number; anchored: number; fallbackLatestBlock: number;
    transactionChartData: ReturnType<typeof buildChartSeries>["transactionChartData"];
    distributionChartData: ReturnType<typeof buildChartSeries>["distributionChartData"];
};
export async function getMainnetSummary(): Promise<MainnetSummary> {
    if (S.summaryMemo && Date.now() - S.summaryMemo.at < 20_000) return S.summaryMemo.v;
    let v: MainnetSummary;
    if (process.env.MAINNET_APP_DB_URL) {
        const rows = await getMainnetRecordRows();
        const { transactionChartData, distributionChartData } = buildChartSeries(rows, 7);
        v = {
            totalEvents: rows.length,
            totalBlocks: new Set(rows.map((r) => r.block_number)).size,
            anchored: rows.filter((r) => r.submission_status === "anchored").length,
            fallbackLatestBlock: rows.length ? rows[0].block_number : 0,
            transactionChartData, distributionChartData,
        };
    } else {
        try {
            const res = await fetch(`${REMOTE_ROWS_URL}?summary=1`, { cache: "no-store", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
            if (!res.ok) throw new Error(`summary ${res.status}`);
            v = (await res.json()) as MainnetSummary;
        } catch (e) {
            console.error("mainnet summary fetch failed:", (e as Error)?.message ?? e);
            if (S.summaryMemo) return S.summaryMemo.v;      // stale beats zeros on a production page
            v = emptySummary();
        }
    }
    S.summaryMemo = { at: Date.now(), v }; return v;
}
function emptySummary(): MainnetSummary {
    return { totalEvents: 0, totalBlocks: 0, anchored: 0, fallbackLatestBlock: 0, transactionChartData: [], distributionChartData: [] };
}

/** Single record for the detail page: accepts a block number, payload_id or tx hash. */
export async function findMainnetRecord(needle: string): Promise<MainnetRecordRow | null> {
    const { rows } = await queryMainnetRecords({ find: needle, limit: 1 });
    return rows[0] ?? null;
}
