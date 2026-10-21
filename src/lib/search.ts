import "server-only";
import { getApi } from "./polkadot";
import { supabase } from "./supabase";
import { queryMainnetRecords } from "./mainnet-records";
import { findAnchorByTx } from "./mainnet-anchors";
import type { ChainNetwork } from "./network";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HEX64 = /^[0-9a-f]{64}$/;

async function blockByHash(network: ChainNetwork, h: string): Promise<number | null> {
    try {
        const api = await getApi(network);
        const b = await api.rpc.chain.getBlock(h);
        return b ? b.block.header.number.toNumber() : null;
    } catch { return null; }
}

/**
 * Where a search should land. Order: block number, record version, record, farmer,
 * IndianChain transaction, block hash, Cardano transaction. Null when nothing matches.
 */
export async function resolveSearch(raw: string, network: ChainNetwork): Promise<string | null> {
    const q = raw.trim().replace(/^#/, "").toLowerCase();
    if (!q) return null;
    if (/^\d+$/.test(q)) return `/block/${Number(q)}`;

    if (network !== "mainnet") {
        if (/^0x[0-9a-f]{64}$/.test(q)) {
            const n = await blockByHash(network, q);
            if (n != null) return `/block/${n}`;
            const { data } = await supabase.from("event_payload_data").select("block_number").eq("tx_hash", q).limit(1).maybeSingle();
            if (data) return `/block/${data.block_number}`;
        }
        return null;
    }

    const composite = q.match(/^([0-9a-f-]{36})_(\d+)$/);
    if (composite && UUID.test(composite[1])) {
        const { rows } = await queryMainnetRecords({ find: q, limit: 1, noCount: true });
        return rows[0] ? `/record/${rows[0].record_id}_${rows[0].version}` : null;
    }
    if (UUID.test(q)) {
        const { rows } = await queryMainnetRecords({ find: q, limit: 1, noCount: true });
        if (rows[0]) return rows[0].record_id === q ? `/record/${q}` : `/record/${rows[0].record_id}_${rows[0].version}`;
        const farmer = await queryMainnetRecords({ farmer: q, limit: 1, noCount: true });
        if (farmer.rows[0]) return `/records?farmer=${q}`;
        return null;
    }
    const hex = q.startsWith("0x") ? q.slice(2) : q;
    if (HEX64.test(hex)) {
        const { rows } = await queryMainnetRecords({ find: `0x${hex}`, limit: 1, noCount: true });
        if (rows[0]) return `/record/${rows[0].record_id}_${rows[0].version}`;
        const n = await blockByHash(network, `0x${hex}`);
        if (n != null) return `/block/${n}`;
        const anchor = await findAnchorByTx(hex);
        if (anchor) return `/anchor/${anchor.batch_index}`;
    }
    return null;
}
