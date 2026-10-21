import "server-only";
import { getApi, hexToString, tryParseJson } from "./polkadot";
import type { ChainNetwork } from "./network";

export type BlockExtrinsic = {
    index: number; hash: string; section: string; method: string;
    args: unknown; signer: string | null; status: "success" | "failed" | "unknown";
};
export type BlockDetail = {
    number: number; hash: string; parentHash: string; stateRoot: string; extrinsicsRoot: string;
    timestamp: string | null;        // from the block's own timestamp.set inherent
    finalized: boolean; finalizedHead: number; bestHead: number;
    extrinsics: BlockExtrinsic[];
};

/** toHuman() groups digits ("1,772,921,209,084"); a call's numbers read better plain. */
function plain(v: unknown): unknown {
    if (typeof v === "string" && /^\d{1,3}(,\d{3})+$/.test(v)) return v.replace(/,/g, "");
    if (Array.isArray(v)) return v.map(plain);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
    return v;
}

/** One block, read live from an IndianChain node. Null when the chain has no such block yet. */
export async function getBlockDetail(network: ChainNetwork, n: number): Promise<BlockDetail | null> {
    const api = await getApi(network);
    const [best, finalizedHash] = await Promise.all([api.rpc.chain.getHeader(), api.rpc.chain.getFinalizedHead()]);
    const bestHead = best.number.toNumber();
    if (n < 0 || n > bestHead) return null;
    const finalizedHead = (await api.rpc.chain.getHeader(finalizedHash)).number.toNumber();
    const hash = await api.rpc.chain.getBlockHash(n);
    if (hash.isEmpty) return null;
    const [signedBlock, eventsRaw] = await Promise.all([api.rpc.chain.getBlock(hash), api.query.system.events.at(hash)]);
    const events = eventsRaw as unknown as Array<{ phase: any; event: any }>;
    let timestamp: string | null = null;

    const extrinsics: BlockExtrinsic[] = signedBlock.block.extrinsics.map((ext, index) => {
        const own = events.filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index));
        const ok = own.some(({ event }) => api.events.system.ExtrinsicSuccess.is(event));
        const failed = own.some(({ event }) => api.events.system.ExtrinsicFailed.is(event));
        const { section, method } = ext.method;
        let args: unknown;
        if (section === "dataRegistry" && method === "storeData") {
            args = { key: ext.method.args[0].toHuman(), data: tryParseJson(hexToString(ext.method.args[1].toString())) };
        } else {
            // named as in the chain's metadata (payload_hash, version, ...), as the original's call data table showed them
            const names = ext.method.meta.args.map((m) => m.name.toString());
            args = Object.fromEntries(ext.method.args.map((a, i) => [names[i] ?? String(i), plain(a.toHuman())]));
        }
        if (section === "timestamp" && method === "set") {
            const ms = Number(ext.method.args[0].toString());
            if (Number.isFinite(ms) && ms > 0) timestamp = new Date(ms).toISOString();
        }
        return {
            index, hash: ext.hash.toHex(), section, method, args,
            signer: ext.isSigned ? ext.signer.toString() : null,
            status: ok ? "success" : failed ? "failed" : "unknown",
        };
    });

    return {
        number: n, hash: hash.toHex(),
        parentHash: signedBlock.block.header.parentHash.toHex(),
        stateRoot: signedBlock.block.header.stateRoot.toHex(),
        extrinsicsRoot: signedBlock.block.header.extrinsicsRoot.toHex(),
        timestamp, finalized: n <= finalizedHead, finalizedHead, bestHead, extrinsics,
    };
}

export type BlockRow = { number: number; hash: string; extrinsics: number; timestamp: string | null };

/** The latest `count` blocks (or those below `before`), newest first, with each block's own time. */
export async function listBlocks(network: ChainNetwork, count = 25, before?: number | null): Promise<{ blocks: BlockRow[]; best: number; finalized: number }> {
    const api = await getApi(network);
    const [best, finalizedHash] = await Promise.all([api.rpc.chain.getHeader(), api.rpc.chain.getFinalizedHead()]);
    const bestNum = best.number.toNumber();
    const finalized = (await api.rpc.chain.getHeader(finalizedHash)).number.toNumber();
    const top = before != null ? Math.min(before - 1, bestNum) : bestNum;
    const nums = Array.from({ length: Math.min(count, 50) }, (_, i) => top - i).filter((x) => x >= 0);
    const blocks = await Promise.all(nums.map(async (n) => {
        const hash = await api.rpc.chain.getBlockHash(n);
        const sb = await api.rpc.chain.getBlock(hash);
        const ts = sb.block.extrinsics.find((e) => e.method.section === "timestamp" && e.method.method === "set");
        const ms = ts ? Number(ts.method.args[0].toString()) : NaN;
        return { number: n, hash: hash.toHex(), extrinsics: sb.block.extrinsics.length, timestamp: Number.isFinite(ms) ? new Date(ms).toISOString() : null };
    }));
    return { blocks, best: bestNum, finalized };
}
