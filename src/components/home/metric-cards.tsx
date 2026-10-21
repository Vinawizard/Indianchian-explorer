"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Anchor, Box, Layers } from "lucide-react";

type Props = { latestBlock: number | null; totalRecords: number | null; anchored: number | null; network: string };
const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-US"));

/**
 * The three headline figures as one Trivolve band (the blue -> black -> red wash with the plus
 * grid, figures in dot-matrix), the same treatment as the stats band on trivolvetech.com.
 * Latest block and the chain's record counter refresh every block.
 */
export function MetricCards({ latestBlock, totalRecords, anchored, network }: Props) {
    const [block, setBlock] = useState(latestBlock);
    const [records, setRecords] = useState(totalRecords);
    const busy = useRef(false);
    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const j = await (await fetch(`/api/chain/stats?network=${network}`, { cache: "no-store" })).json();
                if (j.status === "ok") {
                    if (j.stats.latestBlock) setBlock(j.stats.latestBlock);
                    if (typeof j.stats.totalRecords === "number" && j.stats.totalRecords > 0) setRecords(j.stats.totalRecords);
                }
            } catch { /* keep the last values */ } finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        return () => clearInterval(t);
    }, [network]);

    const cards = [
        { label: "Latest block", value: fmt(block), icon: Box, href: block ? `/block/${block}` : "/blocks" },
        { label: "Total records", value: fmt(records), icon: Layers, href: "/records" },
        { label: "Anchored on Cardano", value: fmt(anchored), icon: Anchor, href: "/anchors" },
    ];
    return (
        <section aria-label="Network figures" className="wash-x grid grid-cols-1 overflow-hidden rounded-[22px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, href }, i) => (
                <Link key={label} href={href}
                    className={`spot group flex flex-col items-center gap-3.5 px-6 py-10 text-center transition-colors duration-200 hover:bg-white/[0.03] ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}>
                    <Icon className="h-5 w-5 text-white/80 transition-transform duration-300 ease-out group-hover:-translate-y-0.5" strokeWidth={1.75} aria-hidden />
                    <span className="t-figure text-white">{value}</span>
                    <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">{label}</span>
                </Link>
            ))}
        </section>
    );
}
