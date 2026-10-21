import Link from "next/link";
import type { Metadata } from "next";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { listAnchors } from "@/lib/mainnet-anchors";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, shortHash, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";

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
        <div className="shell">
            <PageHeader
                crumbs={[{ label: "Overview", href: "/" }, { label: "Cardano anchors" }]}
                title="Cardano anchors"
                meta={data && data.total > 0
                    ? <>Every 100 finalized records are sealed in one Cardano mainnet transaction. <span className="num text-ink">{fmtInt(data.total)}</span> transactions so far.</>
                    : "Every 100 finalized records are sealed in one Cardano mainnet transaction."}
            />
            <section className="panel" aria-label="Cardano anchors">
                {network !== "mainnet" ? <Empty title="Anchors are shown for Mainnet">Switch to Mainnet in the header.</Empty>
                    : !data || !data.batches.length ? <Empty title="Anchors could not be loaded" action={<Link href="/anchors" className="btn">Try again</Link>} />
                    : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <caption className="sr-only">Cardano anchor batches</caption>
                                <thead><tr><th scope="col">Batch</th><th scope="col" className="r">Records</th><th scope="col">IndianChain blocks</th><th scope="col">Merkle root</th><th scope="col">Cardano transaction</th><th scope="col">Anchored</th></tr></thead>
                                <tbody>
                                    {data.batches.map((b) => (
                                        <tr key={b.batch_index}>
                                            <td><Link href={`/anchor/${b.batch_index}`} className="num link">#{fmtInt(b.batch_index)}</Link></td>
                                            <td className="r num text-muted">{fmtInt(b.record_count)}</td>
                                            <td className="num text-muted">
                                                {b.l2_from_block != null ? <Link href={`/block/${b.l2_from_block}`} className="hover:text-ink">{fmtInt(b.l2_from_block)}</Link> : "—"}
                                                {b.l2_to_block != null && b.l2_to_block !== b.l2_from_block && <> – <Link href={`/block/${b.l2_to_block}`} className="hover:text-ink">{fmtInt(b.l2_to_block)}</Link></>}
                                            </td>
                                            <td className="mono text-muted" title={b.merkle_root}>{shortHash(b.merkle_root, 10, 6)}</td>
                                            <td>{b.cardano_tx_hash ? <a href={cardanoscanTx(network, b.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="mono link" title={b.cardano_tx_hash}>{shortHash(b.cardano_tx_hash, 8, 6)}</a> : <span className="text-faint">—</span>}</td>
                                            <td className="text-muted"><span title={utc(b.confirmed_at)}><TimeAgo iso={b.confirmed_at} /></span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                {data && data.batches.length > 0 && (
                    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px]">
                        {before ? <Link href="/anchors" className="text-muted hover:text-ink">← Latest</Link> : <span className="text-faint">Latest anchors</span>}
                        {last && last.batch_index > 0 ? <Link href={`/anchors?before=${last.batch_index}`} className="btn">Older anchors →</Link> : <span />}
                    </div>
                )}
            </section>
        </div>
    );
}
