import { fmtInt } from "@/lib/format";

export type BarPoint = { label: string; title: string; value: number; current?: boolean };

/** Round axis maximum above the data: 1, 2, 2.5, 5 x 10^n. */
function niceMax(v: number): number {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
}
const compact = (n: number) => (n >= 1000 ? `${n % 1000 === 0 ? n / 1000 : (n / 1000).toFixed(1)}k` : String(n));

/**
 * One series, one hue: bars in the brand blue, four faint gridlines with round ticks, dates on
 * the axis, the exact value in each bar's tooltip and in a visually hidden table for screen readers.
 * A bar marked `current` (today, still filling) is drawn as an outline.
 */
export function BarChart({ data, height = 200, width = 720, unit }: { data: BarPoint[]; height?: number; width?: number; unit: string }) {
    const W = width, H = height, padL = 44, padR = 8, padT = 8, padB = 26;
    const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
    const iw = W - padL - padR, ih = H - padT - padB;
    const slot = data.length ? iw / data.length : iw;
    const bw = Math.max(4, Math.min(28, slot * 0.62));
    const y = (v: number) => padT + ih - (v / max) * ih;
    const every = data.length > 16 ? 3 : data.length > 9 ? 2 : 1;

    return (
        <figure className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${unit} per day`}>
                {ticks.map((t, i) => (
                    <g key={i}>
                        <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#232327" strokeWidth={1} strokeDasharray={i === 0 ? undefined : "2 4"} />
                        <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#8d8d93" className="num">{compact(t)}</text>
                    </g>
                ))}
                {data.map((d, i) => {
                    const x = padL + slot * i + (slot - bw) / 2;
                    const h = Math.max(d.value > 0 ? 1 : 0, (d.value / max) * ih);
                    return (
                        <g key={d.label}>
                            <rect x={x} y={padT + ih - h} width={bw} height={h}
                                fill={d.current ? "transparent" : "var(--accent)"} stroke={d.current ? "var(--accent)" : "none"} strokeWidth={d.current ? 1 : 0}>
                                <title>{`${d.title}: ${fmtInt(d.value)} ${unit}${d.current ? " (today so far)" : ""}`}</title>
                            </rect>
                            {i % every === 0 && (
                                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#8d8d93">{d.label}</text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <table className="sr-only">
                <caption>{unit} per day</caption>
                <tbody>{data.map((d) => <tr key={d.label}><th>{d.title}</th><td>{d.value}</td></tr>)}</tbody>
            </table>
        </figure>
    );
}
