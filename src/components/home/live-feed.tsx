"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import type { AnchorBatch } from "@/lib/mainnet-anchors";
import { shortHash } from "@/lib/format";
import { cardanoscanTx } from "@/lib/cardanoscan";
import type { ChainNetwork } from "@/lib/network";
import { CopyButton } from "@/components/ui/copy-button";
import { TimeAgo } from "@/components/ui/time-ago";
import { Status } from "@/components/ui/status";
import { Segmented } from "@/components/ui/segmented";
import { RecordsTable } from "@/components/records/records-table";

type B = { number: number; hash: string; extrinsicsCount: number; timestamp: string | null };
type Tab = "blocks" | "records" | "anchors";
const fmt = (n: number) => n.toLocaleString("en-US");

/** The live feed: blocks refresh every block (a new block arrives with a brief blue flash), plus records and anchors. */
export function LiveFeed({ blocks: initialBlocks, finalized: initialFinalized, records, anchors, network }: {
    blocks: B[]; finalized: number | null; records: MainnetRecordRow[]; anchors: AnchorBatch[]; network: ChainNetwork;
}) {
    const [tab, setTab] = useState<Tab>("blocks");
    const [blocks, setBlocks] = useState(initialBlocks);
    const [finalized, setFinalized] = useState(initialFinalized);
    const [fresh, setFresh] = useState<Set<number>>(new Set());
    const top = useRef(initialBlocks[0]?.number ?? 0);
    const busy = useRef(false);
    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const j = await (await fetch(`/api/chain/blocks?count=${initialBlocks.length || 8}&network=${network}`, { cache: "no-store" })).json();
                if (j.status === "ok") {
                    const nb: B[] = j.blocks;
                    setFresh(new Set(nb.filter((b) => b.number > top.current).map((b) => b.number)));
                    top.current = nb[0]?.number ?? top.current;
                    setBlocks(nb); setFinalized(j.finalized ?? null);
                }
            } catch { /* keep the last list */ } finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        return () => clearInterval(t);
    }, [network, initialBlocks.length]);

    const more = tab === "blocks" ? { href: "/blocks", label: "All blocks" } : tab === "records" ? { href: "/records", label: "All records" } : { href: "/anchors", label: "All anchors" };

    return (
        <section aria-labelledby="feed">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h2 id="feed" className="flex items-center gap-3 text-[20px] font-medium uppercase tracking-[0.02em] text-white">
                    <Activity className="h-5 w-5 text-[#8f9bff]" strokeWidth={2} aria-hidden /> Live feed
                    <span className="glass ml-1 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.1em] text-white/85">
                        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff4848] shadow-[0_0_8px_#ff4848]" />Live
                    </span>
                </h2>
                <Segmented label="Feed" value={tab} onChange={setTab}
                    options={[{ value: "blocks", label: "Blocks" }, { value: "records", label: "Records" }, { value: "anchors", label: "Anchors" }]} />
            </div>

            <div className="card">
                {tab === "blocks" && (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead><tr><th>Block</th><th className="hidden sm:table-cell">Age</th><th className="hidden md:table-cell">Hash</th><th className="r hidden sm:table-cell">Extrinsics</th><th>Status</th><th className="w-10"><span className="sr-only">Open</span></th></tr></thead>
                            <tbody>
                                {blocks.map((b, i) => (
                                    <tr key={b.number} className={fresh.has(b.number) ? "row-new" : undefined}>
                                        <td>
                                            <Link href={`/block/${b.number}`} className="row-link num inline-flex items-center gap-2.5 text-[15px] font-semibold text-white">
                                                {fmt(b.number)}
                                                {i === 0 && <span className="chip chip-blue !h-5 !px-2 !text-[11px]">Latest</span>}
                                            </Link>
                                        </td>
                                        <td className="dim hidden sm:table-cell"><TimeAgo iso={b.timestamp} /></td>
                                        <td className="hidden md:table-cell">
                                            <span className="z inline-flex items-center gap-1 text-white/50"><span className="mono" title={b.hash}>{shortHash(b.hash, 16, 10)}</span><CopyButton value={b.hash} label="Copy hash" /></span>
                                        </td>
                                        <td className="r num hidden text-white/80 sm:table-cell">{b.extrinsicsCount}</td>
                                        <td>{finalized != null && b.number > finalized ? <Status tone="neutral">Finalizing</Status> : <Status tone="positive">Finalized</Status>}</td>
                                        <td className="r"><ArrowRight className="row-arrow ml-auto h-4 w-4" aria-hidden /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === "records" && <RecordsTable rows={records} cols={["record", "version", "block", "time", "anchor"]} caption="Latest records" />}
                {tab === "anchors" && (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead><tr><th>Batch</th><th className="hidden md:table-cell">Cardano transaction</th><th className="r">Records</th><th className="hidden sm:table-cell">Age</th><th>Status</th><th className="w-10"><span className="sr-only">Open</span></th></tr></thead>
                            <tbody>
                                {anchors.map((a) => (
                                    <tr key={a.batch_index}>
                                        <td><Link href={`/anchor/${a.batch_index}`} className="row-link num text-[15px] font-semibold text-white">#{fmt(a.batch_index)}</Link></td>
                                        <td className="hidden md:table-cell">
                                            {a.cardano_tx_hash ? <a href={cardanoscanTx(network, a.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="z mono link" title={a.cardano_tx_hash}>{shortHash(a.cardano_tx_hash, 14, 10)}</a> : "—"}
                                        </td>
                                        <td className="r num text-white/85">{fmt(a.record_count)}</td>
                                        <td className="dim hidden sm:table-cell"><TimeAgo iso={a.confirmed_at} /></td>
                                        <td><Status tone="positive">Confirmed</Status></td>
                                        <td className="r"><ArrowRight className="row-arrow ml-auto h-4 w-4" aria-hidden /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex justify-end px-6 py-3.5" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent) top / 100% 1px no-repeat" }}>
                    <Link href={more.href} className="label group inline-flex items-center gap-1.5 transition-colors hover:text-white">
                        {more.label}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
