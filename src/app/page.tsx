import Link from "next/link";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getMainnetSummary, queryMainnetRecords } from "@/lib/mainnet-records";
import { listAnchors } from "@/lib/mainnet-anchors";
import { listBlocks } from "@/lib/block-data";
import { previewOnline } from "@/lib/preview-status";
import { SearchBar } from "@/components/layout/search-bar";
import { MetricCards } from "@/components/home/metric-cards";
import { LiveFeed } from "@/components/home/live-feed";
import { TrendChart } from "@/components/charts/trend-chart";
import { ACTIVITY, INK, SERIES, TINT } from "@/components/charts/palette";
import { Empty } from "@/components/ui/empty";

export const revalidate = 15;
export const maxDuration = 60;

const settle = async <T,>(p: Promise<T>, fallback: T): Promise<T> => { try { return await p; } catch { return fallback; } };

/**
 * The landing hero: one see-through panel over the moving Trivolve light, holding the wordmark,
 * the search and the three network figures in the same dot matrix.
 */
function Hero({ figures }: { figures?: React.ReactNode }) {
    return (
        <section className="panel spot mt-6 overflow-hidden px-5 pb-10 pt-16 text-center sm:px-10 sm:pb-12 sm:pt-20">
            <h1 className="t-hero text-white">
                <span className="dot">IndianChain</span>{" "}
                <span className="block text-white/90 sm:inline">Explorer</span>
            </h1>
            <div className="mx-auto mt-10 max-w-[640px] text-left"><SearchBar large /></div>
            {figures && (
                <div className="mx-auto mt-14 max-w-[1200px] pt-10" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.12) 80%, transparent) top / 100% 1px no-repeat" }}>
                    {figures}
                </div>
            )}
        </section>
    );
}

export default async function Home() {
    const network = await resolveNetworkFromCookies();
    if (network !== "mainnet") {
        const up = await previewOnline();
        return (
            <div className="page">
                <Hero />
                <div className="card mt-8"><Empty title={up ? "Preview" : "Preview network offline"} action={<Link href="/events" className="btn">Events</Link>} /></div>
            </div>
        );
    }

    const [summary, records, anchors, blocks] = await Promise.all([
        settle(getMainnetSummary(), null),
        settle(queryMainnetRecords({ limit: 8, noCount: true }), { rows: [], total: 0 }),
        settle(listAnchors(8), { batches: [], total: 0 }),
        settle(listBlocks("mainnet", 8), { blocks: [], best: 0, finalized: 0 }),
    ]);
    const daily = summary?.daily ?? [];

    return (
        <div className="page">
            <Hero figures={<MetricCards latestBlock={blocks.best || null} totalRecords={summary?.totalEvents || null} anchored={summary?.anchored ?? null} network={network} />} />
            {daily.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <TrendChart title="Network activity" subtitle="Global transactions & protocol events" mode="step" days={daily.map((x) => x.day)}
                        series={[{ key: "all", label: "Events", color: ACTIVITY, width: 2, tint: TINT.blue, fill: 0.3, ink: INK.blue, values: daily.map((x) => x.farmer + x.agri_record + x.credit_app) }]} />
                    <TrendChart title="Record distribution" subtitle="Sector-specific data visualization" mode="smooth" days={daily.map((x) => x.day)}
                        series={[
                            { key: "farmer", label: "Farmer", color: SERIES.farmer, width: 1.25, fill: 0.1, values: daily.map((x) => x.farmer) },
                            { key: "agri", label: "Agri", color: SERIES.agri_record, width: 2, tint: TINT.blue, fill: 0.3, ink: INK.blue, values: daily.map((x) => x.agri_record) },
                            { key: "credit", label: "Credit", color: SERIES.credit_app, width: 1.5, fill: 0.16, ink: INK.red, values: daily.map((x) => x.credit_app) },
                        ]} />
                </div>
            )}
            <div className="mt-8">
                <LiveFeed
                    blocks={blocks.blocks.map((b) => ({ number: b.number, hash: b.hash, extrinsicsCount: b.extrinsics, timestamp: b.timestamp }))}
                    finalized={blocks.finalized || null} records={records.rows} anchors={anchors.batches} network={network}
                />
            </div>
        </div>
    );
}
