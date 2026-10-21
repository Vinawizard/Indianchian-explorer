import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { queryMainnetRecords, type MainnetRecordRow } from "@/lib/mainnet-records";
import { getAnchor } from "@/lib/mainnet-anchors";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, recordHref, recordTypeLabel, shortId, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { KV } from "@/components/ui/kv";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";

export const revalidate = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const VERIFY_API = "https://ic-node.trivolvetech.com/integration-api";

function parse(id: string): { recordId: string; version: number | null } | null {
    const s = decodeURIComponent(id).toLowerCase();
    const m = s.match(/^([0-9a-f-]{36})(?:_(\d+))?$/);
    if (!m || !UUID.test(m[1])) return null;
    return { recordId: m[1], version: m[2] ? Number(m[2]) : null };
}

async function load(id: string) {
    const p = parse(id);
    if (!p) return null;
    const { rows } = await queryMainnetRecords({ find: p.recordId, limit: 60, noCount: true });
    const versions = rows.filter((r) => r.record_id === p.recordId).sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
    if (!versions.length) return null;
    const current = p.version != null ? versions.find((v) => v.version === p.version) ?? null : versions[versions.length - 1];
    return current ? { versions, current } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const p = parse(id);
    return { title: p ? `Record ${shortId(p.recordId)}${p.version ? ` v${p.version}` : ""}` : "Record" };
}

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const network = await resolveNetworkFromCookies();
    if (network !== "mainnet") {
        return (
            <div className="shell">
                <PageHeader crumbs={[{ label: "Records", href: "/records" }, { label: "Record" }]} title="Record" />
                <section className="panel"><Empty title="Record pages show Mainnet records">Switch to Mainnet in the header to open this record.</Empty></section>
            </div>
        );
    }
    const data = await load(id);
    if (!data) notFound();
    const { versions, current: r } = data;
    const anchored = r.batch_index != null || !!r.cardano_tx_hash;
    const batch = r.batch_index != null ? await getAnchor(r.batch_index).catch(() => null) : null;
    const typeLabel = recordTypeLabel(r.record_type);
    const rid = r.record_id!;
    const latest = versions[versions.length - 1];

    return (
        <div className="shell">
            <PageHeader
                crumbs={[{ label: "Records", href: "/records" }, { label: typeLabel, href: `/records?type=${r.record_type}` }, { label: shortId(rid) }]}
                title={<>{typeLabel} <span className="num text-muted">v{r.version}</span></>}
                meta={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Status tone="positive">Finalized on IndianChain</Status>
                        {anchored ? <Status tone="positive">Anchored on Cardano</Status> : <Status tone="warning">Waiting for Cardano anchor</Status>}
                        <span>
                            In block <Link href={`/block/${r.block_number}`} className="num link">{fmtInt(r.block_number)}</Link>
                            {r.confirmed_at && <>, <TimeAgo iso={r.confirmed_at} /></>}
                            {r.version !== latest.version && <> · a newer version exists: <Link href={recordHref(rid, latest.version)} className="link">v{latest.version}</Link></>}
                        </span>
                    </span>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="min-w-0 space-y-6 lg:col-span-8">
                    <section className="panel" aria-labelledby="summary">
                        <div className="panel-head"><h2 id="summary" className="panel-title">Record</h2></div>
                        <KV rows={[
                            { label: "Record ID", value: <Hash value={rid} full /> },
                            { label: "Type", value: typeLabel },
                            { label: "Version", value: <span><span className="num">{r.version}</span> <span className="text-faint">of {versions.length} on chain</span></span> },
                            ...(r.farmer_id && r.record_type !== "farmer" ? [{ label: "Farmer", value: <span className="inline-flex flex-wrap items-center gap-2"><Hash value={r.farmer_id} href={`/record/${r.farmer_id}`} head={13} tail={12} /><Link href={`/records?farmer=${r.farmer_id}`} className="text-[13px] text-muted hover:text-ink">All records of this farmer</Link></span> }] : []),
                            ...(r.record_type === "farmer" ? [{ label: "Linked records", value: <Link href={`/records?farmer=${rid}`} className="link">Agricultural and credit records of this farmer</Link> }] : []),
                            ...(r.parent_record_id && r.parent_record_id !== r.farmer_id ? [{ label: "Linked to", value: <Hash value={r.parent_record_id} href={`/record/${r.parent_record_id}`} head={13} tail={12} /> }] : []),
                            { label: "Recorded at source", value: <span className="num">{utc(r.timestamp)}</span>, hint: "Time on the record itself" },
                        ]} />
                    </section>

                    <section className="panel" aria-labelledby="onchain">
                        <div className="panel-head"><h2 id="onchain" className="panel-title">On IndianChain</h2></div>
                        <KV rows={[
                            { label: "Block", value: <Link href={`/block/${r.block_number}`} className="num link">{fmtInt(r.block_number)}</Link> },
                            { label: "Finalized at", value: <span className="num">{utc(r.confirmed_at)}</span> },
                            { label: "Transaction hash", value: <Hash value={r.tx_hash} full /> },
                            { label: "Position in block", value: r.tx_index != null ? <span className="num">Extrinsic {r.tx_index}</span> : "—" },
                            { label: "Payload hash", value: <Hash value={r.payload_hash} full />, hint: "Commitment stored on chain" },
                            { label: "Submitted by", value: <Hash value={r.signer_address} head={10} tail={8} />, hint: "Authorised oracle account" },
                        ]} />
                    </section>

                    <section className="panel" aria-labelledby="cardano">
                        <div className="panel-head">
                            <h2 id="cardano" className="panel-title">Cardano anchor</h2>
                            {anchored ? <Status tone="positive">Anchored</Status> : <Status tone="warning">Waiting</Status>}
                        </div>
                        {anchored ? (
                            <KV rows={[
                                { label: "Batch", value: r.batch_index != null ? <span><Link href={`/anchor/${r.batch_index}`} className="num link">#{fmtInt(r.batch_index)}</Link> <span className="text-faint">· {fmtInt(batch?.record_count ?? 100)} records sealed together</span></span> : "—" },
                                { label: "Merkle root", value: <Hash value={r.merkle_root ?? batch?.merkle_root} full /> },
                                { label: "Cardano transaction", value: r.cardano_tx_hash ? <Hash value={r.cardano_tx_hash} href={cardanoscanTx(network, r.cardano_tx_hash)} external full /> : "—" },
                                { label: "Anchored at", value: <span className="num">{utc(batch?.confirmed_at)}</span> },
                                ...(batch?.cardano_block_number ? [{ label: "Cardano block", value: <span className="num">{fmtInt(batch.cardano_block_number)}</span> }] : []),
                            ]} />
                        ) : (
                            <p className="px-4 py-5 text-[14px] text-muted">This version is final on IndianChain. It is sealed on Cardano when its batch of 100 records is anchored, usually the same working day.</p>
                        )}
                    </section>

                    {anchored && (
                        <section className="panel" aria-labelledby="verify">
                            <div className="panel-head"><h2 id="verify" className="panel-title">Verify it yourself</h2></div>
                            <ol className="list-decimal space-y-3 px-4 py-4 pl-9 text-[14px] text-muted marker:text-faint">
                                <li>Open the live proof. It reads the block from an IndianChain node, rebuilds the batch&apos;s Merkle root and compares it with Cardano:{" "}
                                    <a className="link break-all" target="_blank" rel="noopener noreferrer" href={`${VERIFY_API}/api/mainnet/records/${rid}/proof?version=${r.version}`}>proof for this version</a>.</li>
                                <li>Open the Cardano transaction and read metadata label 1804: it carries batch #{fmtInt(r.batch_index)} and the same Merkle root shown above.</li>
                                <li>Or check it in plain language on the <a className="link" target="_blank" rel="noopener noreferrer" href={`${VERIFY_API}/verify?id=${rid}`}>Verify Record page</a>.</li>
                            </ol>
                        </section>
                    )}
                </div>

                <aside className="min-w-0 space-y-6 lg:col-span-4">
                    <section className="panel" aria-labelledby="versions">
                        <div className="panel-head"><h2 id="versions" className="panel-title">Version history</h2><span className="text-[13px] text-faint">{versions.length} on chain</span></div>
                        <ol className="py-2">
                            {[...versions].reverse().map((v) => {
                                const on = v.version === r.version;
                                const va = v.batch_index != null || !!v.cardano_tx_hash;
                                return (
                                    <li key={v.payload_id}>
                                        <Link href={recordHref(rid, v.version)} aria-current={on ? "page" : undefined}
                                            className={`relative grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors ${on ? "bg-raised" : "hover:bg-raised"}`}>
                                            {on && <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-accent" />}
                                            <span className={`num text-[13px] ${on ? "text-ink" : "text-muted"}`}>v{v.version}</span>
                                            <span className="min-w-0 text-[13px] text-muted">
                                                Block <span className="num">{fmtInt(v.block_number)}</span>
                                                <span className="block text-[12px] text-faint"><TimeAgo iso={v.confirmed_at} /></span>
                                            </span>
                                            <span className={`text-[12px] ${va ? "text-positive" : "text-warning"}`}>{va ? "Anchored" : "Waiting"}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>

                    <details className="panel group">
                        <summary className="panel-head cursor-pointer list-none border-b-0 group-open:border-b">
                            <span className="panel-title">Raw data</span>
                            <span className="text-[13px] text-muted group-open:hidden">Show JSON</span>
                            <span className="hidden text-[13px] text-muted group-open:inline">Hide</span>
                        </summary>
                        <pre className="mono max-h-[420px] overflow-auto px-4 py-3 text-[12px] leading-5 text-muted">{JSON.stringify(stripUndefined(r), null, 2)}</pre>
                    </details>
                </aside>
            </div>
        </div>
    );
}

function stripUndefined(r: MainnetRecordRow) {
    return Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));
}
