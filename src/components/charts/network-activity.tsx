"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { BAR, GRID, TICK } from "./palette";

export type DayPoint = { day: string; records: number; anchors: number };
type Range = "7" | "14" | "30";

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

/** Network activity: records anchored on Cardano per day. One series, 2px line over a soft area, crosshair tooltip. */
export function NetworkActivity({ days }: { days: DayPoint[] }) {
    const [range, setRange] = useState<Range>("14");
    const [hover, setHover] = useState<number | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(600);
    useEffect(() => {
        const el = box.current; if (!el) return;
        const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
        ro.observe(el); return () => ro.disconnect();
    }, []);
    const data = useMemo(() => days.slice(-Number(range)), [days, range]);
    const total = data.reduce((a, d) => a + d.records, 0);

    const H = 220, padL = 40, padR = 12, padT = 14, padB = 28;
    const iw = w - padL - padR, ih = H - padT - padB;
    const max = niceMax(Math.max(0, ...data.map((d) => d.records)));
    const x = (i: number) => padL + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2);
    const y = (v: number) => padT + ih - (v / max) * ih;
    const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.records).toFixed(1)}`).join(" ");
    const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${padT + ih} L${x(0).toFixed(1)},${padT + ih} Z` : "";
    const step = Math.max(1, Math.ceil(data.length / Math.max(3, Math.floor(iw / 72))));
    const h = hover != null ? data[hover] : null;

    const onMove = (e: React.PointerEvent<SVGRectElement>) => {
        const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
        const rel = ((e.clientX - r.left) / r.width) * iw;
        setHover(Math.max(0, Math.min(data.length - 1, Math.round((rel / iw) * (data.length - 1)))));
    };

    return (
        <section className="card flex h-full flex-col" aria-labelledby="na">
            <div className="card-head">
                <div className="min-w-0">
                    <h2 id="na" className="section-title">Network activity</h2>
                    <p className="mt-1 pl-[13px] text-[12px] text-white/55">Records anchored per day · <span className="num text-white/85">{fmt(total)}</span></p>
                </div>
                <Segmented label="Range" size="sm" value={range} onChange={setRange}
                    options={[{ value: "7", label: "7D" }, { value: "14", label: "14D" }, { value: "30", label: "30D" }]} />
            </div>
            <div ref={box} className="relative flex-1 px-3 pb-3 pt-4">
                <svg width={w} height={H} className="block max-w-full" role="img" aria-label={`Records anchored on Cardano per day, last ${range} days`}>
                    <defs>
                        <linearGradient id="na-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={BAR} stopOpacity="0.38" />
                            <stop offset="100%" stopColor={BAR} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 0.5, 1].map((f) => (
                        <g key={f}>
                            <line x1={padL} x2={w - padR} y1={y(f * max)} y2={y(f * max)} stroke={GRID} strokeWidth={1} />
                            <text x={padL - 10} y={y(f * max) + 4} textAnchor="end" fontSize={11} fill={TICK} style={{ fontVariantNumeric: "tabular-nums" }}>{short(f * max)}</text>
                        </g>
                    ))}
                    <path d={area} fill="url(#na-fill)" />
                    <path d={line} fill="none" stroke={BAR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {data.map((d, i) => (i % step === (data.length - 1) % step) && (
                        <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === data.length - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize={11} fill={TICK}>{dayLabel(d.day)}</text>
                    ))}
                    {h && hover != null && (
                        <g pointerEvents="none">
                            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
                            <circle cx={x(hover)} cy={y(h.records)} r={5} fill={BAR} stroke="#0e0e12" strokeWidth={2} />
                        </g>
                    )}
                    <rect x={padL} y={padT} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
                </svg>
                {h && hover != null && (
                    <div className="glass pointer-events-none absolute top-3 z-10 -translate-x-1/2 rounded-[10px] px-3 py-2"
                        style={{ left: Math.min(Math.max(x(hover) + 12, 70), w - 60) }}>
                        <p className="num text-[15px] font-semibold text-white">{fmt(h.records)}</p>
                        <p className="whitespace-nowrap text-[11px] text-white/60">{dayLabel(h.day, true)}</p>
                    </div>
                )}
                <table className="sr-only">
                    <caption>Records anchored on Cardano per day</caption>
                    <tbody>{data.map((d) => <tr key={d.day}><th>{d.day}</th><td>{d.records}</td></tr>)}</tbody>
                </table>
            </div>
        </section>
    );
}
