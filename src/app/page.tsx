import Link from "next/link";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getMainnetSummary, queryMainnetRecords } from "@/lib/mainnet-records";
import { anchorsPerDay, listAnchors } from "@/lib/mainnet-anchors";
import { listBlocks } from "@/lib/block-data";
import { previewOnline } from "@/lib/preview-status";
import { SearchBar } from "@/components/layout/search-bar";
import { MetricCards } from "@/components/home/metric-cards";
import { LiveFeed } from "@/components/home/live-feed";
import { AnchoredChart } from "@/components/charts/anchored-chart";
import { Distribution } from "@/components/charts/distribution";
import { Empty } from "@/components/ui/empty";

export const revalidate = 15;
export const maxDuration = 60;

const settle = async <T,>(p: Promise<T>, fallback: T): Promise<T> => { try { return await p; } catch { return fallback; } };

function Hero() {
    return (
        <section className="wash-y relative mt-8 overflow-hidden rounded-2xl border border-white/10 px-6 pb-14 pt-16 text-center sm:pt-20">
            <h1 className="heading text-[38px] leading-[1.05] sm:text-6xl">
                <span className="dot">IndianChain</span> <span className="block sm:inline">Explorer</span>
            </h1>
            <div className="mx-auto mt-10 max-w-2xl text-left"><SearchBar large /></div>
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
                <div className="card mt-8"><Empty title={up ? "Preview" : "Preview network offline"} action={<Link href="/records" className="btn">Records</Link>} /></div>
            </div>
        );
    }

    const [summary, records, anchors, days, blocks] = await Promise.all([
        settle(getMainnetSummary(), null),
        settle(queryMainnetRecords({ limit: 8, noCount: true }), { rows: [], total: 0 }),
        settle(listAnchors(8), { batches: [], total: 0 }),
        settle(anchorsPerDay(30), []),
        settle(listBlocks("mainnet", 8), { blocks: [], best: 0, finalized: 0 }),
    ]);

    return (
        <div className="page">
            <Hero />
            <div className="mt-8">
                <MetricCards latestBlock={blocks.best || null} totalRecords={summary?.totalEvents || null} anchored={summary?.anchored ?? null} network={network} />
            </div>
            <div className="mt-14">
                <LiveFeed
                    blocks={blocks.blocks.map((b) => ({ number: b.number, hash: b.hash, extrinsicsCount: b.extrinsics, timestamp: b.timestamp }))}
                    finalized={blocks.finalized || null} records={records.rows} anchors={anchors.batches} network={network}
                />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3"><AnchoredChart days={days} /></div>
                <div className="lg:col-span-2"><Distribution counts={summary?.byType ?? null} /></div>
            </div>
        </div>
    );
}
