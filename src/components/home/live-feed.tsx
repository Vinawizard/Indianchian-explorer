"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, ChevronRight } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import type { AnchorBatch } from "@/lib/mainnet-anchors";
import { recordHref, recordTypeShort, shortHash, shortId } from "@/lib/format";
import { cardanoscanTx } from "@/lib/cardanoscan";
import type { ChainNetwork } from "@/lib/network";
import { CopyButton } from "@/components/ui/copy-button";
import { TimeAgo } from "@/components/ui/time-ago";
import { Status } from "@/components/ui/status";
import { Segmented } from "@/components/ui/segmented";

type B = { number: number; hash: string; extrinsicsCount: number; timestamp: string | null };
type Tab = "blocks" | "records" | "anchors";
const fmt = (n: number) => n.toLocaleString("en-US");

/** The original live block feed, with two more views of the same chain: records and Cardano anchors. */
export function LiveFeed({ blocks: initialBlocks, finalized: initialFinalized, records, anchors, network }: {
    blocks: B[]; finalized: number | null; records: MainnetRecordRow[]; anchors: AnchorBatch[]; network: ChainNetwork;
}) {
    const [tab, setTab] = useState<Tab>("blocks");
    const [blocks, setBlocks] = useState(initialBlocks);
    const [finalized, setFinalized] = useState(initialFinalized);
    const busy = useRef(false);
    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const j = await (await fetch(`/api/chain/blocks?count=${initialBlocks.length || 8}&network=${network}`, { cache: "no-store" })).json();
                if (j.status === "ok") { setBlocks(j.blocks); setFinalized(j.finalized ?? null); }
            } catch { /* keep the last list */ } finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        return () => clearInterval(t);
    }, [network, initialBlocks.length]);

    const more = tab === "blocks" ? { href: "/blocks", label: "All blocks" } : tab === "records" ? { href: "/records", label: "All records" } : { href: "/anchors", label: "All anchors" };

    return (
        <section aria-labelledby="feed">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h2 id="feed" className="flex items-center gap-3 text-[18px] font-semibold uppercase tracking-[0.04em] text-white">
                    <Activity className="h-5 w-5 text-[#8f9bff]" strokeWidth={2} aria-hidden /> Live feed
                    <span className="glass ml-1 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.12em] text-white/80">
                        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff3b3b] shadow-[0_0_8px_#ff3b3b]" />Live
                    </span>
                </h2>
                <Segmented label="Feed" value={tab} onChange={setTab}
                    options={[{ value: "blocks", label: "Blocks" }, { value: "records", label: "Records" }, { value: "anchors", label: "Anchors" }]} />
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    {tab === "blocks" && (
                        <table className="table">
                            <thead><tr><th>Block</th><th className="hidden md:table-cell">Hash</th><th className="hidden sm:table-cell">Age</th><th className="r">Extrinsics</th><th className="w-14" /></tr></thead>
                            <tbody>
                                {blocks.map((b, i) => (
                                    <tr key={b.number}>
                                        <td>
                                            <Link href={`/block/${b.number}`} className="num inline-flex items-center gap-2.5 font-semibold text-white transition-colors hover:text-[#a3adff]">
                                                #{fmt(b.number)}
                                                {i === 0 && <span className="rounded-full bg-blue px-2 py-[3px] text-[11px] font-bold uppercase leading-none tracking-[0.1em] text-white shadow-[0_0_12px_rgba(0,24,254,0.7)]">Latest</span>}
                                            </Link>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <span className="inline-flex items-center gap-1 text-white/55"><span className="mono" title={b.hash}>{shortHash(b.hash, 18, 10)}</span><CopyButton value={b.hash} label="Copy hash" /></span>
                                        </td>
                                        <td className="dim hidden sm:table-cell"><TimeAgo iso={b.timestamp} /></td>
                                        <td className="r">
                                            <span className="num text-white/90">{b.extrinsicsCount}</span>
                                        </td>
                                        <td className="r">
                                            <Link href={`/block/${b.number}`} className="icon-btn" aria-label={`Open block ${b.number}${finalized != null && b.number > finalized ? ", finalizing" : ""}`}><ChevronRight className="h-4 w-4" aria-hidden /></Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {tab === "records" && (
                        <table className="table">
                            <thead><tr><th>Record</th><th className="r">Version</th><th className="r hidden sm:table-cell">Block</th><th>Cardano</th><th className="w-14" /></tr></thead>
                            <tbody>
                                {records.map((r) => {
                                    const id = r.record_id ?? "";
                                    return (
                                        <tr key={r.payload_id}>
                                            <td>
                                                <Link href={recordHref(id, r.version)} className="inline-flex items-baseline gap-3">
                                                    <span className="tag w-[96px]">{recordTypeShort(r.record_type)}</span>
                                                    <span className="mono link">{shortId(id)}</span>
                                                </Link>
                                            </td>
                                            <td className="r num dim">v{r.version}</td>
                                            <td className="r hidden sm:table-cell"><Link href={`/block/${r.block_number}`} className="num dim hover:text-white">#{fmt(r.block_number)}</Link></td>
                                            <td>{r.batch_index != null ? <Status tone="positive">Anchored</Status> : <Status tone="warning">Pending</Status>}</td>
                                            <td className="r"><Link href={recordHref(id, r.version)} className="icon-btn" aria-label="Open record"><ChevronRight className="h-4 w-4" aria-hidden /></Link></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {tab === "anchors" && (
                        <table className="table">
                            <thead><tr><th>Batch</th><th className="hidden md:table-cell">Cardano transaction</th><th className="r">Records</th><th className="hidden sm:table-cell">Age</th><th className="w-14" /></tr></thead>
                            <tbody>
                                {anchors.map((a) => (
                                    <tr key={a.batch_index}>
                                        <td><Link href={`/anchor/${a.batch_index}`} className="num font-semibold text-white hover:text-[#a3adff]">#{fmt(a.batch_index)}</Link></td>
                                        <td className="hidden md:table-cell">
                                            {a.cardano_tx_hash ? <a href={cardanoscanTx(network, a.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="mono link" title={a.cardano_tx_hash}>{shortHash(a.cardano_tx_hash, 14, 10)}</a> : "—"}
                                        </td>
                                        <td className="r num text-white/90">{fmt(a.record_count)}</td>
                                        <td className="dim hidden sm:table-cell"><TimeAgo iso={a.confirmed_at} /></td>
                                        <td className="r"><Link href={`/anchor/${a.batch_index}`} className="icon-btn" aria-label={`Open anchor ${a.batch_index}`}><ChevronRight className="h-4 w-4" aria-hidden /></Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex justify-end border-t border-white/[0.06] px-6 py-3.5">
                    <Link href={more.href} className="label inline-flex items-center gap-1 transition-colors hover:text-white">{more.label}<ChevronRight className="h-3.5 w-3.5" aria-hidden /></Link>
                </div>
            </div>
        </section>
    );
}
