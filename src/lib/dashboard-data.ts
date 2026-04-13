import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { buildChartSeries } from "@/lib/chart-series";

const CHART_SAMPLE_LIMIT = 14_000;
const TX_SAMPLE_LIMIT = 20_000;

export type DashboardPayload = {
    stats: {
        latestBlock: number;
        totalTransactions: number;
        totalEvents: number;
        validators: number;
        distinctTxFromSample: boolean;
    };
    transactionChartData: ReturnType<typeof buildChartSeries>["transactionChartData"];
    distributionChartData: ReturnType<typeof buildChartSeries>["distributionChartData"];
    fetchError: string | null;
};

export const getCachedDashboard = unstable_cache(
    async (): Promise<DashboardPayload> => {
        const [
            { count: totalEvents, error: countError },
            { data: latestRow, error: latestError },
            { data: txSample, error: txError },
            { data: chartRows, error: chartError },
        ] = await Promise.all([
            supabase
                .from("event_payload_data")
                .select("*", { count: "exact", head: true }),
            supabase
                .from("event_payload_data")
                .select("block_number")
                .order("block_number", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from("event_payload_data")
                .select("tx_hash")
                .order("block_number", { ascending: false })
                .limit(TX_SAMPLE_LIMIT),
            supabase
                .from("event_payload_data")
                .select("timestamp, tx_hash, record_type")
                .order("block_number", { ascending: false })
                .limit(CHART_SAMPLE_LIMIT),
        ]);

        const err =
            countError?.message ||
            latestError?.message ||
            txError?.message ||
            chartError?.message ||
            null;

        const totalTxDistinct = new Set(
            (txSample || [])
                .map((r) => r.tx_hash)
                .filter((h): h is string => Boolean(h))
        ).size;

        const { transactionChartData, distributionChartData } = buildChartSeries(
            chartRows || [],
            30
        );

        return {
            stats: {
                latestBlock: latestRow?.block_number ?? 0,
                totalTransactions: totalTxDistinct,
                totalEvents: totalEvents ?? 0,
                validators: 5,
                distinctTxFromSample: true,
            },
            transactionChartData,
            distributionChartData,
            fetchError: err,
        };
    },
    ["indiachain-dashboard-v2"],
    { revalidate: 30 }
);
