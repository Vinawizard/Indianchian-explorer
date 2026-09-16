"use client";
import { cardanoscanTx } from "@/lib/cardanoscan";

import { useState } from "react";

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

// Same logic used in the events table dropdown
export function buildPayload(rt: any, chain: string): Record<string, unknown> {
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

    return {
        chain,
        type: rt.type || rt.record_type,
        payload_hash: rt.payload_hash,
        version: rt.version,
        timestamp: rt.timestamp,
        farmer_id: rt.farmer_id,
    };
}

export function EventAttributes({ event }: { event: any }) {
    const [tab, setTab] = useState<"table" | "json" | "cardano">("table");
    const payload = buildPayload(event, event.chain || "indiachain");

    return (
        <div className="mt-16">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-6 bg-accent" />
                <h2 className="text-lg font-heading text-white uppercase tracking-[0.3em]">EXTENDED_ATTRIBUTES</h2>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => setTab("table")}
                    className={`px-6 py-2 text-[10px] font-heading uppercase tracking-[0.2em] transition-all rounded-none ${tab === "table"
                        ? "bg-white text-black font-bold"
                        : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                        }`}
                >
                    TABLE_VIEW
                </button>
                <button
                    onClick={() => setTab("json")}
                    className={`px-6 py-2 text-[10px] font-heading uppercase tracking-[0.2em] transition-all rounded-none ${tab === "json"
                        ? "bg-accent text-white font-bold"
                        : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                        }`}
                >
                    JSON_EXPORT
                </button>
                <button
                    onClick={() => setTab("cardano")}
                    className={`px-6 py-2 text-[10px] font-heading uppercase tracking-[0.2em] transition-all rounded-none ${tab === "cardano"
                        ? "bg-[#0033ad] text-white font-bold"
                        : "bg-white/5 text-muted-foreground hover:text-white border border-white/10"
                        }`}
                >
                    CARDANO
                </button>
            </div>

            {/* TABLE view */}
            {tab === "table" && (
                <div className="card-premium overflow-hidden">
                    <div className="flex flex-col divide-y divide-white/5">
                        {Object.entries(payload).map(([key, val]) => (
                            <div
                                key={key}
                                className="grid grid-cols-12 group hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="col-span-12 md:col-span-3 px-8 py-5 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] md:border-r border-white/5 flex items-center">
                                    {key.replace(/_/g, " ")}
                                </div>
                                <div className="col-span-12 md:col-span-9 px-8 py-5 text-[13px] font-mono text-white/80 break-all flex items-center leading-loose">
                                    {val != null ? (
                                        typeof val === "string" && val.length > 40 ? (
                                            <span className="text-accent">{val}</span>
                                        ) : (
                                            String(val)
                                        )
                                    ) : (
                                        <span className="opacity-30 tracking-widest">—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* JSON view */}
            {tab === "json" && (
                <div className="card-premium p-8 bg-black">
                    <JsonHighlight value={payload} />
                </div>
            )}

            {/* CARDANO view */}
            {tab === "cardano" && (
                <div className="card-premium overflow-hidden">
                    <div className="flex flex-col divide-y divide-white/5">
                        <div className="grid grid-cols-12 group hover:bg-white/[0.02] transition-colors">
                            <div className="col-span-12 md:col-span-3 px-8 py-5 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] md:border-r border-white/5 flex items-center">
                                MERKLE ROOT
                            </div>
                            <div className="col-span-12 md:col-span-9 px-8 py-5 text-[13px] font-mono text-white/80 break-all flex items-center leading-loose">
                                {event.merkle_root ? String(event.merkle_root) : <span className="opacity-30 tracking-widest">—</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-12 group hover:bg-white/[0.02] transition-colors">
                            <div className="col-span-12 md:col-span-3 px-8 py-5 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] md:border-r border-white/5 flex items-center">
                                CARDANO TX HASH
                            </div>
                            <div className="col-span-12 md:col-span-9 px-8 py-5 text-[13px] font-mono break-all flex items-center leading-loose">
                                {event.cardano_tx_hash ? (
                                    <a
                                        href={cardanoscanTx(event.chain, String(event.cardano_tx_hash))}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#4d9fff] hover:text-white transition-colors duration-200 cursor-pointer"
                                        title="View on CardanoScan"
                                    >
                                        {String(event.cardano_tx_hash)}
                                    </a>
                                ) : (
                                    <span className="opacity-30 tracking-widest">—</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
