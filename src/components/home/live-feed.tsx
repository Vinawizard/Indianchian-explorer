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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 id="feed" className="heading flex items-center gap-3 text-xl md:text-2xl">
                    <Activity className="h-6 w-6 text-blue-text" aria-hidden /> Live feed
                </h2>
                <div className="flex items-center gap-3">
                    <span className="hidden items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 sm:inline-flex">
                        <span aria-hidden className="h-1.5 w-1.5 animate-pulse bg-red" />
                        <span className="label">Live</span>
                    </span>
                    <div className="seg" role="tablist" aria-label="Feed">
                        {(["blocks", "records", "anchors"] as Tab[]).map((t) => (
                            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
                        ))}
                    </div>
                </div>
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
                                            <Link href={`/block/${b.number}`} className="num inline-flex items-center gap-3 font-semibold text-white transition-colors hover:text-blue-text">
                                                #{fmt(b.number)}
                                                {i === 0 && <span className="bg-blue px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">Latest</span>}
                                            </Link>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <span className="inline-flex items-center gap-1 text-white/50"><span className="mono" title={b.hash}>{shortHash(b.hash, 18, 10)}</span><CopyButton value={b.hash} label="Copy hash" /></span>
                                        </td>
                                        <td className="hidden text-white/60 sm:table-cell"><TimeAgo iso={b.timestamp} /></td>
                                        <td className="r">
                                            <span className="num text-lg font-bold text-white">{b.extrinsicsCount}</span>
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
                                                    <span className="text-white/60">{recordTypeShort(r.record_type)}</span>
                                                    <span className="mono link">{shortId(id)}</span>
                                                </Link>
                                            </td>
                                            <td className="r num text-white/70">v{r.version}</td>
                                            <td className="r hidden sm:table-cell"><Link href={`/block/${r.block_number}`} className="num text-white/70 hover:text-white">#{fmt(r.block_number)}</Link></td>
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
                                        <td><Link href={`/anchor/${a.batch_index}`} className="num font-semibold text-white hover:text-blue-text">#{fmt(a.batch_index)}</Link></td>
                                        <td className="hidden md:table-cell">
                                            {a.cardano_tx_hash ? <a href={cardanoscanTx(network, a.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="mono link" title={a.cardano_tx_hash}>{shortHash(a.cardano_tx_hash, 14, 10)}</a> : "—"}
                                        </td>
                                        <td className="r num text-white/80">{fmt(a.record_count)}</td>
                                        <td className="hidden text-white/60 sm:table-cell"><TimeAgo iso={a.confirmed_at} /></td>
                                        <td className="r"><Link href={`/anchor/${a.batch_index}`} className="icon-btn" aria-label={`Open anchor ${a.batch_index}`}><ChevronRight className="h-4 w-4" aria-hidden /></Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex justify-end border-t border-line px-6 py-3">
                    <Link href={more.href} className="label inline-flex items-center gap-1 transition-colors hover:text-white">{more.label}<ChevronRight className="h-3.5 w-3.5" aria-hidden /></Link>
                </div>
            </div>
        </section>
    );
}
