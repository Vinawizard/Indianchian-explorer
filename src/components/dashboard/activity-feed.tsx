"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Box, FileText, ArrowRight, Activity } from "lucide-react";
import { mockRecentBlocks, mockRecentTxns } from "@/lib/mockData";

export function ActivityFeed() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Latest Blocks */}
            <div className="card-premium flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl text-heading uppercase tracking-tighter flex items-center gap-3">
                        <Box className="w-5 h-5 text-accent" /> Blocks
                    </h2>
                    <Link href="/blocks" className="text-[10px] text-muted-foreground hover:text-white uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                        VIEW FEED <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mockRecentBlocks.map((block, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            className="group flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center rounded-none group-hover:border-accent transition-colors">
                                    <span className="font-heading text-[10px] text-muted-foreground group-hover:text-accent transition-colors">BK </span>
                                </div>
                                <div>
                                    <Link href={`/block/${block.number}`} className="text-heading text-white hover:text-accent transition-colors text-lg">
                                        {block.number}
                                    </Link>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{block.time}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                    Recipient: <Link href={`/address/${block.miner}`} className="text-white hover:text-accent font-bold">{block.miner.substring(0, 10)}...{block.miner.substring(block.miner.length - 4)}</Link>
                                </p>
                                <div className="flex items-center justify-end gap-3 mt-2">
                                    <span className="text-[10px] font-heading text-accent uppercase">{block.txCount} TX</span>
                                    <div className="w-20 h-0.5 bg-white/5 overflow-hidden flex">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: block.gasUsed }}
                                            className="bg-accent h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Latest Transactions */}
            <div className="card-premium flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl text-heading uppercase tracking-tighter flex items-center gap-3">
                        <Activity className="w-5 h-5 text-accent" /> Data
                    </h2>
                    <Link href="/txs" className="text-[10px] text-muted-foreground hover:text-white uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                        VIEW FEED <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mockRecentTxns.map((tx, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0 gap-4"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center rounded-none group-hover:border-accent transition-colors">
                                    <span className="font-heading text-[10px] text-muted-foreground group-hover:text-accent transition-colors">TX </span>
                                </div>
                                <div className="overflow-hidden">
                                    <Link href={`/tx/${tx.hash}`} className="font-mono font-bold text-white hover:text-accent transition-colors text-sm block truncate max-w-[200px]">
                                        {tx.hash}
                                    </Link>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{tx.time}</p>
                                </div>
                            </div>

                            <div className="flex items-center sm:items-end justify-between sm:flex-col gap-2 sm:text-right">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-tight">
                                    <span className="opacity-60">FROM</span>
                                    <Link href={`/address/${tx.from}`} className="text-white hover:text-accent font-bold">{tx.from.substring(0, 6)}</Link>
                                    <span className="text-accent">→</span>
                                    <span className="opacity-60">TO</span>
                                    <Link href={`/address/${tx.to}`} className="text-white hover:text-accent font-bold">{tx.to.substring(0, 6)}</Link>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-heading text-accent uppercase tracking-widest">
                                    {tx.value}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
