"use client";
import { useEffect, useMemo, useState } from "react";
import { BAR, GRID, TICK } from "./palette";

export type DayPoint = { day: string; records: number; anchors: number };

const RANGES = [7, 14, 30] as const;
const fmt = (n: number) => n.toLocaleString("en-US");
const short = (n: number) => (n >= 1000 ? `${n % 1000 === 0 ? n / 1000 : (n / 1000).toFixed(1)}k` : String(n));
const niceMax = (v: number) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
};
const dayLabel = (d: string, long = false) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });

/** Records anchored on Cardano per day. One series, bars from one baseline, hover and focus tooltips. */
export function AnchoredChart({ days }: { days: DayPoint[] }) {
    const [range, setRange] = useState<(typeof RANGES)[number]>(14);
    const [hover, setHover] = useState<number | null>(null);
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const m = window.matchMedia("(max-width: 640px)");
        const on = () => setNarrow(m.matches);
        on(); m.addEventListener("change", on);
        return () => m.removeEventListener("change", on);
    }, []);
    const data = useMemo(() => days.slice(-range), [days, range]);
    const today = new Date().toISOString().slice(0, 10);
    const total = data.reduce((a, d) => a + d.records, 0);

    const W = narrow ? 360 : 640, H = narrow ? 220 : 240, padL = 36, padR = 4, padT = 12, padB = 28;
    const iw = W - padL - padR, ih = H - padT - padB;
    const max = niceMax(Math.max(0, ...data.map((d) => d.records)));
    const slot = iw / Math.max(1, data.length);
    const bw = Math.min(24, Math.max(4, slot - 2));       // <= 24px, 2px surface gap at minimum
    const y = (v: number) => padT + ih - (v / max) * ih;
    const every = narrow ? (data.length > 14 ? 10 : data.length > 7 ? 4 : 2) : data.length > 14 ? 5 : data.length > 7 ? 2 : 1;
    const h = hover != null ? data[hover] : null;

    return (
        <div className="card h-full">
            <div className="card-head">
                <div>
                    <h2 className="section-title">Anchored on Cardano</h2>
                    <p className="mt-1.5 pl-[15px] text-[13px] text-faint"><span className="num text-white">{fmt(total)}</span> records</p>
                </div>
                <div className="seg" role="tablist" aria-label="Range">
                    {RANGES.map((r) => (
                        <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)} className="!h-8 !px-3">{r}D</button>
                    ))}
                </div>
            </div>
            <div className="relative px-4 pb-4 pt-6 sm:px-6">
                <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Records anchored on Cardano per day, last ${range} days`} onMouseLeave={() => setHover(null)}>
                    {[0, 0.5, 1].map((f) => (
                        <g key={f}>
                            <line x1={padL} x2={W - padR} y1={y(f * max)} y2={y(f * max)} stroke={GRID} strokeWidth={1} />
                            <text x={padL - 10} y={y(f * max) + 4} textAnchor="end" fontSize={11} fill={TICK} style={{ fontVariantNumeric: "tabular-nums" }}>{short(f * max)}</text>
                        </g>
                    ))}
                    {data.map((d, i) => {
                        const x = padL + slot * i + (slot - bw) / 2;
                        const bh = d.records > 0 ? Math.max(2, (d.records / max) * ih) : 0;
                        const top = padT + ih - bh;
                        const r = Math.min(4, bh / 2, bw / 2);
                        const isToday = d.day === today;
                        return (
                            <g key={d.day}>
                                {bh > 0 && (
                                    <path d={`M${x},${padT + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${padT + ih} Z`}
                                        fill={BAR} opacity={hover == null || hover === i ? (isToday ? 0.55 : 1) : 0.35} style={{ transition: "opacity 150ms ease" }} />
                                )}
                                <rect x={padL + slot * i} y={padT} width={slot} height={ih} fill="transparent" tabIndex={0}
                                    aria-label={`${dayLabel(d.day, true)}: ${fmt(d.records)} records${isToday ? ", today so far" : ""}`}
                                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="outline-none" />
                                {i % every === (data.length - 1) % every && (
                                    <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={TICK}>{dayLabel(d.day)}</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                {h && hover != null && (
                    <div className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 border border-line bg-[#0e0e0e] px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
                        style={{ left: `calc(${((padL + slot * hover + slot / 2) / W) * 100}% )` }}>
                        <p className="num text-[15px] font-semibold text-white">{fmt(h.records)}</p>
                        <p className="whitespace-nowrap text-[12px] text-faint">{dayLabel(h.day, true)}{h.day === today ? " · so far" : ""}</p>
                    </div>
                )}
                <table className="sr-only">
                    <caption>Records anchored on Cardano per day</caption>
                    <tbody>{data.map((d) => <tr key={d.day}><th>{d.day}</th><td>{d.records}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
}
