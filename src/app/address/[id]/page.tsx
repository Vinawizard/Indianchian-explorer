"use client";

import { use, useState } from "react";
import { Copy, Check, Wallet, QrCode, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { mockRecentTxns } from "@/lib/mockData";

export default function AddressPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Profile */}
            <div className="flex items-start md:items-center justify-between gap-4 mb-8 flex-col md:flex-row">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-bold text-xl border-[4px] border-background">
                        0x
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono tracking-tight">{id.slice(0, 6)}...{id.slice(-4)}</h1>
                            <button onClick={copyToClipboard} className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                <QrCode className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 px-2 py-0.5 bg-muted rounded inline-block font-medium">Externally Owned Account</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 w-full md:w-auto flex items-center gap-4 min-w-[250px] shadow-sm">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">IND Balance</p>
                        <p className="font-bold text-xl">145.234 <span className="text-sm text-muted-foreground font-normal">IND</span></p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ label: "Token Holdings", val: "$45,200", sub: "12 tokens" }, { label: "Total Transactions", val: "1,204", sub: "Since Oct 2022" }, { label: "First Txn", val: "Oct 12, 2022", sub: "Block 450,111" }, { label: "Last Txn", val: "2 mins ago", sub: "Block 19,453,021" }].map((s, i) => (
                    <div key={i} className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">{s.label}</p>
                        <p className="font-bold text-lg">{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Transaction History */}
            <h2 className="text-xl font-bold mb-4">Latest Transactions</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Txn Hash</th>
                                <th className="px-6 py-4 font-medium">Method</th>
                                <th className="px-6 py-4 font-medium">Age</th>
                                <th className="px-6 py-4 font-medium">From / To</th>
                                <th className="px-6 py-4 font-medium text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockRecentTxns.map((tx, i) => {
                                const isOut = i % 2 === 0;
                                return (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={i}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0 group"
                                    >
                                        <td className="px-6 py-4 font-mono">
                                            <Link href={`/tx/${tx.hash}`} className="text-primary hover:underline">{tx.hash.slice(0, 10)}...</Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-[10px] font-semibold tracking-wider rounded bg-secondary text-secondary-foreground border border-border">TRANFER</span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{tx.time}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-muted-foreground">{tx.from.slice(0, 6)}...</span>
                                                {isOut ?
                                                    <span className="p-1 rounded bg-amber-500/10 text-amber-500"><ArrowRightLeft className="w-3 h-3" /></span> :
                                                    <span className="p-1 rounded bg-emerald-500/10 text-emerald-500"><ArrowDownRight className="w-3 h-3" /></span>
                                                }
                                                <Link href={`/address/${tx.to}`} className="text-primary hover:underline font-mono">{tx.to.slice(0, 6)}...</Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {tx.value}
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
