"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    ChevronRight, ChevronDown, ChevronLeft, CheckCircle2,
    Clock, XCircle, Box, Globe, FileText, Search
} from "lucide-react";
import { useSearch } from "@/components/providers/search-provider";

type RecordTypeEntry = {
    payload_id: string;
    record_type: string;
    type: string | null;
    tx_hash: string | null;
    block_hash: string | null;
    signer_address: string | null;
    tx_fee: number | null;
    tx_index: number | null;
    timestamp: string | null;
    confirmed_at: string | null;
    entity_id: string | null;
    farmer_id: string | null;
    record_id: string | null;
    version: number | null;
    payload_hash: string | null;
    merkle_root: string | null;
    cardano_tx_hash: string | null;
};

type BlockRow = {
    block_number: number;
    submission_status: string;
    chain: string;
    record_types: RecordTypeEntry[];
};

const PAGE_SIZE = 20;

const rowVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.018, type: "spring", stiffness: 300, damping: 28 },
    }),
};

/* ── Status badge ────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    if (s === "CONFIRMED")
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-heading px-3 py-1 rounded-none bg-white/5 text-accent border border-accent/30 uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Confirmed
            </span>
        );
    if (s === "PENDING")
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-heading px-3 py-1 rounded-none bg-white/5 text-muted-foreground border border-white/20 uppercase tracking-widest">
                <Clock className="w-3 h-3" /> Pending
            </span>
        );
    if (s === "FAILED")
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-heading px-3 py-1 rounded-none bg-white/5 text-destructive border border-destructive/30 uppercase tracking-widest">
                <XCircle className="w-3 h-3" /> Failed
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-heading px-3 py-1 rounded-none bg-white/5 text-muted-foreground border border-white/20 uppercase tracking-widest">
            {status ?? "—"}
        </span>
    );
}

/* ── JSON syntax highlighter ─────────────────────────── */
function JsonHighlight({ value }: { value: unknown }) {
    const lines = JSON.stringify(value, null, 2).split("\n");
    return (
        <pre className="text-[11px] leading-6 font-mono whitespace-pre-wrap overflow-x-auto opacity-80">
            {lines.map((line, i) => {
                const colored = line
                    .replace(/(".*?")(\s*:)/g, '<span style="color:#ffffff">$1</span>$2')
                    .replace(/:\s*(".*?")/g, ': <span style="color:#0018fe">$1</span>')
                    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#ffffff">$1</span>')
                    .replace(/:\s*(true|false)/g, ': <span style="color:#0018fe">$1</span>')
                    .replace(/:\s*(null)/g, ': <span style="color:#666666">$1</span>');
                return <span key={i} dangerouslySetInnerHTML={{ __html: colored + "\n" }} />;
            })}
        </pre>
    );
}

/* ── Build record-type-specific payload ──────────────── */
function buildPayload(rt: RecordTypeEntry, chain: string): Record<string, unknown> {
    const rtype = rt.record_type?.toLowerCase();

    // agri_record → include record_id
    if (rtype === "agri_record") {
        return {
            chain,
            type: rt.type || rt.record_type,
            payload_hash: rt.payload_hash,
            version: rt.version,
            timestamp: rt.timestamp,
            farmer_id: rt.farmer_id,
            record_id: rt.record_id,
        };
    }

    // credit_app → include application_id (entity_id)
    if (rtype === "credit_app") {
        return {
            chain,
            type: rt.type || rt.record_type,
            payload_hash: rt.payload_hash,
            version: rt.version,
            timestamp: rt.timestamp,
            farmer_id: rt.farmer_id,
            application_id: rt.entity_id,
        };
    }

    // default: farmer (and any other types)
    return {
        chain,
        type: rt.type || rt.record_type,
        payload_hash: rt.payload_hash,
        version: rt.version,
        timestamp: rt.timestamp,
        farmer_id: rt.farmer_id,
    };
}

/* ── Expanded panel ──────────────────────────────────── */
function ExpandedPanel({ block }: { block: BlockRow }) {
    const [tab, setTab] = useState<"table" | "json" | "cardano">("table");

    // One payload per record_type entry
    const payloads = block.record_types.map((rt) => ({
        label: rt.record_type?.replace(/_/g, " ") ?? "record",
        payload: buildPayload(rt, block.chain),
    }));

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
        >
            <div className="px-6 pb-8 pt-4 border-t border-white/5 bg-white/[0.02]">
                {/* Tab switcher */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setTab("table")}
                        className={`px-4 py-1.5 text-[10px] font-heading uppercase tracking-widest transition-all ${tab === "table"
                            ? "bg-white text-black"
                            : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                            }`}
                    >
                        TABLE_VIEW
                    </button>
                    <button
                        onClick={() => setTab("json")}
                        className={`px-4 py-1.5 text-[10px] font-heading uppercase tracking-widest transition-all ${tab === "json"
                            ? "bg-accent text-white"
                            : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                            }`}
                    >
                        JSON_EXPORT
                    </button>
                    <button
                        onClick={() => setTab("cardano")}
                        className={`px-4 py-1.5 text-[10px] font-heading uppercase tracking-widest transition-all ${tab === "cardano"
                            ? "bg-[#0033ad] text-white border border-[#0033ad]"
                            : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                            }`}
                    >
                        CARDANO
                    </button>
                </div>

                {/* TABLE view */}
                {tab === "table" && (
                    <div className="flex flex-col gap-6">
                        {payloads.map(({ label, payload }, idx) => (
                            <div key={idx} className="border border-white/10 bg-black overflow-hidden rounded-none">
                                {/* Record label header */}
                                <div className="px-5 py-3 bg-white/5 border-b border-white/10">
                                    <span className="text-[10px] font-heading text-white uppercase tracking-[0.2em]">
                                        {label.replace(/ /g, "_")}
                                    </span>
                                </div>
                                {/* Key-value rows */}
                                {Object.entries(payload).map(([key, val]) => (
                                    <div
                                        key={key}
                                        className="flex flex-col sm:grid sm:grid-cols-12 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="sm:col-span-3 px-5 py-2 sm:py-3 text-[10px] font-heading text-muted-foreground uppercase tracking-widest bg-white/[0.02] sm:border-r border-white/5 flex items-center">
                                            {key.replace(/_/g, " ")}
                                        </div>
                                        <div className="sm:col-span-9 px-5 py-3 text-[11px] font-mono text-white/80 break-all flex items-center">
                                            {val != null ? String(val) : <span className="opacity-30">—</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* JSON view */}
                {tab === "json" && (
                    <div className="flex flex-col gap-6">
                        {payloads.map(({ label, payload }, idx) => (
                            <div key={idx}>
                                {/* Record label */}
                                <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-3">
                                    {label.replace(/ /g, "_")}
                                </p>
                                <div className="border border-white/10 bg-black px-6 py-5 rounded-none">
                                    <JsonHighlight value={payload} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CARDANO view */}
                {tab === "cardano" && (
                    <div className="flex flex-col gap-6">
                        {block.record_types.map((rt, idx) => (
                            <div key={idx} className="border border-white/10 bg-black overflow-hidden rounded-none">
                                {/* Record label header */}
                                <div className="px-5 py-3 bg-white/5 border-b border-white/10">
                                    <span className="text-[10px] font-heading text-white uppercase tracking-[0.2em]">
                                        {rt.record_type ? rt.record_type.replace(/_/g, "_").toUpperCase() : "RECORD"}
                                    </span>
                                </div>
                                {/* Key-value rows */}
                                <div className="flex flex-col sm:grid sm:grid-cols-12 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <div className="sm:col-span-3 px-5 py-2 sm:py-3 text-[10px] font-heading text-muted-foreground uppercase tracking-widest bg-white/[0.02] sm:border-r border-white/5 flex items-center">
                                        MERKLE ROOT
                                    </div>
                                    <div className="sm:col-span-9 px-5 py-3 text-[11px] font-mono text-white/80 break-all flex items-center">
                                        {rt.merkle_root ? String(rt.merkle_root) : <span className="opacity-30">—</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-12 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <div className="sm:col-span-3 px-5 py-2 sm:py-3 text-[10px] font-heading text-muted-foreground uppercase tracking-widest bg-white/[0.02] sm:border-r border-white/5 flex items-center">
                                        CARDANO TX HASH
                                    </div>
                                    <div className="sm:col-span-9 px-5 py-3 text-[11px] font-mono break-all flex items-center">
                                        {rt.cardano_tx_hash ? (
                                            <a
                                                href={`https://preview.cardanoscan.io/transaction/${rt.cardano_tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#4d9fff] hover:text-white transition-colors duration-200 cursor-pointer"
                                                title="View on CardanoScan"
                                            >
                                                {String(rt.cardano_tx_hash)}
                                            </a>
                                        ) : (
                                            <span className="opacity-30">—</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Main table ─────────────────────────────────────── */
export function EventsTable({ events }: { events: BlockRow[] }) {
    const [page, setPage] = useState(1);
    const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
    const { query } = useSearch();

    // Efficient client-side search filter — runs only when query or events change
    const filteredEvents = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return events;

        return events.filter((block) => {
            // Block number match
            if (String(block.block_number).startsWith(q)) return true;

            // Chain match
            if (block.chain?.toLowerCase().includes(q)) return true;

            // Status match
            if (block.submission_status?.toLowerCase().includes(q)) return true;

            // Match against any record_type entry
            return block.record_types.some((rt) => {
                if (rt.tx_hash?.toLowerCase().includes(q)) return true;
                if (rt.signer_address?.toLowerCase().includes(q)) return true;
                if (rt.record_type?.toLowerCase().includes(q)) return true;
                if (rt.payload_id?.toLowerCase().startsWith(q)) return true;
                if (rt.farmer_id?.toLowerCase().includes(q)) return true;
                if (rt.entity_id?.toLowerCase().includes(q)) return true;
                return false;
            });
        });
    }, [events, query]);

    const isSearchActive = query.trim().length > 0;

    // Reset to page 1 whenever the search query changes
    useEffect(() => {
        setPage(1);
        setExpandedBlock(null);
    }, [query]);

    const totalPages = useMemo(() => Math.ceil(filteredEvents.length / PAGE_SIZE), [filteredEvents.length]);
    const pageData = useMemo(
        () => filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredEvents, page]
    );

    const goTo = (p: number) => {
        setPage(Math.max(1, Math.min(p, totalPages)));
        setExpandedBlock(null);
    };

    const toggle = (blockNum: number) =>
        setExpandedBlock((prev) => (prev === blockNum ? null : blockNum));

    return (
        <div className="w-full mt-8 flex flex-col gap-6 relative z-10">
            {/* Search result count */}
            {isSearchActive && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/20 text-[10px] font-heading uppercase tracking-widest"
                >
                    <Search className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground">
                        SHOWING{" "}
                        <span className="text-accent font-bold">{filteredEvents.length.toLocaleString()}</span>
                        {" "}OF{" "}
                        <span className="text-white font-bold">{events.length.toLocaleString()}</span>{" "}
                        BLOCKS MATCHING &quot;{query.trim()}&quot;
                    </span>
                </motion.div>
            )}
            <div className="card-premium overflow-hidden">
                <div
                    className="hidden lg:grid px-8 py-5 bg-white/5 border-b border-white/10 text-[10px] font-heading text-muted-foreground tracking-[0.2em] uppercase grid-cols-[1.2fr_1fr_1fr_2fr_auto] gap-4"
                >
                    <div className="flex items-center gap-3"><Box className="w-3.5 h-3.5 text-accent" /> Block</div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Status</div>
                    <div className="flex items-center gap-3"><Globe className="w-3.5 h-3.5 text-accent" /> Chain</div>
                    <div className="flex items-center gap-3"><FileText className="w-3.5 h-3.5 text-accent" /> Sector</div>
                    <div />
                </div>

                {/* Rows */}
                <div className="flex flex-col divide-y divide-white/5 text-white">
                    {pageData.length === 0 ? (
                        <div className="px-8 py-20 text-center text-muted-foreground text-[10px] font-heading uppercase tracking-widest opacity-50">NO_DATA_AVAILABLE</div>
                    ) : (
                        pageData.map((block, i) => {
                            const isOpen = expandedBlock === block.block_number;
                            return (
                                <motion.div
                                    key={block.block_number}
                                    custom={i}
                                    variants={rowVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="flex flex-col"
                                >
                                    {/* Main row */}
                                    <div
                                        className={`px-4 lg:px-8 py-4 lg:py-5 flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr_1fr_2fr_auto] lg:gap-4 hover:bg-white/5 transition-colors relative ${isOpen ? 'bg-white/[0.02]' : ''}`}
                                    >
                                        {/* Mobile Header (Hidden on Desktop) */}
                                        <div className="flex lg:hidden items-center justify-between mb-3 pb-3 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Box className="w-3 h-3 text-accent" />
                                                <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest">Block Data</span>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => toggle(block.block_number)}
                                                    aria-label={isOpen ? "Collapse" : "Expand"}
                                                    className={`w-7 h-7 flex items-center justify-center border transition-all duration-200 rounded-none ${isOpen
                                                        ? "bg-accent border-accent text-white"
                                                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-accent hover:text-accent"
                                                        }`}
                                                >
                                                    {isOpen
                                                        ? <ChevronDown className="w-3 h-3" />
                                                        : <ChevronRight className="w-3 h-3" />
                                                    }
                                                </button>
                                            </div>
                                        </div>

                                        {/* Block */}
                                        <div className="flex flex-col lg:block mb-4 lg:mb-0">
                                            <span className="lg:hidden text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Height</span>
                                            <Link
                                                href={`/event/${block.block_number}`}
                                                prefetch
                                                className="inline-flex items-center gap-2 text-sm lg:text-sm font-heading text-white hover:text-accent transition-colors"
                                            >
                                                <span className="text-muted-foreground font-mono text-[10px]">#</span>
                                                {block.block_number ?? "—"}
                                            </Link>
                                        </div>

                                        {/* Status */}
                                        <div className="flex flex-col lg:block mb-4 lg:mb-0">
                                            <span className="lg:hidden text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Network Status</span>
                                            <div className="flex lg:block"><StatusBadge status={block.submission_status} /></div>
                                        </div>

                                        {/* Chain */}
                                        <div className="flex flex-col lg:block mb-4 lg:mb-0">
                                            <span className="lg:hidden text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Source Chain</span>
                                            <span className="text-[10px] font-heading text-white uppercase tracking-wider opacity-80">
                                                {block.chain ?? "—"}
                                            </span>
                                        </div>

                                        {/* Record type badges */}
                                        <div className="flex flex-col lg:block mb-2 lg:mb-0">
                                            <span className="lg:hidden text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Sectors / Events</span>
                                            <div className="flex flex-wrap gap-2 lg:gap-1.5">
                                                {block.record_types.map((rt) => (
                                                    <span
                                                        key={rt.payload_id}
                                                        className="inline-flex items-center text-[9px] lg:text-[10px] font-heading px-2.5 lg:px-3 py-1 bg-white/5 text-accent border border-white/10 uppercase tracking-widest"
                                                    >
                                                        {rt.record_type?.replace(/_/g, " ") ?? "—"}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expand button (Desktop only) */}
                                        <div className="hidden lg:flex justify-end">
                                            <button
                                                onClick={() => toggle(block.block_number)}
                                                aria-label={isOpen ? "Collapse" : "Expand"}
                                                className={`w-8 h-8 flex items-center justify-center border transition-all duration-200 rounded-none ${isOpen
                                                    ? "bg-accent border-accent text-white"
                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-accent hover:text-accent"
                                                    }`}
                                            >
                                                {isOpen
                                                    ? <ChevronDown className="w-4 h-4" />
                                                    : <ChevronRight className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded panel */}
                                    <AnimatePresence>
                                        {isOpen && <ExpandedPanel block={block} />}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-heading tracking-widest text-center sm:text-left">
                        FEED_SEGMENT{" "}
                        <span className="text-white font-bold">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredEvents.length)}
                        </span>{" "}
                        / <span className="text-white font-bold">{filteredEvents.length.toLocaleString()}</span> RECORDS
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => goTo(page - 1)}
                            disabled={page === 1}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-white/10 text-muted-foreground hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded-none"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                                let p: number;
                                if (totalPages <= 5) p = idx + 1;
                                else if (page <= 3) p = idx + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + idx;
                                else p = page - 2 + idx;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => goTo(p)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 text-[10px] font-heading transition-all rounded-none ${p === page
                                            ? "bg-white text-black font-bold"
                                            : "border border-white/10 text-muted-foreground hover:text-white"
                                            }`}
                                    >
                                        {p.toString().padStart(2, '0')}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => goTo(page + 1)}
                            disabled={page === totalPages}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-white/10 text-muted-foreground hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded-none"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

