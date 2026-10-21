import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getAnchor, listAnchors } from "@/lib/mainnet-anchors";
import { queryMainnetRecords } from "@/lib/mainnet-records";
import { cardanoscanTx } from "@/lib/cardanoscan";
import { fmtInt, utc } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { KV } from "@/components/ui/kv";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";
import { Empty } from "@/components/ui/empty";
import { RecordsTable } from "@/components/records/records-table";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ index: string }> }): Promise<Metadata> {
    const { index } = await params;
    return { title: /^\d+$/.test(index) ? `Anchor #${Number(index).toLocaleString("en-US")}` : "Anchor" };
}

export default async function AnchorPage({ params }: { params: Promise<{ index: string }> }) {
    const { index } = await params;
    const network = await resolveNetworkFromCookies();
    if (!/^\d+$/.test(index)) notFound();
    const n = Number(index);
    if (network !== "mainnet") {
        return <div className="page"><PageHeader crumbs={[{ label: "Cardano anchors", href: "/anchors" }, { label: `#${fmtInt(n)}` }]} title={`Anchor #${fmtInt(n)}`} /><section className="card"><Empty title="Mainnet only" /></section></div>;
    }
    const [batch, newest] = await Promise.all([getAnchor(n).catch(() => null), listAnchors(1).catch(() => null)]);
    if (!batch) notFound();
    const isNewest = newest?.batches[0]?.batch_index != null && n >= newest.batches[0].batch_index;
    const records = await queryMainnetRecords({ batch: n, limit: 200, noCount: true }).catch(() => ({ rows: [], total: 0 }));
    const counts = records.rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.record_type]: (a[r.record_type] ?? 0) + 1 }), {});
    const mix = [["farmer", "farmer"], ["agri_record", "agricultural"], ["credit_app", "credit"]].filter(([k]) => counts[k]).map(([k, l]) => `${counts[k]} ${l}`).join(" · ");

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "Cardano anchors", href: "/anchors" }, { label: `#${fmtInt(n)}` }]}
                title={<>Anchor <span className="num font-normal text-white/60">#{fmtInt(n)}</span></>}
                meta={
                    <>
                        <Status tone="positive">Confirmed</Status>
                        <span className="text-white/60">{fmtInt(batch.record_count)} records{mix ? ` · ${mix}` : ""} · <TimeAgo iso={batch.confirmed_at} /></span>
                    </>
                }
                actions={
                    <>
                        <Link href={`/anchor/${n - 1}`} className={`btn ${n === 0 ? "pointer-events-none opacity-40" : ""}`} aria-disabled={n === 0}><ChevronLeft className="h-4 w-4" aria-hidden />Prev</Link>
                        <Link href={`/anchor/${n + 1}`} className={`btn ${isNewest ? "pointer-events-none opacity-40" : ""}`} aria-disabled={isNewest}>Next<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                    </>
                }
            />
            <section className="card" aria-labelledby="batch">
                <div className="card-head"><h2 id="batch" className="section-title">Transaction</h2></div>
                <KV rows={[
                    { label: "Cardano transaction", value: batch.cardano_tx_hash ? <Hash value={batch.cardano_tx_hash} href={cardanoscanTx(network, batch.cardano_tx_hash)} external full /> : "—" },
                    { label: "Anchored at", value: <span className="num">{utc(batch.confirmed_at)}</span> },
                    ...(batch.cardano_block_number ? [{ label: "Cardano block", value: <span className="num">{fmtInt(batch.cardano_block_number)}</span> }] : []),
                    { label: "Merkle root", value: <Hash value={batch.merkle_root} full /> },
                    ...(batch.records_hash ? [{ label: "Records hash", value: <Hash value={batch.records_hash} full /> }] : []),
                    ...(batch.manifest_hash ? [{ label: "Manifest digest", value: <Hash value={batch.manifest_hash} full /> }] : []),
                    { label: "IndianChain blocks", value: <span className="num">{batch.l2_from_block != null ? <Link href={`/block/${batch.l2_from_block}`} className="link">{fmtInt(batch.l2_from_block)}</Link> : "—"}{batch.l2_to_block != null && batch.l2_to_block !== batch.l2_from_block && <> – <Link href={`/block/${batch.l2_to_block}`} className="link">{fmtInt(batch.l2_to_block)}</Link></>}</span> },
                    ...(batch.anchor_script_address ? [{ label: "Anchor contract", value: <Hash value={batch.anchor_script_address} head={14} tail={10} /> }] : []),
                    { label: "Metadata", value: <span className="tag">Label 1804 · v{batch.metadata_version}</span> },
                ]} />
            </section>
            <section className="card mt-6" aria-labelledby="sealed">
                <div className="card-head"><h2 id="sealed" className="section-title">Records</h2><span className="chip chip-grey num">{fmtInt(records.rows.length)}</span></div>
                {records.rows.length
                    ? <RecordsTable rows={records.rows} cols={["record", "version", "farmer", "block"]} caption="Records sealed in this anchor" />
                    : <Empty title="Could not load records" />}
            </section>
        </div>
    );
}
