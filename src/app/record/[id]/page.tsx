import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { queryMainnetRecords } from "@/lib/mainnet-records";
import { getAnchor } from "@/lib/mainnet-anchors";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, recordHref, recordTypeLabel, shortId, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { KV } from "@/components/ui/kv";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { JsonView } from "@/components/ui/json-view";

export const revalidate = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const VERIFY_API = "https://ic-node.trivolvetech.com/integration-api";

function parse(id: string): { recordId: string; version: number | null } | null {
    const m = decodeURIComponent(id).toLowerCase().match(/^([0-9a-f-]{36})(?:_(\d+))?$/);
    if (!m || !UUID.test(m[1])) return null;
    return { recordId: m[1], version: m[2] ? Number(m[2]) : null };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const p = parse((await params).id);
    return { title: p ? `Event ${shortId(p.recordId)}${p.version ? ` v${p.version}` : ""}` : "Event" };
}

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const network = await resolveNetworkFromCookies();
    if (network !== "mainnet") {
        return <div className="page"><PageHeader crumbs={[{ label: "Network events", href: "/events" }]} title="Event" /><div className="card"><Empty title="Mainnet only" /></div></div>;
    }
    const p = parse(id);
    if (!p) notFound();
    const { rows } = await queryMainnetRecords({ find: p.recordId, limit: 60, noCount: true });
    const versions = rows.filter((r) => r.record_id === p.recordId).sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
    const r = p.version != null ? versions.find((v) => v.version === p.version) : versions[versions.length - 1];
    if (!r) notFound();

    const rid = r.record_id!;
    const anchored = r.batch_index != null || !!r.cardano_tx_hash;
    const batch = r.batch_index != null ? await getAnchor(r.batch_index).catch(() => null) : null;
    const typeLabel = recordTypeLabel(r.record_type);
    const latest = versions[versions.length - 1];
    const { batch_index: _b, parent_record_id: _p, ...raw } = r;

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "Network events", href: "/events" }, { label: typeLabel, href: `/events?type=${r.record_type}` }, { label: shortId(rid) }]}
                title={<>{typeLabel} <span className="num font-normal text-white/60">v{r.version}</span></>}
                meta={
                    <>
                        <Status tone="positive">Finalized</Status>
                        {anchored ? <Status tone="positive">Anchored</Status> : <Status>Anchor pending</Status>}
                        <span className="text-[10px] uppercase tracking-[0.1em] text-muted">Block <Link href={`/block/${r.block_number}`} className="num link">#{r.block_number}</Link> · <TimeAgo iso={r.confirmed_at} /></span>
                        {r.version !== latest.version && <Link href={recordHref(rid, latest.version)} className="chip chip-blue">Latest is v{latest.version}</Link>}
                    </>
                }
            />

            <div className="space-y-6">
                <section className="card" aria-labelledby="rec">
                    <div className="card-head"><div><h2 id="rec" className="section-title">Event</h2><p className="card-sub">{typeLabel} · version {r.version}</p></div></div>
                    <KV rows={[
                        { label: "Event ID", value: <Hash value={rid} full /> },
                        { label: "Type", value: typeLabel },
                        { label: "Version", value: <span className="num">{r.version}</span> },
                        ...(r.farmer_id && r.record_type !== "farmer" ? [{ label: "Farmer ID", value: <Hash value={r.farmer_id} full /> }] : []),
                        { label: "Recorded at", value: <span className="num">{utc(r.timestamp)}</span> },
                    ]} />
                </section>

                <section className="card" aria-labelledby="chain">
                    <div className="card-head"><div><h2 id="chain" className="section-title">IndianChain</h2><p className="card-sub">Block {r.block_number} · extrinsic {r.tx_index ?? "—"}</p></div></div>
                    <KV rows={[
                        { label: "Block", value: <Link href={`/block/${r.block_number}`} className="num link">#{r.block_number}</Link> },
                        { label: "Finalized at", value: <span className="num">{utc(r.confirmed_at)}</span> },
                        { label: "Transaction", value: <Hash value={r.tx_hash} full /> },
                        { label: "Extrinsic", value: <span className="num">{r.tx_index ?? "—"}</span> },
                        { label: "Payload hash", value: <Hash value={r.payload_hash} full /> },
                        { label: "Submitter", value: <Hash value={r.signer_address} head={10} tail={8} /> },
                    ]} />
                </section>

                <section className="card" aria-labelledby="cardano">
                    <div className="card-head">
                        <div><h2 id="cardano" className="section-title">Cardano anchor</h2><p className="card-sub">{anchored && r.batch_index != null ? `Batch ${fmtInt(r.batch_index)}` : "Pending"}</p></div>
                        {anchored && (
                            <div className="flex flex-wrap gap-2">
                                <a href={`${VERIFY_API}/api/mainnet/records/${rid}/proof?version=${r.version}`} target="_blank" rel="noopener noreferrer" className="btn !h-9">Verify proof<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></a>
                                {r.cardano_tx_hash && <a href={cardanoscanTx(network, r.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="btn !h-9">Cardanoscan<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></a>}
                            </div>
                        )}
                    </div>
                    {anchored ? (
                        <KV rows={[
                            { label: "Batch", value: r.batch_index != null ? <Link href={`/anchor/${r.batch_index}`} className="num link">#{fmtInt(r.batch_index)}</Link> : "—" },
                            { label: "Merkle root", value: <Hash value={r.merkle_root ?? batch?.merkle_root} full /> },
                            { label: "Cardano tx", value: r.cardano_tx_hash ? <Hash value={r.cardano_tx_hash} href={cardanoscanTx(network, r.cardano_tx_hash)} external full /> : "—" },
                            { label: "Anchored at", value: <span className="num">{utc(batch?.confirmed_at)}</span> },
                        ]} />
                    ) : (
                        <div className="flex items-center gap-3 px-8 pb-8"><Status>Pending</Status><span className="text-[10px] uppercase tracking-[0.1em] text-muted">Included in the next anchor batch</span></div>
                    )}
                </section>

                <details className="card group">
                    <summary className="card-head cursor-pointer list-none">
                        <div><h2 className="section-title">JSON</h2><p className="card-sub">Json_export</p></div>
                        <span className="label group-open:hidden">Show</span>
                        <span className="label hidden group-open:inline">Hide</span>
                    </summary>
                    <JsonView data={raw} />
                </details>
            </div>
        </div>
    );
}
