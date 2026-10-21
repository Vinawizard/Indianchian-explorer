import Link from "next/link";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getMainnetSummary, queryMainnetRecords } from "@/lib/mainnet-records";
import { anchorsPerDay, listAnchors } from "@/lib/mainnet-anchors";
import { listBlocks } from "@/lib/block-data";
import { scrapePrometheusMetrics } from "@/lib/prometheus";
import { previewOnline } from "@/lib/preview-status";
import { fmtInt, shortHash } from "@/lib/format";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { PageHeader } from "@/components/ui/page-header";
import { LiveStrip, type StripData } from "@/components/overview/live-strip";
import { LatestBlocks } from "@/components/overview/latest-blocks";
import { RecordsTable } from "@/components/records/records-table";
import { BarChart } from "@/components/ui/bar-chart";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";

export const revalidate = 15;
export const maxDuration = 60;

const settle = async <T,>(p: Promise<T>, fallback: T): Promise<T> => { try { return await p; } catch { return fallback; } };

export default async function Overview() {
    const network = await resolveNetworkFromCookies();
    if (network !== "mainnet") return <PreviewOverview />;

    const [summary, records, anchors, days, blocks, metrics] = await Promise.all([
        settle(getMainnetSummary(), null),
        settle(queryMainnetRecords({ limit: 8, noCount: true }), { rows: [], total: 0 }),
        settle(listAnchors(6), { batches: [], total: 0 }),
        settle(anchorsPerDay(14), []),
        settle(listBlocks("mainnet", 8), { blocks: [], best: 0, finalized: 0 }),
        settle(scrapePrometheusMetrics("mainnet"), null),
    ]);

    const nodes = metrics?.nodes ?? [];
    const strip: StripData = {
        totalRecords: summary?.totalEvents || null,
        anchored: summary?.anchored ?? null,
        ledgerTotal: summary?.ledgerTotal ?? summary?.totalEvents ?? null,
        best: blocks.best || null,
        finalized: blocks.finalized || null,
        validatorsUp: nodes.length ? nodes.filter((n) => n.status === "up").length : null,
        validatorsTotal: nodes.length || null,
        lastAnchorAt: anchors.batches[0]?.confirmed_at ?? null,
        lastAnchorIndex: anchors.batches[0]?.batch_index ?? null,
        byType: summary?.byType ?? null,
    };

    const todayKey = new Date().toISOString().slice(0, 10);
    const chart = days.map((d) => ({
        label: new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
        title: new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
        value: d.records,
        current: d.day === todayKey,
    }));
    const chartTotal = days.reduce((a, d) => a + d.records, 0);
    const chartAnchors = days.reduce((a, d) => a + d.anchors, 0);

    return (
        <div className="shell">
            <PageHeader
                title="IndianChain Mainnet"
                meta="Farmer, agricultural and credit records finalized on IndianChain and sealed on Cardano mainnet in batches of 100."
            />

            <LiveStrip initial={strip} network={network} />

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
                <section className="panel min-w-0 xl:col-span-7" aria-labelledby="latest-records">
                    <div className="panel-head">
                        <h2 id="latest-records" className="panel-title">Latest records</h2>
                        <Link href="/records" className="text-[13px] text-muted hover:text-ink">View all records</Link>
                    </div>
                    {records.rows.length
                        ? <RecordsTable rows={records.rows} cols={["record", "version", "block", "time", "anchor"]} caption="Latest records" />
                        : <Empty title="Records are unavailable">The records ledger did not answer. Try again in a moment.</Empty>}
                </section>

                <section className="panel min-w-0 xl:col-span-5" aria-labelledby="latest-blocks">
                    <div className="panel-head">
                        <h2 id="latest-blocks" className="panel-title">Latest blocks</h2>
                        <Link href="/blocks" className="text-[13px] text-muted hover:text-ink">View all blocks</Link>
                    </div>
                    <LatestBlocks initial={blocks.blocks.map((b) => ({ number: b.number, hash: b.hash, extrinsicsCount: b.extrinsics, timestamp: b.timestamp }))} initialFinalized={blocks.finalized || null} network={network} />
                </section>

                <section className="panel min-w-0 xl:col-span-7" aria-labelledby="anchoring">
                    <div className="panel-head">
                        <h2 id="anchoring" className="panel-title">Records anchored on Cardano per day</h2>
                        <span className="hidden text-[13px] text-faint sm:inline">Last 14 days · <span className="num text-muted">{fmtInt(chartTotal)}</span> records in <span className="num text-muted">{fmtInt(chartAnchors)}</span> transactions</span>
                    </div>
                    <div className="px-4 pb-3 pt-5">
                        {chart.length ? (
                            <>
                                <div className="hidden sm:block"><BarChart data={chart} unit="records" height={260} /></div>
                                <div className="sm:hidden"><BarChart data={chart.slice(-7)} unit="records" width={360} height={220} /></div>
                            </>
                        ) : <Empty title="Anchoring history is unavailable" />}
                        <p className="mt-2 text-[12px] text-faint">UTC days. Today is drawn as an outline while it is still filling. Anchoring runs Monday to Saturday.</p>
                    </div>
                </section>

                <section className="panel min-w-0 xl:col-span-5" aria-labelledby="latest-anchors">
                    <div className="panel-head">
                        <h2 id="latest-anchors" className="panel-title">Latest Cardano anchors</h2>
                        <Link href="/anchors" className="text-[13px] text-muted hover:text-ink">View all anchors</Link>
                    </div>
                    {anchors.batches.length ? (
                        <div className="overflow-x-auto"><table className="table">
                            <caption className="sr-only">Latest Cardano anchors</caption>
                            <thead><tr><th scope="col">Batch</th><th scope="col">Cardano transaction</th><th scope="col" className="r hidden sm:table-cell">Records</th><th scope="col">Anchored</th></tr></thead>
                            <tbody>
                                {anchors.batches.map((b) => (
                                    <tr key={b.batch_index}>
                                        <td><Link href={`/anchor/${b.batch_index}`} className="num link">#{fmtInt(b.batch_index)}</Link></td>
                                        <td>{b.cardano_tx_hash
                                            ? <a href={cardanoscanTx(network, b.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="mono text-muted hover:text-ink" title={b.cardano_tx_hash}>{shortHash(b.cardano_tx_hash, 8, 6)}</a>
                                            : <span className="text-faint">—</span>}</td>
                                        <td className="r num hidden text-muted sm:table-cell">{fmtInt(b.record_count)}</td>
                                        <td className="text-muted"><TimeAgo iso={b.confirmed_at} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    ) : <Empty title="Anchors are unavailable" />}
                </section>
            </div>
        </div>
    );
}

async function PreviewOverview() {
    const up = await previewOnline();
    return (
        <div className="shell">
            <PageHeader title="IndianChain Preview" meta="The testnet used during the pilot." />
            <section className="panel">
                <Empty
                    title={up ? "Preview overview is not available in this view" : "Preview network offline"}
                    action={<Link href="/records" className="btn">Browse preview records</Link>}
                >
                    {up ? "Use Records to browse the preview data." : "The Preview testnet is not running, so there are no live blocks to show. Switch to Mainnet in the header for the production chain."}
                </Empty>
            </section>
        </div>
    );
}
