"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { compact, dayLabel, niceMax, smoothPath, stepPath, type Pt } from "./paths";

/** `tint` colours the area (defaults to the line colour), `ink` the figure in the tooltip. */
export type Series = { key: string; label: string; color: string; values: number[]; width?: number; fill?: number; tint?: string; ink?: string };
type Range = "7" | "14" | "30";
const RANGES: { value: Range; label: string }[] = [{ value: "7", label: "1W" }, { value: "14", label: "2W" }, { value: "30", label: "1M" }];
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * The original explorer's chart card: plain uppercase title, tracked subtitle, the range switch,
 * dashed grid, gradient areas in the original colours. No legend and no printed totals: the
 * figures come up when the pointer (or a keyboard focus) is on a day, in the original tooltip.
 */
export function TrendChart({ title, subtitle, days, series, mode }: {
    title: string; subtitle: string; days: string[]; series: Series[]; mode: "step" | "smooth";
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

    const H = 300, padL = 40, padR = 4, padT = 10, padB = 34;
    const iw = w - padL - padR, ih = H - padT - padB;
    const max = niceMax(Math.max(1, ...s.flatMap((x) => x.values)));
    const slot = mode === "step" ? iw / Math.max(1, d.length) : iw / Math.max(1, d.length - 1);
    const xAt = (i: number) => padL + i * slot;
    const yAt = (v: number) => padT + ih - (v / max) * ih;
    const base = padT + ih;
    const every = Math.max(1, Math.ceil(d.length / Math.max(3, Math.floor(iw / 78))));
    const mid = (i: number) => xAt(i) + (mode === "step" ? slot / 2 : 0);

    const paths = s.map((x) => {
        const pts: Pt[] = x.values.map((v, i) => ({ x: +xAt(i).toFixed(1), y: +yAt(v).toFixed(1) }));
        const line = mode === "step" ? stepPath(pts, padL + iw) : smoothPath(pts);
        const lastX = mode === "step" ? padL + iw : pts[pts.length - 1]?.x ?? padL;
        const area = pts.length ? `${line} L${lastX},${base} L${pts[0].x},${base} Z` : "";
        return { ...x, line, area };
    });
    const hx = hover == null ? 0 : mid(hover);

    const onMove = (e: React.PointerEvent<SVGRectElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const rel = ((e.clientX - r.left) / r.width) * iw;
        const i = mode === "step" ? Math.floor(rel / slot) : Math.round(rel / slot);
        setHover(Math.max(0, Math.min(d.length - 1, i)));
    };
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        setHover((h) => Math.max(0, Math.min(d.length - 1, (h ?? d.length - 1) + (e.key === "ArrowLeft" ? -1 : 1))));
    };

    return (
        <section className="card flex h-full flex-col" aria-label={title}>
            <div className="flex flex-col items-start gap-4 px-5 py-6 sm:flex-row sm:justify-between sm:px-8 sm:py-8">
                <div className="min-w-0">
                    <h2 className="section-title">{title}</h2>
                    <p className="card-sub">{subtitle}</p>
                </div>
                <Segmented label={`${title} range`} size="sm" value={range} onChange={setRange} options={RANGES} />
            </div>
            <div ref={box} className="relative flex-1 px-4 pb-6 sm:px-6"
                role="group" tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} aria-label={`${title}: use the arrow keys to read each day`}>
                <svg width={w} height={H} className="block max-w-full overflow-visible" role="img" aria-label={`${title}, last ${n} days`}>
                    <defs>
                        {paths.map((p) => (
                            <linearGradient key={p.key} id={`${uid}-${p.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={p.tint ?? p.color} stopOpacity={p.fill ?? 0.24} />
                                <stop offset="95%" stopColor={p.tint ?? p.color} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                        <g key={f}>
                            <line x1={padL} x2={padL + iw} y1={yAt(f * max)} y2={yAt(f * max)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                            <text x={padL - 10} y={yAt(f * max) + 3.5} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.4)" style={{ fontVariantNumeric: "tabular-nums" }}>{compact(f * max)}</text>
                        </g>
                    ))}
                    {d.map((day, i) => i % every === (d.length - 1) % every && (
                        <g key={day}>
                            <line x1={mid(i)} x2={mid(i)} y1={padT} y2={base} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                            <text x={mid(i)} y={H - 8} textAnchor={mode === "smooth" && i === d.length - 1 ? "end" : mode === "smooth" && i === 0 ? "start" : "middle"}
                                fontSize={10} letterSpacing="0.08em" fill="rgba(255,255,255,0.4)">{dayLabel(day).toUpperCase()}</text>
                        </g>
                    ))}
                    {paths.map((p) => (
                        <g key={`${p.key}-${range}`} style={{ opacity: hover == null ? 0.85 : 1, transition: "opacity 200ms ease" }}>
                            <path d={p.area} fill={`url(#${uid}-${p.key})`} className="chart-area" />
                            <path d={p.line} fill="none" stroke={p.color} strokeWidth={p.width ?? 1.5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-line" />
                        </g>
                    ))}
                    {hover != null && <line x1={hx} x2={hx} y1={padT} y2={base} stroke="rgba(255,255,255,0.2)" pointerEvents="none" />}
                    <rect x={padL} y={padT} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
                </svg>
                {hover != null && (
                    <div className="glass pointer-events-none absolute top-1 z-10 min-w-[168px] rounded-[8px] !border-white/20 !bg-black/80 p-4 text-[10px] uppercase tracking-[0.1em] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)]"
                        style={{ left: Math.min(Math.max(hx + 18, 8), w - 186) }}>
                        <p className="mb-2 border-b border-white/10 pb-2 text-white">{dayLabel(d[hover], true)}</p>
                        {paths.map((p) => (
                            <p key={p.key} className="flex items-center justify-between gap-6 py-0.5">
                                <span className="text-muted">{p.label}:</span>
                                <span className="num text-[11px] font-bold" style={{ color: p.ink ?? p.color }}>{fmt(p.values[hover])}</span>
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
