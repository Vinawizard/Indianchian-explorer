import Link from "next/link";
import type { Metadata } from "next";
import { Box, CheckCircle2, ChevronLeft, ChevronRight, Clock, GitMerge, Hash as HashIcon, Layers } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { listAnchors } from "@/lib/mainnet-anchors";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, shortHash, utc } from "@/lib/format";
import { PageHeader, StatBox } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { CardanoIcon } from "@/components/ui/cardano-icon";
import { Th } from "@/components/ui/th";

export const revalidate = 20;
export const metadata: Metadata = { title: "Cardano anchors" };
const PAGE = 25;

export default async function AnchorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const before = typeof sp.before === "string" && /^\d+$/.test(sp.before) ? Number(sp.before) : null;
    const data = network === "mainnet" ? await listAnchors(PAGE, before).catch(() => null) : null;
    const first = data?.batches[0];
    const last = data?.batches[data.batches.length - 1];

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Cardano anchors" }]}
                title="Cardano anchors"
                actions={data && data.total > 0 ? <StatBox label="Anchored on Cardano" items={[{ value: fmtInt(data.total), unit: "Transactions" }]} /> : undefined}
            />
            <section className="card" aria-label="Cardano anchors">
                {network !== "mainnet" ? <Empty title="Mainnet only" />
                    : !data || !data.batches.length ? <Empty title="Could not load anchors" action={<Link href="/anchors" className="btn">Retry</Link>} />
                    : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <caption className="sr-only">Cardano anchor batches</caption>
                                <thead><tr>
                                    <Th icon={CardanoIcon}>Batch</Th><Th icon={Layers}>Events</Th><Th icon={Box} className="hidden lg:table-cell">Blocks</Th>
                                    <Th icon={GitMerge} className="hidden xl:table-cell">Merkle root</Th><Th icon={HashIcon} className="hidden md:table-cell">Cardano transaction</Th>
                                    <Th icon={Clock}>Age</Th><Th icon={CheckCircle2} className="hidden sm:table-cell">Status</Th><th scope="col" className="w-12"><span className="sr-only">Open</span></th>
                                </tr></thead>
                                <tbody>
                                    {data.batches.map((b) => (
                                        <tr key={b.batch_index}>
                                            <td><Link href={`/anchor/${b.batch_index}`} className="row-link blk">{fmtInt(b.batch_index)}</Link></td>
                                            <td className="num text-[14px] text-white">{fmtInt(b.record_count)}</td>
                                            <td className="num hidden lg:table-cell">
                                                {b.l2_from_block != null ? <Link href={`/block/${b.l2_from_block}`} className="z transition-colors hover:text-blue-text">#{b.l2_from_block}</Link> : "—"}
                                                {b.l2_to_block != null && b.l2_to_block !== b.l2_from_block && <> – <Link href={`/block/${b.l2_to_block}`} className="z transition-colors hover:text-blue-text">#{b.l2_to_block}</Link></>}
                                            </td>
                                            <td className="mono hidden text-white/50 xl:table-cell" title={b.merkle_root}>{shortHash(b.merkle_root, 10, 6)}</td>
                                            <td className="hidden md:table-cell">{b.cardano_tx_hash ? <a href={cardanoscanTx(network, b.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="z mono link" title={b.cardano_tx_hash}>{shortHash(b.cardano_tx_hash, 10, 8)}</a> : <span className="text-white/30">—</span>}</td>
                                            <td><span title={utc(b.confirmed_at)}><TimeAgo iso={b.confirmed_at} /></span></td>
                                            <td className="hidden sm:table-cell"><Status tone="positive">Confirmed</Status></td>
                                            <td className="r"><span className="row-go" aria-hidden><ChevronRight className="h-4 w-4" /></span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
            </section>
            {data && first && last && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Feed_segment <span className="num text-white">#{fmtInt(first.batch_index)}–#{fmtInt(last.batch_index)}</span> / <span className="num text-white">{fmtInt(data.total)}</span> batches</p>
                    <div className="flex items-center gap-2">
                        {before ? <Link href="/anchors" className="btn !px-4"><ChevronLeft className="h-4 w-4" aria-hidden />Latest</Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled><ChevronLeft className="h-4 w-4" aria-hidden />Latest</span>}
                        {last.batch_index > 0 ? <Link href={`/anchors?before=${last.batch_index}`} className="btn !px-4">Older<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled>Older<ChevronRight className="h-4 w-4" aria-hidden /></span>}
                    </div>
                </div>
            )}
        </div>
    );
}
