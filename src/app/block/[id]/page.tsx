"use client";

import { use, useEffect, useState } from "react";
import { Copy, Check, Hash, CheckCircle2, Table, Code2, Box, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Extrinsic {
    index: number;
    hash: string;
    section: string;
    method: string;
    args: any;
    signer: string | null;
    status: "success" | "failed" | "unknown";
}

interface BlockData {
    number: number;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    extrinsics: Extrinsic[];
}

function CallDataViewer({ args }: { args: any }) {
    const [view, setView] = useState<"TABLE" | "JSON">("TABLE");

    const renderTableArgs = (argData: any, prefix = "") => {
        if (!argData) return <div className="p-4 text-white/50 font-mono text-sm">null</div>;
        
        // Handle direct string/number
        if (typeof argData !== "object") {
            return (
                <div className="flex border-t border-white/5 py-4 px-6 items-center hover:bg-white/[0.02]">
                    <div className="w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-widest pl-6">
                        {prefix || "VALUE"}
                    </div>
                    <div className="w-2/3 text-sm font-mono text-white/80 break-all">
                        {String(argData)}
                    </div>
                </div>
            );
        }

        // Handle Array / Object
        return Object.entries(argData).map(([k, v], i) => (
            <div key={`${prefix}-${k}-${i}`} className="flex border-t border-white/5 py-4 px-6 items-center hover:bg-white/[0.02]">
                <div className="w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-widest pl-6">
                    {prefix ? `${prefix}.${k}` : k}
                </div>
                <div className="w-2/3 text-sm font-mono text-white/80 break-all">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </div>
            </div>
        ));
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between py-4 px-6 border-t border-white/5">
                <div className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest flex items-center gap-2 w-1/3">
                    <Code2 className="w-3 h-3 text-accent" /> CALL_DATA
                </div>
                <div className="w-2/3 flex justify-end">
                    <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-full">
                        <button 
                            onClick={() => setView("TABLE")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest transition-colors ${view === "TABLE" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                        >
                            <Table className="w-3 h-3" /> TABLE
                        </button>
                        <button 
                            onClick={() => setView("JSON")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest transition-colors ${view === "JSON" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                        >
                            {`{ }`} JSON
                        </button>
                    </div>
                </div>
            </div>
            {/* View Area */}
            <div className="bg-[#050505] w-full">
                {view === "TABLE" ? (
                    <div>
                        {Array.isArray(args) ? (
                            args.length > 0 ? args.map((arg, idx) => renderTableArgs(arg, `${idx}`))
                            : <div className="p-6 text-white/40 text-sm font-mono border-t border-white/5">No arguments</div>
                        ) : (
                            renderTableArgs(args)
                        )}
                    </div>
                ) : (
                    <div className="p-6 border-t border-white/5">
                        <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BlockPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [block, setBlock] = useState<BlockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const res = await fetch(`/api/chain/block/${id}`);
                const data = await res.json();
                if (data.status === "ok") {
                    setBlock(data.block);
                }
            } catch (error) {
                console.error("Error fetching block:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlock();
    }, [id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center font-heading text-accent tracking-[0.2em]">LOADING_BLOCK...</div>;
    }

    if (!block) {
        return <div className="min-h-screen bg-black flex items-center justify-center font-heading text-red-500 tracking-[0.2em]">BLOCK_NOT_FOUND</div>;
    }

    return (
        <div className="min-h-screen bg-[#020202] py-12 w-full font-sans">
            <div className="max-w-[1200px] w-[95%] mx-auto relative z-10">
                
                {/* Breadcrumb section */}
                <div className="flex items-center gap-2 mb-10 text-[11px] font-bold uppercase tracking-widest">
                    <Link href="/" className="text-accent hover:text-white transition-colors px-2 py-0.5">INDIACHAIN</Link>
                    <div className="text-white/30 px-2 py-0.5">/</div>
                    <Link href="/" className="text-accent hover:text-white transition-colors px-2 py-0.5">BLOCKS</Link>
                    <div className="text-white/30 px-2 py-0.5">/</div>
                    <div className="text-white px-2 py-0.5">#{id}</div>
                </div>

                {/* BLOCK OVERVIEW */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 bg-white" />
                        <h2 className="text-white text-[13px] font-heading font-bold uppercase tracking-[0.3em] px-1 py-1">
                            BLOCK_OVERVIEW
                        </h2>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                        
                        <div className="flex flex-col md:flex-row py-5 px-8 hover:bg-white/[0.02] items-start md:items-center">
                            <div className="w-full md:w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2 md:mb-0">
                                <Box className="w-3.5 h-3.5 text-white/30" /> BLOCK_NUMBER
                            </div>
                            <div className="w-full md:w-2/3 text-lg font-mono text-white/60">
                                #{block.number}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row py-5 px-8 hover:bg-white/[0.02] items-start md:items-center">
                            <div className="w-full md:w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-2 md:mb-0">
                                STATUS
                            </div>
                            <div className="w-full md:w-2/3 flex items-center">
                                <div className="border border-green-900/50 bg-green-950/30 text-green-500 text-[9px] font-bold px-3 py-1 flex items-center gap-1.5 rounded-none uppercase tracking-widest">
                                    <Check className="w-3 h-3" /> FINALIZED
                                </div>
                            </div>
                        </div>

                        {[
                            { label: "BLOCK_HASH", icon: Hash, value: block.hash },
                            { label: "PARENT_HASH", icon: ChevronRight, value: block.parentHash },
                            { label: "STATE_ROOT", icon: null, value: block.stateRoot },
                            { label: "EXTRINSICS_ROOT", icon: null, value: block.extrinsicsRoot }
                        ].map((row, i) => (
                            <div key={i} className="flex flex-col md:flex-row py-5 px-8 hover:bg-white/[0.02] items-start xl:items-center">
                                <div className="w-full md:w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2 md:mb-0">
                                    {row.icon && <row.icon className="w-3.5 h-3.5 text-white/30" />} {row.label}
                                </div>
                                <div className="w-full md:w-2/3 flex items-center gap-4">
                                    <span className="font-mono text-[13px] text-white/80 break-all">{row.value}</span>
                                    {row.icon && (
                                        <button onClick={() => copyToClipboard(row.value)} className="p-1.5 text-white/30 hover:text-accent transition-colors flex-shrink-0">
                                            {copiedHash === row.value ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-col md:flex-row py-5 px-8 hover:bg-white/[0.02] items-start md:items-center">
                            <div className="w-full md:w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2 md:mb-0">
                                <Box className="w-3.5 h-3.5 text-white/30" /> EXTRINSICS
                            </div>
                            <div className="w-full md:w-2/3 text-[11px] font-bold text-white/50 uppercase tracking-widest">
                                <span className="text-white text-lg mr-2 font-mono">{block.extrinsics.length}</span> TRANSACTIONS IN THIS BLOCK
                            </div>
                        </div>
                    </div>
                </div>

                {/* EXTRINSICS LOG */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 bg-white" />
                        <h2 className="text-white text-[13px] font-heading font-bold uppercase tracking-[0.3em] px-1 py-1">
                            EXTRINSICS_LOG
                        </h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        {block.extrinsics.map((ext) => (
                            <div key={ext.hash} className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                                
                                {/* Extrinsic Header */}
                                <div className="flex items-center gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
                                    <span className="text-[10px] font-heading font-bold text-white/60 tracking-widest uppercase">
                                        EXT_{ext.index}
                                    </span>
                                    <span className="text-[10px] font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded">
                                        {ext.section.toUpperCase()}.{ext.method.toUpperCase()}
                                    </span>
                                    {ext.status === "success" ? (
                                        <div className="border border-green-900/50 bg-green-950/40 text-green-500 text-[8px] font-bold px-2 py-0.5 flex items-center gap-1 rounded-sm uppercase tracking-widest ml-1">
                                            <Check className="w-2.5 h-2.5" /> SUCCESS
                                        </div>
                                    ) : (
                                        <div className="border border-red-900/50 bg-red-950/40 text-red-500 text-[8px] font-bold px-2 py-0.5 flex items-center gap-1 rounded-sm uppercase tracking-widest ml-1">
                                            FAILED
                                        </div>
                                    )}
                                </div>

                                {/* Extrinsic Content */}
                                <div className="flex flex-col">
                                    <div className="flex border-b border-white/5 py-5 px-6 items-center">
                                        <div className="w-1/3 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-white/30" /> HASH
                                        </div>
                                        <div className="w-2/3 flex items-center gap-4">
                                            <span className="font-mono text-sm text-white/70 break-all">{ext.hash}</span>
                                            <button onClick={() => copyToClipboard(ext.hash)} className="p-1 text-white/30 hover:text-white transition-colors">
                                                {copiedHash === ext.hash ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Interactive CALL_DATA viewer */}
                                    <CallDataViewer args={ext.args} />
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
