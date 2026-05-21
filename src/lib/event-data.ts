import { unstable_cache } from "next/cache";
import { CARDANO_PROOF_OR_FILTER, hasCardanoProof } from "@/lib/cardano-proof";
import { supabase } from "@/lib/supabase";

export type EventRecord = {
    block_number: number;
    tx_hash?: string | null;
    tx_index?: number | string | null;
    type?: string | null;
    record_type?: string | null;
    chain?: string | null;
    payload_hash?: string | null;
    version?: string | number | null;
    timestamp?: string | null;
    farmer_id?: string | null;
    record_id?: string | null;
    entity_id?: string | null;
    merkle_root?: string | null;
    cardano_tx_hash?: string | null;
    payload_id?: string;
    [key: string]: unknown;
};

async function fetchEventByHash(hash: string): Promise<{
    event: EventRecord | null;
    error: { message: string } | null;
    isBlockNumber: boolean;
}> {
    const isBlockNumber = /^\d+$/.test(hash);

    const matchQuery = isBlockNumber
        ? supabase
              .from("event_payload_data")
              .select("*")
              .eq("block_number", parseInt(hash, 10))
              .or(CARDANO_PROOF_OR_FILTER)
              .limit(1)
              .single()
        : supabase
              .from("event_payload_data")
              .select("*")
              .or(`payload_id.eq.${hash},tx_hash.eq.${hash}`)
              .limit(1)
              .single();

    const { data: event, error } = await matchQuery;
    const record = event as EventRecord | null;

    if (record && !hasCardanoProof(record)) {
        return {
            event: null,
            error: { message: "Event has no Cardano proof" },
            isBlockNumber,
        };
    }

    return {
        event: record,
        error: error ? { message: error.message } : null,
        isBlockNumber,
    };
}

export function getCachedEvent(hash: string) {
    return unstable_cache(
        () => fetchEventByHash(hash),
        ["indiachain-event-v2", hash],
        { revalidate: 60 }
    )();
}
