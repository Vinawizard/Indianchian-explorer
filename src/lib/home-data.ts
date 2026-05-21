import { unstable_cache } from "next/cache";
import {
    CARDANO_PROOF_OR_FILTER,
    countUniqueBlocks,
    hasCardanoProof,
} from "@/lib/cardano-proof";
import { supabase } from "@/lib/supabase";
import { buildChartSeries } from "@/lib/chart-series";

export type HomeEventRow = {
    block_number: number;
    tx_hash: string | null;
    timestamp: string | null;
    record_type: string | null;
    merkle_root: string | null;
    cardano_tx_hash: string | null;
};

export type HomeMetrics = {
    allEvents: HomeEventRow[];
    totalBlocks: number;
    totalEvents: number;
    totalTransactions: number;
    transactionChartData: ReturnType<typeof buildChartSeries>["transactionChartData"];
    distributionChartData: ReturnType<typeof buildChartSeries>["distributionChartData"];
    fallbackLatestBlock: number;
};

async function fetchAllEventSummaries(): Promise<HomeEventRow[]> {
    const PAGE_SIZE = 1000;
    let allEvents: HomeEventRow[] = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from("event_payload_data")
            .select("block_number, tx_hash, timestamp, record_type, merkle_root, cardano_tx_hash")
            .or(CARDANO_PROOF_OR_FILTER)
            .order("block_number", { ascending: false })
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("Error fetching event_payload_data:", error);
            break;
        }
        if (!data || data.length === 0) break;

        allEvents = allEvents.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return allEvents;
}

export const getCachedHomeMetrics = unstable_cache(
    async (): Promise<HomeMetrics> => {
        const rawEvents = await fetchAllEventSummaries();
        const allEvents = rawEvents.filter(hasCardanoProof);
        const totalBlocks = countUniqueBlocks(allEvents);
        const { transactionChartData, distributionChartData } = buildChartSeries(allEvents, 7);

        return {
            allEvents,
            totalBlocks,
            totalEvents: totalBlocks,
            totalTransactions: totalBlocks,
            transactionChartData,
            distributionChartData,
            fallbackLatestBlock: allEvents.length > 0 ? allEvents[0].block_number : 0,
        };
    },
    ["indiachain-home-metrics-v2"],
    { revalidate: 30 }
);
