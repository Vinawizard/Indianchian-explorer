"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Box, Layers } from "lucide-react";
import { CardanoIcon } from "@/components/ui/cardano-icon";
import { DotNum } from "@/components/ui/dot-num";

type Props = { latestBlock: number | null; totalRecords: number | null; anchored: number | null; network: string };
const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-US"));

/**
 * The three headline figures in the hero, set in the wordmark's dot matrix on one baseline and
 * divided by hairlines. Latest block and the chain's event counter refresh every block.
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
        { label: "Total events", value: fmt(records), icon: Layers, href: "/events" },
        { label: "Anchored on Cardano", value: fmt(anchored), icon: CardanoIcon, href: "/anchors" },
    ];
    return (
        <section aria-label="Network figures" className="grid grid-cols-1 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, href }, i) => (
                <Link key={label} href={href}
                    className={`group flex flex-col items-center gap-4 px-4 py-8 text-center sm:py-2 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}>
                    <DotNum value={value} className="transition-colors duration-200 group-hover:text-[#c9cfff]" />
                    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors duration-200 group-hover:text-white">
                        <Icon className="h-3.5 w-3.5 text-blue-text" aria-hidden />{label}
                    </span>
                </Link>
            ))}
        </section>
    );
}
