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
import { unstable_cache } from "next/cache";
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

// Blocks are immutable once finalized, so these never need invalidating.
const blockByTimestamp = new Map<number, number>();
const factsByBlock = new Map<number, BlockFacts>();

const SLOT_MS = 6000;
let genesisTsCache: number | null = null;

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

    if (genesisTsCache === null) genesisTsCache = await timestampAt(api, 1);

    const head = (await api.rpc.chain.getHeader()).number.toNumber();
    const guess = Math.min(Math.max(1 + Math.floor((targetMs - genesisTsCache) / SLOT_MS), 1), head);

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

async function fetchMainnetRecordRows(): Promise<MainnetRecordRow[]> {
    const api = await getApi("mainnet");
    const pallet = api.query.indianchain;
    if (!pallet) return [];

    type Raw = {
        entityUuid: string;
        version: number;
        payloadHash: string | null;
        eventTimestamp: number;
        chainTimestamp: number;
        submitter: string | null;
        farmerUuid: string | null;
        record_type: string;
        type: string;
    };

    const raw: Raw[] = [];

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
            const entityHex = String(key.args[0]);
            const linkedFarmer = v.farmerId ? String(v.farmerId) : null;
            raw.push({
                entityUuid: hexToUuid(entityHex),
                version: Number(key.args[1]),
                payloadHash: v.payloadHash ? String(v.payloadHash) : null,
                eventTimestamp: Number(v.eventTimestamp ?? 0),
                chainTimestamp: Number(v.chainTimestamp ?? 0),
                submitter: v.submitter ? String(v.submitter) : null,
                farmerUuid: linkedFarmer ? hexToUuid(linkedFarmer) : null,
                record_type: source.record_type,
                type: source.type,
            });
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

    const links = await getMainnetAnchorLinks();
    const rows: MainnetRecordRow[] = raw.map((r) => {
        const blockNumber = blockOf.get(r.chainTimestamp) ?? 0;
        const f = facts.get(blockNumber);
        const tx = f?.byEntity.get(`${r.entityUuid}:${r.version}`) ?? null;
        return {
            payload_id: `${r.entityUuid}_${r.version}`,
            block_number: blockNumber,
            submission_status: "confirmed",
            chain: "indianchain-mainnet",
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
            // filled from the mainnet app DB below (null until that record is L1-anchored)
            merkle_root: links[`${r.entityUuid}:${r.version}`]?.merkle_root ?? null,
            cardano_tx_hash: links[`${r.entityUuid}:${r.version}`]?.cardano_tx_hash ?? null,
            payload_hash: r.payloadHash,
        };
    });

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
async function fetchRowsRemote(): Promise<MainnetRecordRow[]> {
    try {
        const res = await fetch(REMOTE_ROWS_URL, { cache: "no-store" });
        if (!res.ok) return [];
        return ((await res.json()).rows ?? []) as MainnetRecordRow[];
    } catch { return []; }
}
export function getMainnetRecordRows() {
    const fn = process.env.MAINNET_APP_DB_URL ? fetchMainnetRecordRows : fetchRowsRemote;
    return unstable_cache(fn, ["indianchain-mainnet-records-v2"], { revalidate: 30 })();
}

/** Single record for the detail page: accepts a block number, payload_id or tx hash. */
export async function findMainnetRecord(needle: string): Promise<MainnetRecordRow | null> {
    const rows = await getMainnetRecordRows();
    if (/^\d+$/.test(needle)) {
        const n = parseInt(needle, 10);
        return rows.find((r) => r.block_number === n) ?? null;
    }
    const lower = needle.toLowerCase();
    return (
        rows.find(
            (r) =>
                r.payload_id.toLowerCase() === lower ||
                r.tx_hash?.toLowerCase() === lower ||
                r.record_id?.toLowerCase() === lower
        ) ?? null
    );
}
