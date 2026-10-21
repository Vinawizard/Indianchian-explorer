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
            <div className="shell">
                <PageHeader crumbs={crumbs} title={Number.isFinite(n) ? <>Block <span className="num">{fmtInt(n)}</span></> : "Block"} />
                <section className="panel">
                    {failed ? (
                        <Empty title="The node did not answer" action={<Link href={`/block/${id}`} className="btn">Try again</Link>}>
                            {network === "preview" ? "The Preview testnet is offline." : "IndianChain could not be reached just now."}
                        </Empty>
                    ) : (
                        <Empty title={Number.isFinite(n) ? "This block does not exist yet" : "That is not a block number"} action={<Link href="/blocks" className="btn">Latest blocks</Link>}>
                            Block numbers are whole numbers up to the current height. You can also search by block hash in the header.
                        </Empty>
                    )}
                </section>
            </div>
        );
    }

    const records = network === "mainnet"
        ? await queryMainnetRecords({ find: String(n), limit: 500 }).catch(() => ({ rows: [], total: 0 }))
        : { rows: [], total: 0 };

    return (
        <div className="shell">
            <PageHeader
                crumbs={crumbs}
                title={<>Block <span className="num">{fmtInt(block.number)}</span></>}
                meta={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        {block.finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}
                        <span>{block.timestamp ? <><TimeAgo iso={block.timestamp} /> · </> : null}{block.extrinsics.length} extrinsics · {fmtInt(records.rows.length)} records</span>
                    </span>
                }
                actions={
                    <>
                        <Link href={`/block/${block.number - 1}`} aria-disabled={block.number === 0} className={`btn ${block.number === 0 ? "pointer-events-none opacity-40" : ""}`}><ChevronLeft className="h-4 w-4" aria-hidden />Previous</Link>
                        <Link href={`/block/${block.number + 1}`} aria-disabled={block.number >= block.bestHead} className={`btn ${block.number >= block.bestHead ? "pointer-events-none opacity-40" : ""}`}>Next<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                    </>
                }
            />

            <section className="panel" aria-labelledby="overview">
                <div className="panel-head"><h2 id="overview" className="panel-title">Block</h2></div>
                <KV rows={[
                    { label: "Block hash", value: <Hash value={block.hash} full /> },
                    { label: "Parent", value: block.number > 0 ? <Hash value={block.parentHash} href={`/block/${block.number - 1}`} full /> : "—" },
                    { label: "Produced at", value: <span className="num">{utc(block.timestamp)}</span> },
                    { label: "Finality", value: block.finalized ? <span>Final. The chain has finalized up to block <span className="num">{fmtInt(block.finalizedHead)}</span>.</span> : <span>Not final yet. Finalized head is <span className="num">{fmtInt(block.finalizedHead)}</span>.</span> },
                    { label: "State root", value: <Hash value={block.stateRoot} full /> },
                    { label: "Extrinsics root", value: <Hash value={block.extrinsicsRoot} full /> },
                ]} />
            </section>

            {network === "mainnet" && (
                <section className="panel mt-6" aria-labelledby="records">
                    <div className="panel-head"><h2 id="records" className="panel-title">Records in this block</h2><span className="num text-[13px] text-faint">{fmtInt(records.rows.length)}</span></div>
                    {records.rows.length
                        ? <RecordsTable rows={records.rows} cols={["record", "version", "farmer", "tx", "anchor"]} caption="Records in this block" />
                        : <p className="px-4 py-5 text-[14px] text-muted">No records were submitted in this block. It carries only the chain&apos;s own extrinsics.</p>}
                </section>
            )}

            <section className="panel mt-6" aria-labelledby="extrinsics">
                <div className="panel-head"><h2 id="extrinsics" className="panel-title">Extrinsics</h2><span className="num text-[13px] text-faint">{block.extrinsics.length}</span></div>
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
                                            <summary className="cursor-pointer list-none"><span className="mono text-ink">{x.section}.{x.method}</span> <span className="text-[12px] text-faint">arguments</span></summary>
                                            <pre className="mono mt-2 max-h-72 max-w-[640px] overflow-auto bg-ground p-3 text-[12px] leading-5 text-muted">{JSON.stringify(x.args, null, 2)}</pre>
                                        </details>
                                    </td>
                                    <td><Hash value={x.hash} head={8} tail={6} /></td>
                                    <td>{x.signer ? <span className="mono text-muted" title={x.signer}>{shortHash(x.signer, 6, 6)}</span> : <span className="text-faint">Inherent</span>}</td>
                                    <td>{x.status === "success" ? <Status tone="positive">Success</Status> : x.status === "failed" ? <Status tone="negative">Failed</Status> : <Status>No result event</Status>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
