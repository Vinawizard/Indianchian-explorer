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
import { DotTitle } from "@/components/ui/dot-text";
import { RecordsTable } from "@/components/records/records-table";

type B = { number: number; hash: string; extrinsicsCount: number; timestamp: string | null };
type Tab = "blocks" | "events" | "anchors";
const fmt = (n: number) => n.toLocaleString("en-US");
const EASE = [0.23, 1, 0.32, 1] as const;

/** The newest block number: digits that differ from the previous block roll down into place, rippling left to right. */
function RollNumber({ value, from }: { value: number; from: number | null }) {
    const now = String(value), was = from == null ? now : String(from).padStart(now.length, " ");
    let wave = 0;
    return (
        <span>{[...now].map((d, i) => (from != null && was[i] !== d
            ? <span key={i} className="roll"><span style={{ animationDelay: `${wave++ * 45}ms` }}>{d}</span></span>
            : <span key={i}>{d}</span>))}</span>
    );
}

/**
 * The live feed: blocks refresh every block. The rows glide down one place, the new block fades in
 * at the top, the LATEST tag slides up to it and its changed digits roll in. Plus events and anchors.
 */
export function LiveFeed({ blocks: initialBlocks, finalized: initialFinalized, records, anchors, network }: {
    blocks: B[]; finalized: number | null; records: MainnetRecordRow[]; anchors: AnchorBatch[]; network: ChainNetwork;
}) {
    const [tab, setTab] = useState<Tab>("blocks");
    const [blocks, setBlocks] = useState(initialBlocks);
    const [finalized, setFinalized] = useState(initialFinalized);
    const reduce = useReducedMotion();
    const busy = useRef(false);
    const top = useRef(initialBlocks[0]?.number ?? 0);
    const [rollFrom, setRollFrom] = useState<number | null>(null);
    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const j = await (await fetch(`/api/chain/blocks?count=${initialBlocks.length || 8}&network=${network}`, { cache: "no-store" })).json();
                if (j.status === "ok") {
                    const nb: B[] = j.blocks;
                    if ((nb[0]?.number ?? 0) > top.current) { setRollFrom(top.current); top.current = nb[0].number; }
                    setBlocks(nb); setFinalized(j.finalized ?? null);
                }
            } catch { /* keep the last list */ } finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        return () => clearInterval(t);
    }, [network, initialBlocks.length]);

    const more = tab === "blocks" ? { href: "/blocks", label: "All blocks" } : tab === "events" ? { href: "/events", label: "All events" } : { href: "/anchors", label: "All anchors" };

    return (
        <section aria-labelledby="feed" className="card">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5 px-5 py-6 sm:px-8 sm:py-8">
                <div>
                    <h2 id="feed"><DotTitle text="On chain now" /></h2>
                    <p className="card-sub !mt-3">Updates every ~6 seconds with network consensus</p>
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
                                        <motion.tr key={b.number} layout="position"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={reduce ? { duration: 0 } : { opacity: { duration: 0.3, ease: EASE }, layout: { duration: 0.42, ease: EASE } }}>
                                            <td>
                                                <span className="inline-flex items-center gap-3">
                                                    <Link href={`/block/${b.number}`} className="row-link blk">{i === 0 ? <RollNumber key={b.number} value={b.number} from={rollFrom} /> : b.number}</Link>
                                                    {i === 0 && <motion.span layoutId="latest-tag" className="tag-latest" transition={reduce ? { duration: 0 } : { duration: 0.42, ease: EASE }}>Latest</motion.span>}
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
                                            {a.cardano_tx_hash ? <a href={cardanoscanTx(network, a.cardano_tx_hash)} target="_blank" rel="noopener noreferrer" className="z mono link-cardano" title={a.cardano_tx_hash}>{shortHash(a.cardano_tx_hash, 14, 10)}</a> : "—"}
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
