"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fmtInt, fmtPct } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";

export type StripData = {
    totalRecords: number | null; anchored: number | null; ledgerTotal: number | null;
    best: number | null; finalized: number | null;
    validatorsUp: number | null; validatorsTotal: number | null;
    lastAnchorAt: string | null; lastAnchorIndex: number | null;
    byType: { farmer: number; agri_record: number; credit_app: number } | null;
};

function Cell({ label, children, sub, lead }: { label: string; children: React.ReactNode; sub?: React.ReactNode; lead?: boolean }) {
    return (
        <div className="min-w-0 px-5 py-4">
            <div className="text-[13px] text-faint">{label}</div>
            <div className={`num mt-1.5 text-ink ${lead ? "text-[30px] leading-9" : "text-[22px] leading-8"}`}>{children}</div>
            {sub && <div className="mt-1 text-[12px] text-faint">{sub}</div>}
        </div>
    );
}

/**
 * The headline figures, one container split by hairlines. Records, height and validators
 * come from the chain itself and refresh every block (6 s) while the tab is visible.
 */
export function LiveStrip({ initial, network }: { initial: StripData; network: string }) {
    const [d, setD] = useState(initial);
    const [updated, setUpdated] = useState<number>(() => Date.now());
    const [now, setNow] = useState<number>(() => Date.now());
    const busy = useRef(false);

    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const r = await fetch(`/api/chain/stats?network=${network}`, { cache: "no-store" });
                const j = await r.json();
                if (j.status === "ok") {
                    const s = j.stats;
                    const nodes: { status: string }[] = s.network?.nodes ?? [];
                    setD((p) => ({
                        ...p,
                        totalRecords: typeof s.totalRecords === "number" ? s.totalRecords : p.totalRecords,
                        best: s.latestBlock ?? p.best,
                        finalized: s.finalizedBlock ?? p.finalized,
                        validatorsUp: nodes.length ? nodes.filter((n) => n.status === "up").length : p.validatorsUp,
                        validatorsTotal: nodes.length || p.validatorsTotal,
                    }));
                    setUpdated(Date.now());
                }
            } catch { /* keep the last good values; the freshness label turns amber */ }
            finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        const c = setInterval(() => setNow(Date.now()), 1000);
        const onVis = () => { if (!document.hidden) void tick(); };
        document.addEventListener("visibilitychange", onVis);
        return () => { clearInterval(t); clearInterval(c); document.removeEventListener("visibilitychange", onVis); };
    }, [network]);

    const age = Math.max(0, Math.round((now - updated) / 1000));
    const stale = age > 30;
    const waiting = d.ledgerTotal != null && d.anchored != null ? Math.max(0, d.ledgerTotal - d.anchored) : null;

    return (
        <section aria-label="Network figures" className="panel">
            <div className="grid grid-cols-2 md:grid-cols-5 [&>*]:border-line max-md:[&>*:nth-child(n+2)]:border-t max-md:[&>*:nth-child(odd)]:border-l md:[&>*+*]:border-l">
                <div className="col-span-2 md:col-span-1">
                    <Cell label="Records on IndianChain" lead
                        sub={d.byType ? `${fmtInt(d.byType.farmer)} farmer · ${fmtInt(d.byType.agri_record)} agri · ${fmtInt(d.byType.credit_app)} credit` : undefined}>
                        {fmtInt(d.totalRecords)}
                    </Cell>
                </div>
                <Cell label="Anchored on Cardano" sub={d.ledgerTotal && d.anchored != null ? `${fmtPct(d.anchored, d.ledgerTotal)} of records` : undefined}>
                    {fmtInt(d.anchored)}
                </Cell>
                <Cell label="Waiting for anchor" sub="Sealed in the next batches of 100">
                    {fmtInt(waiting)}
                </Cell>
                <Cell label="Finalized block" sub={d.best != null ? <>Best <span className="num">{fmtInt(d.best)}</span></> : undefined}>
                    {d.finalized != null ? <Link href={`/block/${d.finalized}`} className="hover:text-link transition-colors">{fmtInt(d.finalized)}</Link> : "—"}
                </Cell>
                <Cell label="Last Cardano anchor" sub={d.lastAnchorIndex != null ? <Link href={`/anchor/${d.lastAnchorIndex}`} className="hover:text-ink">Batch #{fmtInt(d.lastAnchorIndex)}</Link> : undefined}>
                    <span className="text-[18px] leading-8"><TimeAgo iso={d.lastAnchorAt} /></span>
                </Cell>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-2.5 text-[12px] text-faint">
                <span>
                    {d.validatorsTotal ? <><span className="num text-muted">{d.validatorsUp}</span> of <span className="num text-muted">{d.validatorsTotal}</span> validators producing blocks</> : "Validator status unavailable"}
                    {" · "}6-second blocks, GRANDPA finality
                </span>
                <span className={`inline-flex items-center gap-2 ${stale ? "text-warning" : ""}`} aria-live="polite">
                    <span aria-hidden className={`h-1.5 w-1.5 ${stale ? "bg-warning" : "bg-positive"}`} />
                    {stale ? `Not updated for ${age} s` : `Live · updated ${age} s ago`}
                </span>
            </div>
        </section>
    );
}
