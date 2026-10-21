"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Box, CheckCircle2, ChevronRight, Clock, Hash, Layers } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import type { AnchorBatch } from "@/lib/mainnet-anchors";
import { shortHash } from "@/lib/format";
import { cardanoscanTx } from "@/lib/cardanoscan";
import type { ChainNetwork } from "@/lib/network";
import { CopyButton } from "@/components/ui/copy-button";
import { TimeAgo } from "@/components/ui/time-ago";
import { Status } from "@/components/ui/status";
import { Segmented } from "@/components/ui/segmented";
import { CardanoIcon } from "@/components/ui/cardano-icon";
import { Th } from "@/components/ui/th";
import { RecordsTable } from "@/components/records/records-table";

type B = { number: number; hash: string; extrinsicsCount: number; timestamp: string | null };
type Tab = "blocks" | "events" | "anchors";
const fmt = (n: number) => n.toLocaleString("en-US");
const EASE = [0.23, 1, 0.32, 1] as const;

/** The live feed: blocks refresh every block (a new block slides in at the top), plus events and anchors. */
export function LiveFeed({ blocks: initialBlocks, finalized: initialFinalized, records, anchors, network }: {
    blocks: B[]; finalized: number | null; records: MainnetRecordRow[]; anchors: AnchorBatch[]; network: ChainNetwork;
}) {
    const [tab, setTab] = useState<Tab>("blocks");
    const [blocks, setBlocks] = useState(initialBlocks);
    const [finalized, setFinalized] = useState(initialFinalized);
    const reduce = useReducedMotion();
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

    const more = tab === "blocks" ? { href: "/blocks", label: "All blocks" } : tab === "events" ? { href: "/events", label: "All events" } : { href: "/anchors", label: "All anchors" };

    return (
        <section aria-labelledby="feed" className="card">
            <div className="flex flex-col items-start gap-4 px-5 py-6 sm:flex-row sm:justify-between sm:px-8 sm:py-8">
                <div>
                    <h2 id="feed" className="section-title">Live feed</h2>
                    <p className="card-sub">Updates every ~6 seconds with network consensus</p>
                </div>
                <Segmented label="Feed" size="sm" value={tab} onChange={setTab}
                    options={[{ value: "blocks", label: "Blocks" }, { value: "events", label: "Events" }, { value: "anchors", label: "Anchors" }]} />
            </div>

            <div>
                {tab === "blocks" && (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <caption className="sr-only">Latest blocks</caption>
                            <thead><tr>
                                <Th icon={Box}>Block</Th><Th icon={Clock} className="hidden sm:table-cell">Age</Th><Th icon={Hash} className="hidden md:table-cell">Hash</Th>
                                <Th icon={Layers} className="hidden sm:table-cell">Extrinsics</Th><Th icon={CheckCircle2}>Status</Th><th scope="col" className="w-12"><span className="sr-only">Open</span></th>
                            </tr></thead>
                            <tbody>
                                <AnimatePresence initial={false}>
                                    {blocks.map((b, i) => (
                                        <motion.tr key={b.number}
                                            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
                                            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
                                            transition={{ duration: 0.22, ease: EASE }}>
                                            <td>
                                                <span className="inline-flex items-center gap-3">
                                                    <Link href={`/block/${b.number}`} className="row-link blk">{b.number}</Link>
                                                    {i === 0 && <span className="tag-latest">Latest</span>}
                                                </span>
                                            </td>
                                            <td className="hidden sm:table-cell"><TimeAgo iso={b.timestamp} /></td>
                                            <td className="hidden md:table-cell">
                                                <span className="z inline-flex items-center gap-1"><span className="mono text-white/50" title={b.hash}>{shortHash(b.hash, 18, 10)}</span><span className="row-copy"><CopyButton value={b.hash} label="Copy hash" /></span></span>
                                            </td>
                                            <td className="num hidden text-[14px] text-white sm:table-cell">{b.extrinsicsCount}</td>
                                            <td>{finalized != null && b.number > finalized ? <Status>Finalizing</Status> : <Status tone="positive">Finalized</Status>}</td>
                                            <td className="r"><span className="row-go" aria-hidden><ChevronRight className="h-4 w-4" /></span></td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === "events" && <RecordsTable rows={records} cols={["block", "event", "sector", "version", "time", "anchor"]} caption="Latest events" />}
                {tab === "anchors" && (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <caption className="sr-only">Latest Cardano anchors</caption>
                            <thead><tr>
                                <Th icon={CardanoIcon}>Batch</Th><Th icon={Hash} className="hidden md:table-cell">Cardano transaction</Th><Th icon={Layers}>Events</Th>
                                <Th icon={Clock} className="hidden sm:table-cell">Age</Th><Th icon={CheckCircle2}>Status</Th><th scope="col" className="w-12"><span className="sr-only">Open</span></th>
                            </tr></thead>
                            <tbody>
                                {anchors.map((a) => (
                                    <tr key={a.batch_index}>
                                        <td><Link href={`/anchor/${a.batch_index}`} className="row-link blk">{fmt(a.batch_index)}</Link></td>
                                        <td className="hidden md:table-cell">
                                            {a.cardano_tx_hash ? <a href={cardanoscanTx(network, a.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="z mono link" title={a.cardano_tx_hash}>{shortHash(a.cardano_tx_hash, 14, 10)}</a> : "—"}
                                        </td>
                                        <td className="num text-[14px] text-white">{fmt(a.record_count)}</td>
                                        <td className="hidden sm:table-cell"><TimeAgo iso={a.confirmed_at} /></td>
                                        <td><Status tone="positive">Confirmed</Status></td>
                                        <td className="r"><span className="row-go" aria-hidden><ChevronRight className="h-4 w-4" /></span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex justify-end border-t border-white/[0.06] px-8 py-4">
                    <Link href={more.href} className="label group inline-flex items-center gap-2 transition-colors hover:text-white">
                        {more.label}<ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
