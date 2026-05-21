import { unstable_cache } from "next/cache";
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
              .limit(1)
              .single()
        : supabase
              .from("event_payload_data")
              .select("*")
              .or(`payload_id.eq.${hash},tx_hash.eq.${hash}`)
              .limit(1)
              .single();

    const { data: event, error } = await matchQuery;

    return {
        event: event as EventRecord | null,
        error: error ? { message: error.message } : null,
        isBlockNumber,
    };
}

export function getCachedEvent(hash: string) {
    return unstable_cache(
        () => fetchEventByHash(hash),
        ["indiachain-event", hash],
        { revalidate: 60 }
    )();
}
