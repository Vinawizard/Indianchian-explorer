import Link from "next/link";
import type { Metadata } from "next";
import { Box, CheckCircle2, ChevronLeft, ChevronRight, Clock, Hash as HashIcon, Layers } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { listBlocks } from "@/lib/block-data";
import { fmtInt, shortHash, utc } from "@/lib/format";
import { PageHeader, StatBox } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { CopyButton } from "@/components/ui/copy-button";
import { Th } from "@/components/ui/th";

export const revalidate = 0;
export const metadata: Metadata = { title: "Blocks" };
const PAGE = 25;

export default async function BlocksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const before = typeof sp.before === "string" && /^\d+$/.test(sp.before) ? Number(sp.before) : null;
    let data: Awaited<ReturnType<typeof listBlocks>> | null = null;
    try { data = await listBlocks(network, PAGE, before); } catch { data = null; }
    const first = data?.blocks[0];
    const last = data?.blocks[data.blocks.length - 1];

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Blocks" }]}
                title="Blocks"
                actions={data ? <StatBox label="Network height" items={[{ value: fmtInt(data.best), unit: "Best" }, { value: fmtInt(data.finalized), unit: "Finalized" }]} /> : undefined}
            />
            <section className="card" aria-label="Blocks">
                {!data ? (
                    <Empty title={network === "preview" ? "Preview network offline" : "Node unavailable"} action={<Link href="/blocks" className="btn">Retry</Link>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <caption className="sr-only">Blocks</caption>
                            <thead><tr>
                                <Th icon={Box}>Block</Th><Th icon={Clock}>Age</Th><Th icon={Clock} className="hidden lg:table-cell">Timestamp (UTC)</Th>
                                <Th icon={HashIcon} className="hidden md:table-cell">Hash</Th><Th icon={Layers} className="hidden sm:table-cell">Extrinsics</Th><Th icon={CheckCircle2}>Status</Th>
                                <th scope="col" className="w-12"><span className="sr-only">Open</span></th>
                            </tr></thead>
                            <tbody>
                                {data.blocks.map((b) => (
                                    <tr key={b.number}>
                                        <td><Link href={`/block/${b.number}`} className="row-link blk">{b.number}</Link></td>
                                        <td><TimeAgo iso={b.timestamp} /></td>
                                        <td className="num hidden lg:table-cell">{utc(b.timestamp).replace(" UTC", "")}</td>
                                        <td className="hidden md:table-cell">
                                            <span className="z inline-flex items-center gap-1"><span className="mono text-white/50" title={b.hash}>{shortHash(b.hash, 18, 10)}</span><span className="row-copy"><CopyButton value={b.hash} label="Copy hash" /></span></span>
                                        </td>
                                        <td className="num hidden text-[14px] text-white sm:table-cell">{b.extrinsics}</td>
                                        <td>{b.number <= data!.finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}</td>
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
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Feed_segment <span className="num text-white">#{first.number}–#{last.number}</span></p>
                    <div className="flex items-center gap-2">
                        {before ? <Link href="/blocks" className="btn !px-4"><ChevronLeft className="h-4 w-4" aria-hidden />Latest</Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled><ChevronLeft className="h-4 w-4" aria-hidden />Latest</span>}
                        {last.number > 0 ? <Link href={`/blocks?before=${last.number}`} className="btn !px-4">Older<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled>Older<ChevronRight className="h-4 w-4" aria-hidden /></span>}
                    </div>
                </div>
            )}
        </div>
    );
}
