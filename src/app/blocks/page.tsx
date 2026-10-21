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
        <div className="shell">
            <PageHeader
                crumbs={[{ label: "Overview", href: "/" }, { label: "Blocks" }]}
                title="Blocks"
                meta={data ? <>Best block <span className="num text-ink">{fmtInt(data.best)}</span> · finalized <span className="num text-ink">{fmtInt(data.finalized)}</span> · a new block every 6 seconds.</> : undefined}
            />
            <section className="panel" aria-label="Blocks">
                {!data ? (
                    <Empty title="The node did not answer" action={<Link href="/blocks" className="btn">Try again</Link>}>
                        {network === "preview" ? "The Preview testnet is offline." : "IndianChain could not be reached just now."}
                    </Empty>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <caption className="sr-only">Blocks</caption>
                            <thead><tr><th scope="col">Block</th><th scope="col">Produced</th><th scope="col">Time (UTC)</th><th scope="col">Hash</th><th scope="col" className="r">Extrinsics</th><th scope="col">Status</th></tr></thead>
                            <tbody>
                                {data.blocks.map((b) => (
                                    <tr key={b.number}>
                                        <td><Link href={`/block/${b.number}`} className="num link">{fmtInt(b.number)}</Link></td>
                                        <td className="text-muted"><TimeAgo iso={b.timestamp} /></td>
                                        <td className="num text-[13px] text-faint">{utc(b.timestamp).replace(" UTC", "")}</td>
                                        <td><Hash value={b.hash} head={10} tail={8} /></td>
                                        <td className="r num text-muted">{b.extrinsics}</td>
                                        <td>{b.number <= data!.finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {data && (
                    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px]">
                        {before ? <Link href="/blocks" className="text-muted hover:text-ink">← Latest</Link> : <span className="text-faint">Latest blocks</span>}
                        {last && last.number > 0 ? <Link href={`/blocks?before=${last.number}`} className="btn">Older blocks →</Link> : <span />}
                    </div>
                )}
            </section>
        </div>
    );
}
