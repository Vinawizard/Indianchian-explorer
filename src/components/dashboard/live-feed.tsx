"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Box, Hash, Copy, ChevronRight, Layers, CheckCircle2, Server, Search } from "lucide-react";
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

export function LiveNetworkFeed() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [stats, setStats] = useState<ChainStats | null>(null);
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
        // Initial fetch
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
                        {/* Search result count badge */}
                        {isSearchActive && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/30 rounded-full"
                            >
                                <Search className="w-3 h-3 text-accent" />
                                <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
                                    {filteredBlocks.length} / {blocks.length} BLOCKS
                                </span>
                            </motion.div>
                        )}

                        {/* Syncing indicator — hidden during active search */}
                        {!isSearchActive && (
                            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                <motion.div
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                    className="w-2 h-2 rounded-full bg-accent"
                                />
                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                    SYNCING
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-premium overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="col-span-3 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Box className="w-3 h-3" /> BLOCK NUMBER
                        </div>
                        <div className="col-span-6 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Hash className="w-3 h-3" /> BLOCK HASH
                        </div>
                        <div className="col-span-3 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                            <Layers className="w-3 h-3" /> LOAD / ACTIVITY
                        </div>
                    </div>

                    {/* Feed Rows */}
                    <div className="flex flex-col">
                        <AnimatePresence initial={false}>
                            {filteredBlocks.map((block) => (
                                <motion.div
                                    key={block.number}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors group items-center"
                                >
                                    <div className="col-span-3 font-mono text-white/80">
                                        <Link href={`/block/${block.number}`} className="hover:text-accent transition-colors">
                                            #{block.number}
                                        </Link>
                                    </div>
                                    <div className="col-span-6 flex items-center gap-2 font-mono text-sm text-white/60">
                                        <span className="truncate max-w-[80%]">{block.hash}</span>
                                        <button
                                            onClick={() => copyToClipboard(block.hash)}
                                            className="text-white/40 hover:text-white transition-colors p-1"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="col-span-3 flex items-center justify-between font-heading uppercase text-xs">
                                        <span className="text-white/80">
                                            <span className="text-white font-bold">{block.extrinsicsCount}</span> EXTRINSICS
                                        </span>
                                        <Link href={`/block/${block.number}`} className="flex items-center justify-center w-9 h-9 border border-white/10 hover:border-accent transition-colors text-white/40">
                                            <ChevronRight className="w-4 h-4" />
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

            {/* VALIDATOR NODE HEALTH */}
            <div>
                <h2 className="text-xl text-heading uppercase tracking-tighter flex items-center gap-3 mb-6">
                    <Server className="w-5 h-5 text-white/50" /> VALIDATOR NODE HEALTH
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stats?.network?.nodes ? stats.network.nodes.map((node) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-mono text-xs text-white/60 font-bold">NODE_{node.id}</span>
                                <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'up' ? 'bg-[#ff5500] shadow-[0_0_10px_#ff5500]' : 'bg-red-600 shadow-[0_0_10px_#dc2626]'}`} />
                            </div>

                            <div>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5 font-bold">CONNECTION STATE</p>
                                <p className="text-sm font-bold text-white uppercase tracking-wider">
                                    {node.status === 'up' ? 'STABLE / SYNCHED' : 'OFFLINE'}
                                </p>
                            </div>

                            {/* Subtle hover effect light */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors pointer-events-none -mr-16 -mt-16" />
                        </motion.div>
                    )) : (
                        // Skeleton loading state
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-32 animate-pulse" />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
