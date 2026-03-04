"use client";

import { use, useState } from "react";
import { Copy, Check, Box, Clock, Hash, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function BlockPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black relative py-8 w-full overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

            {/* Ambient Glow */}
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1280px] w-[90%] mx-auto px-4 lg:px-8 py-8 relative z-10">

                {/* Header Section */}
                <div className="flex items-center gap-6 mb-12">
                    <div className="p-4 bg-white/5 border border-white/10 text-accent">
                        <Box className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-heading text-white uppercase tracking-[0.3em]">
                                BLOCK_SPEC <span className="text-accent">#{id}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-heading px-3 py-1 bg-white/5 text-accent border border-accent/30 uppercase tracking-[0.2em] rounded-none">
                                FINALIZED
                            </span>
                            <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> MINED_2_MINS_AGO
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card-premium overflow-hidden mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">

                        <div className="p-8 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-accent" /> BLOCK_HASH
                            </p>
                            <div className="flex items-center gap-3">
                                <p className="font-mono text-sm text-white/80 truncate max-w-[200px]" title={`0x1abc...${id}`}>
                                    0x1abc...{id}
                                </p>
                                <button onClick={copyToClipboard} className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-muted-foreground hover:text-accent">
                                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-8 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-accent" /> TIMESTAMP
                            </p>
                            <p className="font-mono text-sm text-white/80 uppercase tracking-wider">
                                OCT-24-2024 10:45:00 AM +UTC
                            </p>
                        </div>

                        <div className="p-8 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-3">
                                LOAD_ACTIVITY
                            </p>
                            <p className="font-mono text-sm text-white/80">
                                <span className="text-accent font-bold">142</span> TXS_IN_SEGMENT
                            </p>
                        </div>

                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/5 mb-8">
                    <nav className="flex items-center gap-10">
                        <button className="px-1 py-5 text-[10px] font-heading text-accent border-b-2 border-accent uppercase tracking-[0.3em]">
                            OVERVIEW
                        </button>
                        <button className="px-1 py-5 text-[10px] font-heading text-muted-foreground hover:text-white transition-colors uppercase tracking-[0.3em]">
                            CONSENSUS_STARE
                        </button>
                        <button className="px-1 py-5 text-[10px] font-heading text-muted-foreground hover:text-white transition-colors uppercase tracking-[0.3em]">
                            REWARD_SEGMENT
                        </button>
                    </nav>
                </div>

                {/* Detailed Overview List */}
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    className="card-premium divide-y divide-white/5"
                >
                    {[
                        { label: "FEE_RECIPIENT", value: <span className="text-accent hover:text-white cursor-pointer font-mono tracking-wider">0x123...456</span> },
                        { label: "BLOCK_REWARD", value: "2.145 IND" },
                        { label: "TOTAL_DIFFICULTY", value: "58,750,000" },
                        { label: "STORAGE_SIZE", value: "45,550 bytes" },
                        { label: "GAS_UTILIZATION", value: "14,999,021 (50%)" },
                        { label: "GAS_QUOTA", value: "30,000,000" },
                        { label: "BASE_FEE_PROTOCOL", value: "34.5 Gwei" }
                    ].map((row, i) => (
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                            key={i}
                            className="grid grid-cols-1 sm:grid-cols-4 gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors items-center"
                        >
                            <div className="sm:col-span-1 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em]">
                                {row.label}:
                            </div>
                            <div className="sm:col-span-3 text-sm font-mono text-white/80 uppercase tracking-widest">
                                {row.value}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

