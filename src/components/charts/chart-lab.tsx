"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { compact, dayLabel, niceMax, smoothPath, stepPath, type Pt } from "./paths";

/*
 * Chart options for the landing page, all on the same live data and the same colours, so they can
 * be compared side by side (route /lab/charts). The chosen one moves into TrendChart afterwards.
 */

export type Day = { day: string; farmer: number; agri_record: number; credit_app: number };
type S = { key: string; label: string; color: string; ink: string; values: number[] };

const BLUE = "#2d45ff", BLUE_FILL = "#0018fe", BLUE_INK = "#6b7aff", RED = "#ff2a2a", RED_INK = "#ff5c5c";
const H = 260, padL = 40, padR = 4, padT = 12, padB = 30;
const fmt = (n: number) => n.toLocaleString("en-US");

function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
    const ref = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(560);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
        ro.observe(el); return () => ro.disconnect();
    }, []);
    return [ref, w];
}

/** Plot frame shared by every option: dashed grid, y ticks, day labels, per-day hover columns and the tooltip. */
function Plot({ days, series, max, children, height = H }: {
    days: string[]; series: S[]; max: number; height?: number;
    children: (g: { w: number; iw: number; ih: number; slot: number; x: (i: number) => number; y: (v: number) => number; base: number; hover: number | null }) => ReactNode;
}) {
    const [ref, w] = useWidth();
    const [hover, setHover] = useState<number | null>(null);
    const iw = w - padL - padR, ih = height - padT - padB, base = padT + ih;
    const slot = iw / days.length;
    const x = (i: number) => padL + i * slot + slot / 2;
    const y = (v: number) => base - (v / max) * ih;
    const every = Math.max(1, Math.ceil(days.length / Math.max(3, Math.floor(iw / 78))));
    return (
        <div ref={ref} className="relative px-4 pb-6 sm:px-6">
            <svg width={w} height={height} className="block max-w-full overflow-visible" role="img" aria-label={`${series.map((s) => s.label).join(", ")} per day`}>
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                    <g key={f}>
                        <line x1={padL} x2={padL + iw} y1={y(f * max)} y2={y(f * max)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                        <text x={padL - 10} y={y(f * max) + 3.5} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.4)">{compact(f * max)}</text>
                    </g>
                ))}
                {days.map((d, i) => i % every === (days.length - 1) % every && (
                    <text key={d} x={x(i)} y={height - 8} textAnchor="middle" fontSize={10} letterSpacing="0.08em" fill="rgba(255,255,255,0.4)">{dayLabel(d).toUpperCase()}</text>
                ))}
                {children({ w, iw, ih, slot, x, y, base, hover })}
                {days.map((d, i) => (
                    <rect key={d} x={padL + i * slot} y={padT} width={slot} height={ih} fill="transparent"
                        onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover((h) => (h === i ? null : h))} />
                ))}
            </svg>
            {hover != null && (
                <div className="glass pointer-events-none absolute top-1 z-10 min-w-[168px] rounded-[8px] !border-white/20 !bg-black/80 p-4 text-[10px] uppercase tracking-[0.1em]"
                    style={{ left: Math.min(Math.max(x(hover) + 18, 8), w - 186) }}>
                    <p className="mb-2 border-b border-white/10 pb-2 text-white">{dayLabel(days[hover], true)}</p>
                    {series.map((s) => (
                        <p key={s.key} className="flex items-center justify-between gap-6 py-0.5">
                            <span className="text-muted">{s.label}:</span>
                            <span className="num text-[11px] font-bold" style={{ color: s.ink }}>{fmt(s.values[hover])}</span>
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Option card: same head as the landing cards, with the option's name and what it is good at. */
export function Option({ id, name, note, children }: { id: string; name: string; note: string; children: ReactNode }) {
    return (
        <section className="card" aria-label={`Option ${id}: ${name}`}>
            <div className="px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
                <p className="flex items-baseline gap-3"><span className="chip chip-blue">Option {id}</span><span className="section-title">{name}</span></p>
                <p className="card-sub !mt-3 normal-case tracking-[0.04em] text-[12px]">{note}</p>
            </div>
            {children}
        </section>
    );
}

/* ---------------- Network activity (one series: events per day) ---------------- */

export function ActivityLed({ days, values }: { days: string[]; values: number[] }) {
    const s: S[] = [{ key: "e", label: "Events", color: BLUE, ink: BLUE_INK, values }];
    const max = niceMax(Math.max(1, ...values));
    return (
        <Plot days={days} series={s} max={max}>
            {({ x, ih, base, slot, hover }) => {
                const cell = 4, dot = 3.2, rows = Math.floor(ih / cell);
                const across = Math.max(3, Math.floor((slot * 0.6) / cell));
                let on = "", off = "", hot = "";
                values.forEach((v, i) => {
                    const lit = Math.round((v / max) * rows);
                    const x0 = Math.round((x(i) - (across * cell) / 2) / cell) * cell;
                    for (let r = 0; r < rows; r++) for (let c = 0; c < across; c++) {
                        const sq = `M${x0 + c * cell} ${base - (r + 1) * cell}h${dot}v${dot}h-${dot}z`;
                        if (r < lit) { if (i === hover) hot += sq; else on += sq; } else off += sq;
                    }
                });
                return (
                    <g shapeRendering="crispEdges">
                        <path d={off} fill="rgba(255,255,255,0.045)" /><path d={on} fill={BLUE} /><path d={hot} fill={BLUE_INK} />
                    </g>
                );
            }}
        </Plot>
    );
}

export function ActivityBars({ days, values }: { days: string[]; values: number[] }) {
    const s: S[] = [{ key: "e", label: "Events", color: BLUE, ink: BLUE_INK, values }];
    const max = niceMax(Math.max(1, ...values));
    return (
        <Plot days={days} series={s} max={max}>
            {({ x, y, base, slot, hover }) => (
                <g>
                    <defs><linearGradient id="lab-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE_FILL} stopOpacity="0.6" /><stop offset="100%" stopColor={BLUE_FILL} stopOpacity="0.06" /></linearGradient></defs>
                    {values.map((v, i) => {
                        const bw = Math.max(6, slot * 0.5), top = y(v);
                        return (
                            <g key={i} opacity={hover == null || hover === i ? 1 : 0.55} style={{ transition: "opacity 160ms ease" }}>
                                <rect x={x(i) - bw / 2} y={top} width={bw} height={Math.max(0, base - top)} fill="url(#lab-bar)" />
                                {v > 0 && <rect x={x(i) - bw / 2} y={top} width={bw} height={2} fill={hover === i ? BLUE_INK : BLUE} />}
                            </g>
                        );
                    })}
                </g>
            )}
        </Plot>
    );
}

export function ActivityLine({ days, values }: { days: string[]; values: number[] }) {
    const s: S[] = [{ key: "e", label: "Events", color: BLUE, ink: BLUE_INK, values }];
    const max = niceMax(Math.max(1, ...values));
    return (
        <Plot days={days} series={s} max={max}>
            {({ x, y, base, hover }) => {
                const pts: Pt[] = values.map((v, i) => ({ x: x(i), y: y(v) }));
                const line = smoothPath(pts);
                return (
                    <g>
                        <defs><linearGradient id="lab-line" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE_FILL} stopOpacity="0.28" /><stop offset="100%" stopColor={BLUE_FILL} stopOpacity="0" /></linearGradient></defs>
                        <path d={`${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`} fill="url(#lab-line)" />
                        <path d={line} fill="none" stroke={BLUE} strokeWidth={2} strokeLinejoin="round" />
                        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 4} fill="#050508" stroke={hover === i ? BLUE_INK : BLUE} strokeWidth={2} />)}
                    </g>
                );
            }}
        </Plot>
    );
}

export function ActivityStep({ days, values }: { days: string[]; values: number[] }) {
    const s: S[] = [{ key: "e", label: "Events", color: BLUE, ink: BLUE_INK, values }];
    const max = niceMax(Math.max(1, ...values));
    return (
        <Plot days={days} series={s} max={max}>
            {({ y, base, slot, iw }) => {
                const pts: Pt[] = values.map((v, i) => ({ x: padL + i * slot, y: y(v) }));
                const line = stepPath(pts, padL + iw);
                return (
                    <g>
                        <defs><linearGradient id="lab-step" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE_FILL} stopOpacity="0.3" /><stop offset="95%" stopColor={BLUE_FILL} stopOpacity="0" /></linearGradient></defs>
                        <path d={`${line} L${padL + iw},${base} L${padL},${base} Z`} fill="url(#lab-step)" />
                        <path d={line} fill="none" stroke={BLUE} strokeWidth={2} />
                    </g>
                );
            }}
        </Plot>
    );
}

/* ---------------- Record distribution (three sectors per day) ---------------- */

const sectors = (d: Day[]): S[] => [
    { key: "farmer", label: "Farmer", color: "#ffffff", ink: "#ffffff", values: d.map((x) => x.farmer) },
    { key: "agri", label: "Agri", color: BLUE, ink: BLUE_INK, values: d.map((x) => x.agri_record) },
    { key: "credit", label: "Credit", color: RED, ink: RED_INK, values: d.map((x) => x.credit_app) },
];

/** Names the three sectors in text next to a short mark of their colour (identity never colour alone). */
function Key() {
    return (
        <p className="flex flex-wrap gap-x-6 gap-y-2 px-5 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/70 sm:px-8">
            {[["Farmer", "#ffffff"], ["Agri", BLUE], ["Credit", RED]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-2"><span aria-hidden className="h-[2px] w-4" style={{ background: c }} />{l}</span>
            ))}
        </p>
    );
}

export function DistStacked({ data }: { data: Day[] }) {
    const s = sectors(data), days = data.map((d) => d.day);
    const totals = data.map((d) => d.farmer + d.agri_record + d.credit_app);
    const max = niceMax(Math.max(1, ...totals));
    return (
        <>
            <Key />
            <Plot days={days} series={s} max={max}>
                {({ x, y, base, slot, hover }) => (
                    <g>
                        {data.map((d, i) => {
                            const bw = Math.max(6, slot * 0.5);
                            let top = base;
                            return (
                                <g key={i} opacity={hover == null || hover === i ? 1 : 0.5} style={{ transition: "opacity 160ms ease" }}>
                                    {s.map((ser) => {
                                        const v = ser.values[i]; if (!v) return null;
                                        const h = base - y(v), y0 = top - h;
                                        top = y0;
                                        return <rect key={ser.key} x={x(i) - bw / 2} y={y0 + 1} width={bw} height={Math.max(0, h - 2)} fill={ser.color} opacity={ser.key === "farmer" ? 0.85 : 1} />;
                                    })}
                                </g>
                            );
                        })}
                    </g>
                )}
            </Plot>
        </>
    );
}

export function DistLed({ data }: { data: Day[] }) {
    const s = sectors(data), days = data.map((d) => d.day);
    const totals = data.map((d) => d.farmer + d.agri_record + d.credit_app);
    const max = niceMax(Math.max(1, ...totals));
    return (
        <>
            <Key />
            <Plot days={days} series={s} max={max}>
                {({ x, ih, base, slot, hover }) => {
                    const cell = 4, dot = 3.2, rows = Math.floor(ih / cell);
                    const across = Math.max(3, Math.floor((slot * 0.6) / cell));
                    const paths: Record<string, string> = { off: "", farmer: "", agri: "", credit: "" };
                    data.forEach((d, i) => {
                        const x0 = Math.round((x(i) - (across * cell) / 2) / cell) * cell;
                        // cumulative rounding keeps the column height true to the total
                        const cum = [d.farmer, d.farmer + d.agri_record, d.farmer + d.agri_record + d.credit_app].map((v) => Math.round((v / max) * rows));
                        for (let r = 0; r < rows; r++) {
                            const k = r < cum[0] ? "farmer" : r < cum[1] ? "agri" : r < cum[2] ? "credit" : "off";
                            for (let c = 0; c < across; c++) paths[k] += `M${x0 + c * cell} ${base - (r + 1) * cell}h${dot}v${dot}h-${dot}z`;
                        }
                    });
                    return (
                        <g shapeRendering="crispEdges">
                            <path d={paths.off} fill="rgba(255,255,255,0.045)" />
                            <path d={paths.farmer} fill="#ffffff" fillOpacity={0.85} /><path d={paths.agri} fill={BLUE} /><path d={paths.credit} fill={RED} />
                            {hover != null && <rect x={x(hover) - (across * cell) / 2 - 4} y={base - rows * cell - 4} width={across * cell + 8} height={rows * cell + 6} fill="none" stroke="rgba(255,255,255,0.18)" />}
                        </g>
                    );
                }}
            </Plot>
        </>
    );
}

/** Small multiples: one row per sector on the same scale, each named at its left. */
export function DistRows({ data }: { data: Day[] }) {
    const s = sectors(data), days = data.map((d) => d.day);
    const max = niceMax(Math.max(1, ...s.flatMap((x) => x.values)));
    const [ref, w] = useWidth();
    const [hover, setHover] = useState<number | null>(null);
    const left = 92, iw = w - left - padR, rowH = 64, gap = 18, top = 8;
    const slot = iw / days.length, x = (i: number) => left + i * slot + slot / 2;
    const height = top + s.length * rowH + (s.length - 1) * gap + 30;
    const every = Math.max(1, Math.ceil(days.length / Math.max(3, Math.floor(iw / 78))));
    return (
        <div ref={ref} className="relative px-4 pb-6 sm:px-6">
            <svg width={w} height={height} className="block max-w-full" role="img" aria-label="Farmer, agri and credit events per day, one row each">
                {s.map((ser, k) => {
                    const y0 = top + k * (rowH + gap), base = y0 + rowH;
                    const pts: Pt[] = ser.values.map((v, i) => ({ x: x(i), y: base - (v / max) * rowH }));
                    const line = smoothPath(pts);
                    return (
                        <g key={ser.key}>
                            <text x={0} y={y0 + rowH / 2 + 4} fontSize={10} letterSpacing="0.16em" fill="rgba(255,255,255,0.7)">{ser.label.toUpperCase()}</text>
                            <line x1={left} x2={left + iw} y1={base} y2={base} stroke="rgba(255,255,255,0.08)" />
                            <path d={`${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`} fill={ser.key === "agri" ? BLUE_FILL : ser.color} fillOpacity={ser.key === "farmer" ? 0.1 : 0.22} />
                            <path d={line} fill="none" stroke={ser.color} strokeWidth={ser.key === "agri" ? 2 : 1.5} />
                        </g>
                    );
                })}
                {days.map((d, i) => i % every === (days.length - 1) % every && (
                    <text key={d} x={x(i)} y={height - 8} textAnchor="middle" fontSize={10} letterSpacing="0.08em" fill="rgba(255,255,255,0.4)">{dayLabel(d).toUpperCase()}</text>
                ))}
                {hover != null && <line x1={x(hover)} x2={x(hover)} y1={top} y2={height - 26} stroke="rgba(255,255,255,0.2)" />}
                {days.map((d, i) => <rect key={d} x={left + i * slot} y={0} width={slot} height={height - 26} fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover((h) => (h === i ? null : h))} />)}
            </svg>
            {hover != null && (
                <div className="glass pointer-events-none absolute top-1 z-10 min-w-[168px] rounded-[8px] !border-white/20 !bg-black/80 p-4 text-[10px] uppercase tracking-[0.1em]" style={{ left: Math.min(Math.max(x(hover) + 18, 8), w - 186) }}>
                    <p className="mb-2 border-b border-white/10 pb-2 text-white">{dayLabel(days[hover], true)}</p>
                    {s.map((ser) => <p key={ser.key} className="flex items-center justify-between gap-6 py-0.5"><span className="text-muted">{ser.label}:</span><span className="num text-[11px] font-bold" style={{ color: ser.ink }}>{fmt(ser.values[hover])}</span></p>)}
                </div>
            )}
        </div>
    );
}

export function DistAreas({ data }: { data: Day[] }) {
    const s = sectors(data), days = data.map((d) => d.day);
    const max = niceMax(Math.max(1, ...s.flatMap((x) => x.values)));
    return (
        <Plot days={days} series={s} max={max}>
            {({ x, y, base }) => (
                <g>
                    {s.map((ser) => {
                        const pts: Pt[] = ser.values.map((v, i) => ({ x: x(i), y: y(v) }));
                        const line = smoothPath(pts);
                        return (
                            <g key={ser.key}>
                                <path d={`${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`} fill={ser.key === "agri" ? BLUE_FILL : ser.color} fillOpacity={ser.key === "farmer" ? 0.08 : 0.18} />
                                <path d={line} fill="none" stroke={ser.color} strokeWidth={ser.key === "agri" ? 2 : 1.5} />
                            </g>
                        );
                    })}
                </g>
            )}
        </Plot>
    );
}
