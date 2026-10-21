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
        return <div className="shell"><PageHeader crumbs={[{ label: "Cardano anchors", href: "/anchors" }, { label: `#${fmtInt(n)}` }]} title={`Anchor #${fmtInt(n)}`} /><section className="panel"><Empty title="Anchors are shown for Mainnet">Switch to Mainnet in the header.</Empty></section></div>;
    }
    const [batch, newest] = await Promise.all([getAnchor(n).catch(() => null), listAnchors(1).catch(() => null)]);
    if (!batch) notFound();
    const isNewest = newest?.batches[0]?.batch_index != null && n >= newest.batches[0].batch_index;
    const records = await queryMainnetRecords({ batch: n, limit: 200, noCount: true }).catch(() => ({ rows: [], total: 0 }));
    const counts = records.rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.record_type]: (a[r.record_type] ?? 0) + 1 }), {});
    const mix = [["farmer", "farmer"], ["agri_record", "agricultural"], ["credit_app", "credit"]].filter(([k]) => counts[k]).map(([k, l]) => `${counts[k]} ${l}`).join(" · ");

    return (
        <div className="shell">
            <PageHeader
                crumbs={[{ label: "Cardano anchors", href: "/anchors" }, { label: `#${fmtInt(n)}` }]}
                title={<>Anchor <span className="num">#{fmtInt(n)}</span></>}
                meta={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Status tone="positive">Confirmed on Cardano</Status>
                        <span>{fmtInt(batch.record_count)} records{mix ? ` (${mix})` : ""} sealed <TimeAgo iso={batch.confirmed_at} /></span>
                    </span>
                }
                actions={
                    <>
                        <Link href={`/anchor/${n - 1}`} className={`btn ${n === 0 ? "pointer-events-none opacity-40" : ""}`} aria-disabled={n === 0}><ChevronLeft className="h-4 w-4" aria-hidden />Previous</Link>
                        <Link href={`/anchor/${n + 1}`} className={`btn ${isNewest ? "pointer-events-none opacity-40" : ""}`} aria-disabled={isNewest}>Next<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                    </>
                }
            />
            <section className="panel" aria-labelledby="batch">
                <div className="panel-head"><h2 id="batch" className="panel-title">Anchor transaction</h2></div>
                <KV rows={[
                    { label: "Cardano transaction", value: batch.cardano_tx_hash ? <Hash value={batch.cardano_tx_hash} href={cardanoscanTx(network, batch.cardano_tx_hash)} external full /> : "—" },
                    { label: "Anchored at", value: <span className="num">{utc(batch.confirmed_at)}</span> },
                    ...(batch.cardano_block_number ? [{ label: "Cardano block", value: <span className="num">{fmtInt(batch.cardano_block_number)}</span> }] : []),
                    { label: "Merkle root", value: <Hash value={batch.merkle_root} full />, hint: "Root of the 100 record hashes, in metadata label 1804" },
                    ...(batch.records_hash ? [{ label: "Records hash", value: <Hash value={batch.records_hash} full />, hint: "Fingerprint of the ordered record list" }] : []),
                    ...(batch.manifest_hash ? [{ label: "Manifest digest", value: <Hash value={batch.manifest_hash} full />, hint: batch.manifest_schema ?? undefined }] : []),
                    { label: "IndianChain blocks", value: <span className="num">{batch.l2_from_block != null ? <Link href={`/block/${batch.l2_from_block}`} className="link">{fmtInt(batch.l2_from_block)}</Link> : "—"}{batch.l2_to_block != null && batch.l2_to_block !== batch.l2_from_block && <> – <Link href={`/block/${batch.l2_to_block}`} className="link">{fmtInt(batch.l2_to_block)}</Link></>}</span> },
                    ...(batch.anchor_script_address ? [{ label: "Anchor contract", value: <Hash value={batch.anchor_script_address} head={14} tail={10} /> }] : []),
                    { label: "Metadata format", value: <span>Version <span className="num">{batch.metadata_version}</span>{batch.metadata_version >= 3 ? " (root and manifest digest)" : batch.metadata_version === 1 ? " (all 100 hashes in the metadata)" : ""}</span> },
                ]} />
            </section>
            <section className="panel mt-6" aria-labelledby="sealed">
                <div className="panel-head"><h2 id="sealed" className="panel-title">Records sealed in this anchor</h2><span className="num text-[13px] text-faint">{fmtInt(records.rows.length)}</span></div>
                {records.rows.length
                    ? <RecordsTable rows={records.rows} cols={["record", "version", "farmer", "block", "tx"]} caption="Records sealed in this anchor" />
                    : <Empty title="The record list could not be loaded" />}
            </section>
        </div>
    );
}
