"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { compact, dayLabel, niceMax, smoothPath, stepPath, type Pt } from "./paths";

export type Series = { key: string; label: string; color: string; values: number[] };
type Range = "7" | "14" | "30";
const RANGES: { value: Range; label: string }[] = [{ value: "7", label: "1W" }, { value: "14", label: "2W" }, { value: "30", label: "1M" }];
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * The explorer's chart card, after the original: plain uppercase title, tracked subtitle, a 1W/2W/1M
 * toggle, dashed grid, gradient areas. `step` draws a held value per day; `smooth` a monotone curve.
 * A crosshair follows the pointer and the tooltip lists every series for that day.
 */
export function TrendChart({ title, subtitle, days, series, mode, legend }: {
    title: string; subtitle: string; days: string[]; series: Series[]; mode: "step" | "smooth"; legend?: boolean;
}) {
    const uid = useId().replace(/:/g, "");
    const [range, setRange] = useState<Range>("14");
    const [hover, setHover] = useState<number | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(560);
    useEffect(() => {
        const el = box.current; if (!el) return;
        const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
        ro.observe(el); return () => ro.disconnect();
    }, []);

    const n = Math.min(Number(range), days.length);
    const d = useMemo(() => days.slice(-n), [days, n]);
    const s = useMemo(() => series.map((x) => ({ ...x, values: x.values.slice(-n) })), [series, n]);
    const totals = s.map((x) => x.values.reduce((a, v) => a + v, 0));

    const H = 250, padL = 44, padR = 8, padT = 10, padB = 30;
    const iw = w - padL - padR, ih = H - padT - padB;
    const max = niceMax(Math.max(1, ...s.flatMap((x) => x.values)));
    const slot = mode === "step" ? iw / Math.max(1, d.length) : iw / Math.max(1, d.length - 1);
    const xAt = (i: number) => (mode === "step" ? padL + i * slot : padL + i * slot);
    const yAt = (v: number) => padT + ih - (v / max) * ih;
    const base = padT + ih;
    const every = Math.max(1, Math.ceil(d.length / Math.max(3, Math.floor(iw / 78))));

    const paths = s.map((x) => {
        const pts: Pt[] = x.values.map((v, i) => ({ x: +xAt(i).toFixed(1), y: +yAt(v).toFixed(1) }));
        const line = mode === "step" ? stepPath(pts, padL + iw) : smoothPath(pts);
        const lastX = mode === "step" ? padL + iw : pts[pts.length - 1]?.x ?? padL;
        const area = pts.length ? `${line} L${lastX},${base} L${pts[0].x},${base} Z` : "";
        return { ...x, line, area };
    });
    const hx = hover == null ? 0 : mode === "step" ? xAt(hover) + slot / 2 : xAt(hover);

    const onMove = (e: React.PointerEvent<SVGRectElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = ((e.clientX - r.left) / r.width) * iw;
        const i = mode === "step" ? Math.floor(rel / slot) : Math.round(rel / slot);
        setHover(Math.max(0, Math.min(d.length - 1, i)));
    };

    return (
        <section className="card flex h-full flex-col" aria-label={title}>
            <div className="card-head">
                <div className="min-w-0">
                    <h2 className="section-title">{title}</h2>
                    <p className="card-sub">{subtitle}</p>
                </div>
                <Segmented label={`${title} range`} size="sm" value={range} onChange={setRange} options={RANGES} />
            </div>
            {legend && (
                <ul className="flex flex-wrap gap-x-6 gap-y-2 px-8 pb-2">
                    {s.map((x, i) => (
                        <li key={x.key} className="flex items-center gap-2 text-[13px] text-white/70">
                            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: x.color, boxShadow: `0 0 8px ${x.color}` }} />
                            {x.label}<span className="num text-white">{fmt(totals[i])}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div ref={box} className="relative flex-1 px-4 pb-5 pt-3 sm:px-6">
                <svg width={w} height={H} className="block max-w-full overflow-visible" role="img" aria-label={`${title}, last ${n} days`}>
                    <defs>
                        {paths.map((p) => (
                            <linearGradient key={p.key} id={`${uid}-${p.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={p.color} stopOpacity={mode === "step" ? 0.32 : 0.28} />
                                <stop offset="100%" stopColor={p.color} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                        <g key={f}>
                            <line x1={padL} x2={padL + iw} y1={yAt(f * max)} y2={yAt(f * max)} stroke="rgba(255,255,255,0.06)" strokeDasharray={f === 0 ? undefined : "3 5"} />
                            <text x={padL - 12} y={yAt(f * max) + 4} textAnchor="end" fontSize={11} fill="#5f6680" style={{ fontVariantNumeric: "tabular-nums" }}>{compact(f * max)}</text>
                        </g>
                    ))}
                    {d.map((day, i) => i % every === (d.length - 1) % every && (
                        <g key={day}>
                            <line x1={xAt(i) + (mode === "step" ? slot / 2 : 0)} x2={xAt(i) + (mode === "step" ? slot / 2 : 0)} y1={padT} y2={base} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 5" />
                            <text x={xAt(i) + (mode === "step" ? slot / 2 : 0)} y={H - 8} textAnchor={mode === "smooth" && i === d.length - 1 ? "end" : mode === "smooth" && i === 0 ? "start" : "middle"} fontSize={11} fill="#5f6680">{dayLabel(day)}</text>
                        </g>
                    ))}
                    {paths.map((p) => (
                        <g key={`${p.key}-${range}`}>
                            <path d={p.area} fill={`url(#${uid}-${p.key})`} className="chart-area" />
                            <path d={p.line} fill="none" stroke={p.color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-line" />
                        </g>
                    ))}
                    {hover != null && (
                        <g pointerEvents="none">
                            <line x1={hx} x2={hx} y1={padT} y2={base} stroke="rgba(255,255,255,0.22)" />
                            {paths.map((p) => {
                                const v = p.values[hover]; const cy = yAt(v);
                                return <circle key={p.key} cx={hx} cy={cy} r={4} fill="#0b0b0e" stroke={p.color} strokeWidth={2} />;
                            })}
                        </g>
                    )}
                    <rect x={padL} y={padT} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
                </svg>
                {hover != null && (
                    <div className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-[12px] border border-white/10 bg-[#101015]/95 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                        style={{ left: Math.min(Math.max(hx + 16, 8), w - 170) }}>
                        <p className="mb-1.5 text-[11px] uppercase tracking-[0.16em] text-[#7f88a8]">{dayLabel(d[hover], true)}</p>
                        {paths.map((p) => (
                            <p key={p.key} className="flex items-center justify-between gap-4 text-[13px]">
                                <span className="flex items-center gap-2 text-white/70"><span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />{p.label}</span>
                                <span className="num font-medium text-white">{fmt(p.values[hover])}</span>
                            </p>
                        ))}
                    </div>
                )}
                <table className="sr-only">
                    <caption>{title}</caption>
                    <thead><tr><th>Day</th>{s.map((x) => <th key={x.key}>{x.label}</th>)}</tr></thead>
                    <tbody>{d.map((day, i) => <tr key={day}><th>{day}</th>{s.map((x) => <td key={x.key}>{x.values[i]}</td>)}</tr>)}</tbody>
                </table>
            </div>
        </section>
    );
}
