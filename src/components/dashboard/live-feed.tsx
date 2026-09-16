"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Box, Hash, Copy, ChevronRight, Layers, CheckCircle2, Search } from "lucide-react";
import Link from "next/link";
import { useSearch } from "@/components/providers/search-provider";

interface Block {
    number: number;
    hash: string;
    extrinsicsCount: number;
}

interface NodeMetrics {
    id: number;
    port: number;
    status: "up" | "down";
    blockHeight: number;
    peers: number;
}

interface ChainStats {
    latestBlock: number;
    finalizedBlock: number;
    chainName: string;
    network: {
        nodes: NodeMetrics[];
        activeValidators: number;
        highestBlock: number;
    };
}

interface LiveFeedProps {
    initialBlocks?: Block[];
    initialStats?: ChainStats | null;
}

export function LiveNetworkFeed({ initialBlocks = [], initialStats = null }: LiveFeedProps) {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
    const [stats, setStats] = useState<ChainStats | null>(initialStats);
    const [isPolling, setIsPolling] = useState(true);
    const { query } = useSearch();

    const fetchData = async () => {
        try {
            // Fetch both endpoints
            const [blocksRes, statsRes] = await Promise.all([
                fetch("/api/chain/blocks?count=10"),
                fetch("/api/chain/stats")
            ]);

            if (blocksRes.ok) {
                const bData = await blocksRes.json();
                if (bData.status === "ok") {
                    setBlocks(bData.blocks);
                }
            }

            if (statsRes.ok) {
                const sData = await statsRes.json();
                if (sData.status === "ok") {
                    setStats(sData.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching live feed:", error);
        }
    };

    useEffect(() => {
        // Initial fetch immediately — keeps block count / stats in sync right away
        fetchData();

        // 6 second polling interval matches block time
        const intervalId = setInterval(() => {
            if (isPolling) fetchData();
        }, 6000);

        return () => clearInterval(intervalId);
    }, [isPolling]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    // Efficient client-side search filtering — runs only when query or blocks change
    const filteredBlocks = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return blocks;

        return blocks.filter((block) => {
            // Match by exact block number prefix or full number
            const blockNumStr = String(block.number);
            if (blockNumStr.startsWith(q)) return true;

            // Match by hash (partial prefix match)
            if (block.hash.toLowerCase().startsWith(q)) return true;

            // Also allow substring match on hash for broader search
            if (block.hash.toLowerCase().includes(q)) return true;

            return false;
        });
    }, [blocks, query]);

    const isSearchActive = query.trim().length > 0;

    return (
        <div className="mt-12 space-y-12">
            {/* LIVE BLOCK FEED */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl text-heading uppercase tracking-tighter flex items-center gap-3">
                            <Activity className="w-6 h-6 text-accent" /> LIVE BLOCK FEED
                        </h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                            UPDATES EVERY ~6 SECONDS WITH NETWORK CONSENSUS
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        {/* Search result count badge — sharp corners */}
                        {isSearchActive && (
                            <motion.div
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/40"
                            >
                                <Search className="w-3 h-3 text-accent" />
                                <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
                                    {filteredBlocks.length} / {blocks.length} BLOCKS
                                </span>
                            </motion.div>
                        )}

                        {/* Syncing indicator — sharp corners */}
                        {!isSearchActive && (
                            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10">
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                                    className="w-1.5 h-1.5 bg-accent"
                                />
                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                    SYNCING
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden border border-white/10">
                    {/* Header row */}
                    <div className="grid grid-cols-12 bg-white/[0.03] border-b border-white/10">
                        <div className="col-span-4 sm:col-span-3 flex items-center gap-2 px-2 sm:px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-widest border-r border-white/10">
                            <Box className="w-3 h-3 shrink-0 hidden sm:block" /> BLOCK
                        </div>
                        <div className="col-span-5 sm:col-span-6 flex items-center gap-2 px-2 sm:px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-widest border-r border-white/10">
                            <Hash className="w-3 h-3 shrink-0 hidden sm:block" /> HASH
                        </div>
                        <div className="col-span-3 flex items-center gap-2 px-2 sm:px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Layers className="w-3 h-3 shrink-0 hidden sm:block" /> <span className="hidden sm:inline">EXTRINSICS</span><span className="sm:hidden">EXT</span>
                        </div>
                    </div>

                    {/* Feed Rows */}
                    <div className="flex flex-col">
                        <AnimatePresence initial={false}>
                            {filteredBlocks.map((block, idx) => (
                                <motion.div
                                    key={block.number}
                                    initial={{ opacity: 0, y: -16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="grid grid-cols-12 border-b border-white/5 hover:bg-white/[0.04] transition-colors group items-stretch relative"
                                >
                                    {/* Accent left bar on hover */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Block number */}
                                    <div className="col-span-4 sm:col-span-3 flex items-center px-2 sm:px-5 py-4 border-r border-white/5 font-mono">
                                        <Link
                                            href={`/block/${block.number}`}
                                            className="flex flex-col lg:flex-row items-start lg:items-center gap-1 sm:gap-2 text-white/90 hover:text-accent transition-colors text-sm font-semibold"
                                        >
                                            {idx === 0 && (
                                                <span className="text-[8px] font-mono bg-accent text-white px-1.5 py-0.5 uppercase tracking-wider leading-none">
                                                    LATEST
                                                </span>
                                            )}
                                            <span>#{block.number}</span>
                                        </Link>
                                    </div>

                                    {/* Hash */}
                                    <div className="col-span-5 sm:col-span-6 flex items-center gap-2 px-2 sm:px-5 py-4 border-r border-white/5 font-mono text-xs text-white/50 min-w-0">
                                        <span className="truncate">{block.hash}</span>
                                        <button
                                            onClick={() => copyToClipboard(block.hash)}
                                            className="shrink-0 text-white/30 hover:text-white/80 transition-colors hidden sm:block"
                                            title="Copy hash"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Extrinsics + link */}
                                    <div className="col-span-3 flex items-center justify-between px-2 sm:px-5 py-4">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className="font-heading text-sm sm:text-lg text-white font-bold leading-none">{block.extrinsicsCount}</span>
                                            <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono leading-none hidden sm:inline">EXT</span>
                                        </div>
                                        <Link
                                            href={`/block/${block.number}`}
                                            className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 border border-white/10 hover:border-accent hover:text-accent transition-colors text-white/30 shrink-0"
                                        >
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty state: loading */}
                        {blocks.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground font-mono text-sm uppercase">
                                Loading blocks...
                            </div>
                        )}

                        {/* Empty state: no search results */}
                        {blocks.length > 0 && filteredBlocks.length === 0 && isSearchActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-12 text-center"
                            >
                                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                                    NO BLOCKS MATCH &quot;{query.trim()}&quot;
                                </p>
                                <p className="text-muted-foreground/40 font-mono text-[10px] uppercase tracking-widest mt-2">
                                    TRY A BLOCK NUMBER OR PARTIAL HASH
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
