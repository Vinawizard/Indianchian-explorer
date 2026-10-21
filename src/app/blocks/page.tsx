import Link from "next/link";
import type { Metadata } from "next";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { listBlocks } from "@/lib/block-data";
import { fmtInt, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";

export const revalidate = 0;
export const metadata: Metadata = { title: "Blocks" };
const PAGE = 25;

export default async function BlocksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const before = typeof sp.before === "string" && /^\d+$/.test(sp.before) ? Number(sp.before) : null;
    let data: Awaited<ReturnType<typeof listBlocks>> | null = null;
    try { data = await listBlocks(network, PAGE, before); } catch { data = null; }
    const last = data?.blocks[data.blocks.length - 1];

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Blocks" }]}
                title="Blocks"
                actions={data ? (<div className="glass rounded-[14px] px-5 py-3 text-right"><p className="label">Finalized</p><p className="num mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{fmtInt(data.finalized)}</p></div>) : undefined}
            />
            <section className="card" aria-label="Blocks">
                {!data ? (
                    <Empty title={network === "preview" ? "Preview network offline" : "Node unavailable"} action={<Link href="/blocks" className="btn">Retry</Link>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <caption className="sr-only">Blocks</caption>
                            <thead><tr><th scope="col">Block</th><th scope="col">Age</th><th scope="col" className="hidden lg:table-cell">Timestamp (UTC)</th><th scope="col" className="hidden md:table-cell">Hash</th><th scope="col" className="r">Extrinsics</th><th scope="col">Status</th></tr></thead>
                            <tbody>
                                {data.blocks.map((b) => (
                                    <tr key={b.number}>
                                        <td><Link href={`/block/${b.number}`} className="num font-semibold text-white hover:text-blue-text">#{fmtInt(b.number)}</Link></td>
                                        <td className="text-muted"><TimeAgo iso={b.timestamp} /></td>
                                        <td className="num hidden text-[13px] text-white/50 lg:table-cell">{utc(b.timestamp).replace(" UTC", "")}</td>
                                        <td className="hidden md:table-cell"><Hash value={b.hash} head={12} tail={8} /></td>
                                        <td className="r num text-muted">{b.extrinsics}</td>
                                        <td>{b.number <= data!.finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {data && (
                    <div className="flex items-center justify-between border-t border-line px-6 py-4">
                        {before ? <Link href="/blocks" className="btn">Latest</Link> : <span />}
                        {last && last.number > 0 ? <Link href={`/blocks?before=${last.number}`} className="btn">Older</Link> : <span />}
                    </div>
                )}
            </section>
        </div>
    );
}
