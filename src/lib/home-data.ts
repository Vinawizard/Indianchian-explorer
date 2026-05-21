import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { buildChartSeries } from "@/lib/chart-series";

export type HomeEventRow = {
    block_number: number;
    tx_hash: string | null;
    timestamp: string | null;
    record_type: string | null;
};

export type HomeMetrics = {
    allEvents: HomeEventRow[];
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
            .select("block_number, tx_hash, timestamp, record_type")
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
        const allEvents = await fetchAllEventSummaries();
        const txHashes = new Set(allEvents.map((e) => e.tx_hash).filter(Boolean));
        const { transactionChartData, distributionChartData } = buildChartSeries(allEvents, 7);

        return {
            allEvents,
            totalEvents: allEvents.length,
            totalTransactions: txHashes.size,
            transactionChartData,
            distributionChartData,
            fallbackLatestBlock: allEvents.length > 0 ? allEvents[0].block_number : 0,
        };
    },
    ["indiachain-home-metrics-v1"],
    { revalidate: 30 }
);
