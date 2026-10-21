import Link from "next/link";
import type { Metadata } from "next";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { listAnchors } from "@/lib/mainnet-anchors";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, shortHash, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { ArrowRight } from "lucide-react";

export const revalidate = 20;
export const metadata: Metadata = { title: "Cardano anchors" };
const PAGE = 25;

export default async function AnchorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const before = typeof sp.before === "string" && /^\d+$/.test(sp.before) ? Number(sp.before) : null;
    const data = network === "mainnet" ? await listAnchors(PAGE, before).catch(() => null) : null;
    const last = data?.batches[data.batches.length - 1];

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Anchors" }]}
                title="Cardano anchors"
                actions={data && data.total > 0 ? (<div className="glass rounded-[14px] px-5 py-3 text-right"><p className="label">Transactions</p><p className="num mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{fmtInt(data.total)}</p></div>) : undefined}
            />
            <section className="card" aria-label="Cardano anchors">
                {network !== "mainnet" ? <Empty title="Mainnet only" />
                    : !data || !data.batches.length ? <Empty title="Could not load anchors" action={<Link href="/anchors" className="btn">Retry</Link>} />
                    : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <caption className="sr-only">Cardano anchor batches</caption>
                                <thead><tr><th scope="col">Batch</th><th scope="col" className="r">Records</th><th scope="col" className="hidden lg:table-cell">Blocks</th><th scope="col" className="hidden xl:table-cell">Merkle root</th><th scope="col" className="hidden md:table-cell">Cardano transaction</th><th scope="col">Age</th><th scope="col" className="w-10"><span className="sr-only">Open</span></th></tr></thead>
                                <tbody>
                                    {data.batches.map((b) => (
                                        <tr key={b.batch_index}>
                                            <td><Link href={`/anchor/${b.batch_index}`} className="row-link num text-[15px] font-semibold text-white">#{fmtInt(b.batch_index)}</Link></td>
                                            <td className="r num text-white/85">{fmtInt(b.record_count)}</td>
                                            <td className="num hidden text-white/60 lg:table-cell">
                                                {b.l2_from_block != null ? <Link href={`/block/${b.l2_from_block}`} className="z hover:text-white">{fmtInt(b.l2_from_block)}</Link> : "—"}
                                                {b.l2_to_block != null && b.l2_to_block !== b.l2_from_block && <> – <Link href={`/block/${b.l2_to_block}`} className="z hover:text-white">{fmtInt(b.l2_to_block)}</Link></>}
                                            </td>
                                            <td className="mono hidden text-white/50 xl:table-cell" title={b.merkle_root}>{shortHash(b.merkle_root, 10, 6)}</td>
                                            <td className="hidden md:table-cell">{b.cardano_tx_hash ? <a href={cardanoscanTx(network, b.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="z mono link" title={b.cardano_tx_hash}>{shortHash(b.cardano_tx_hash, 8, 6)}</a> : <span className="text-faint">—</span>}</td>
                                            <td className="dim"><span title={utc(b.confirmed_at)}><TimeAgo iso={b.confirmed_at} /></span></td>
                                            <td className="r"><ArrowRight className="row-arrow ml-auto h-4 w-4" aria-hidden /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                {data && data.batches.length > 0 && (
                    <div className="flex items-center justify-between border-t border-line px-6 py-4">
                        {before ? <Link href="/anchors" className="btn">Latest</Link> : <span />}
                        {last && last.batch_index > 0 ? <Link href={`/anchors?before=${last.batch_index}`} className="btn">Older</Link> : <span />}
                    </div>
                )}
            </section>
        </div>
    );
}
