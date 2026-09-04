import { MetricCards } from "@/components/dashboard/metric-cards";
import { NetworkCharts } from "@/components/dashboard/network-charts";
import { LiveNetworkFeed } from "@/components/dashboard/live-feed";
import { getCachedHomeMetrics } from "@/lib/home-data";
import { getCachedChainSnapshot } from "@/lib/chain-snapshot";
import { resolveNetworkFromCookies } from "@/lib/network-server";

export async function HomeDashboard() {
    const network = await resolveNetworkFromCookies();
    const [homeMetrics, chainSnapshot] = await Promise.all([
        getCachedHomeMetrics(),
        getCachedChainSnapshot(network),
    ]);

    const latestBlock =
        chainSnapshot.latestBlock > 0
            ? chainSnapshot.latestBlock
            : homeMetrics.fallbackLatestBlock;

    const stats = {
        latestBlock,
        totalTransactions: homeMetrics.totalTransactions,
        totalEvents: homeMetrics.totalEvents,
        validators: 5,
    };

    return (
        <>
            <MetricCards stats={stats} />
            <LiveNetworkFeed
                initialBlocks={chainSnapshot.initialBlocks}
                initialStats={chainSnapshot.initialStats}
            />
            <div className="mt-8">
                <NetworkCharts
                    transactionData={homeMetrics.transactionChartData}
                    distributionData={homeMetrics.distributionChartData}
                />
            </div>
        </>
    );
}
