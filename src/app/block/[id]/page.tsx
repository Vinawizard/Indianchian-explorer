import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getBlockDetail } from "@/lib/block-data";
import { queryMainnetRecords } from "@/lib/mainnet-records";
import { fmtInt, shortHash, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { KV } from "@/components/ui/kv";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { RecordsTable } from "@/components/records/records-table";
import { JsonView } from "@/components/ui/json-view";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    return { title: /^\d+$/.test(id) ? `Block ${Number(id).toLocaleString("en-US")}` : "Block" };
}

export default async function BlockPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const network = await resolveNetworkFromCookies();
    const n = /^\d+$/.test(id) ? Number(id) : NaN;
    const crumbs = [{ label: "Blocks", href: "/blocks" }, { label: Number.isFinite(n) ? fmtInt(n) : id }];

    let block = null as Awaited<ReturnType<typeof getBlockDetail>>;
    let failed = false;
    if (Number.isFinite(n)) { try { block = await getBlockDetail(network, n); } catch { failed = true; } }

    if (!block) {
        return (
            <div className="page">
                <PageHeader crumbs={crumbs} title={Number.isFinite(n) ? <>Block <span className="dot">#{fmtInt(n)}</span></> : "Block"} />
                <section className="card">
                    {failed ? (
                        <Empty title={network === "preview" ? "Preview network offline" : "Node unavailable"} action={<Link href={`/block/${id}`} className="btn">Retry</Link>} />
                    ) : (
                        <Empty title="Block not found" action={<Link href="/blocks" className="btn">Latest blocks</Link>} />
                    )}
                </section>
            </div>
        );
    }

    const records = network === "mainnet"
        ? await queryMainnetRecords({ find: String(n), limit: 500 }).catch(() => ({ rows: [], total: 0 }))
        : { rows: [], total: 0 };

    return (
        <div className="page">
            <PageHeader
                crumbs={crumbs}
                title={<>Block <span className="dot">#{fmtInt(block.number)}</span></>}
                meta={
                    <>
                        {block.finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}
                        <span className="text-white/60">{block.timestamp && <><TimeAgo iso={block.timestamp} /> · </>}{block.extrinsics.length} extrinsics · {fmtInt(records.rows.length)} records</span>
                    </>
                }
                actions={
                    <>
                        <Link href={`/block/${block.number - 1}`} aria-disabled={block.number === 0} className={`btn ${block.number === 0 ? "pointer-events-none opacity-40" : ""}`}><ChevronLeft className="h-4 w-4" aria-hidden />Prev</Link>
                        <Link href={`/block/${block.number + 1}`} aria-disabled={block.number >= block.bestHead} className={`btn ${block.number >= block.bestHead ? "pointer-events-none opacity-40" : ""}`}>Next<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                    </>
                }
            />

            <section className="card" aria-labelledby="overview">
                <div className="card-head"><h2 id="overview" className="section-title">Overview</h2></div>
                <KV rows={[
                    { label: "Block hash", value: <Hash value={block.hash} full /> },
                    { label: "Parent", value: block.number > 0 ? <Hash value={block.parentHash} href={`/block/${block.number - 1}`} full /> : "—" },
                    { label: "Timestamp", value: <span className="num">{utc(block.timestamp)}</span> },
                    { label: "State root", value: <Hash value={block.stateRoot} full /> },
                    { label: "Extrinsics root", value: <Hash value={block.extrinsicsRoot} full /> },
                ]} />
            </section>

            {network === "mainnet" && (
                <section className="card mt-6" aria-labelledby="records">
                    <div className="card-head"><h2 id="records" className="section-title">Records</h2><span className="dot text-lg text-white/60">{fmtInt(records.rows.length)}</span></div>
                    {records.rows.length
                        ? <RecordsTable rows={records.rows} cols={["record", "version", "farmer", "anchor"]} caption="Records in this block" />
                        : <p className="label px-6 py-6">No records in this block</p>}
                </section>
            )}

            <section className="card mt-6" aria-labelledby="extrinsics">
                <div className="card-head"><h2 id="extrinsics" className="section-title">Extrinsics</h2><span className="dot text-lg text-white/60">{block.extrinsics.length}</span></div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <caption className="sr-only">Extrinsics</caption>
                        <thead><tr><th scope="col" className="r">#</th><th scope="col">Call</th><th scope="col">Hash</th><th scope="col">Signer</th><th scope="col">Result</th></tr></thead>
                        <tbody>
                            {block.extrinsics.map((x) => (
                                <tr key={x.index}>
                                    <td className="r num text-muted">{x.index}</td>
                                    <td className="whitespace-normal py-2">
                                        <details>
                                            <summary className="cursor-pointer list-none"><span className="mono text-white">{x.section}.{x.method}</span> <span className="label ml-2">Args</span></summary>
                                            <div className="mt-2 max-w-[680px] border border-line"><JsonView data={x.args} maxHeight={300} /></div>
                                        </details>
                                    </td>
                                    <td><Hash value={x.hash} head={8} tail={6} /></td>
                                    <td>{x.signer ? <span className="mono text-muted" title={x.signer}>{shortHash(x.signer, 6, 6)}</span> : <span className="tag">Inherent</span>}</td>
                                    <td>{x.status === "success" ? <Status tone="positive">Success</Status> : x.status === "failed" ? <Status tone="negative">Failed</Status> : <Status>Unknown</Status>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
