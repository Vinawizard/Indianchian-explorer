"use client";
import { useState } from "react";
import { DOTO } from "./doto-glyphs";

const NARROW = new Set([",", ".", "-"]);

function cols(ch: string): number[] {
    const rows = (DOTO[ch] ?? DOTO["-"]).split("/");
    const all = [0, 1, 2, 3, 4];
    if (!NARROW.has(ch)) return all;
    const lit = all.filter((c) => rows.some((r) => r[c] === "#"));
    return lit.length ? all.slice(lit[0], lit[lit.length - 1] + 1) : [0];
}

/** One character as dot columns; `phase` drops the columns in from above or out below, one after another. */
function Glyph({ ch, cell, dot, h, phase, delay = 0, sweepFrom }: { ch: string; cell: number; dot: number; h: number; phase?: "in" | "out"; delay?: number; sweepFrom?: number }) {
    const rows = (DOTO[ch] ?? DOTO["-"]).split("/");
    const cs = cols(ch);
    const w = (cs.length - 1) * cell + dot;
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" fill="currentColor" className="absolute inset-0 overflow-hidden"
            style={{ ["--fall" as string]: `${h}px` }}>
            {cs.map((c, ci) => (
                <g key={c} className={phase ? `dot-${phase}` : undefined}
                    style={{
                        ...(phase ? { animationDelay: `${delay + ci * 22}ms` } : {}),
                        // colour changes sweep across the figure one dot column at a time
                        ...(sweepFrom != null ? { transition: "color 220ms ease", transitionDelay: `${(sweepFrom + ci) * 16}ms` } : {}),
                    }}>
                    {rows.map((r, ry) => (r[c] === "#" ? <rect key={ry} x={ci * cell} y={ry * cell} width={dot} height={dot} /> : null))}
                </g>
            ))}
        </svg>
    );
}

/**
 * A figure in the dot matrix that animates when it changes: in each digit that changed, the old
 * dots fall out below and the new ones drop in from above, column by column (22 ms apart), the
 * changed digits rippling left to right. Same 4px grid and widths as DotText, so it sits exactly
 * where the still figure did. Nothing moves on the first render; reduced motion swaps instantly.
 */
/** `sweep`: when the colour changes (say on hover) it travels left to right, one dot column at a time. */
export function DotCounter({ value, cell = 4, className = "", sweep }: { value: string; cell?: 4; className?: string; sweep?: boolean }) {
    const [cur, setCur] = useState(value);
    const [prev, setPrev] = useState<string | null>(null);
    const [gen, setGen] = useState(0);
    if (value !== cur) { setPrev(cur); setCur(value); setGen((g) => g + 1); }   // derived from props, no effect

    const dot = +(cell * 0.8).toFixed(2);
    const h = 7 * cell + dot;                     // 7 rows plus the comma's row below the baseline
    const len = Math.max(cur.length, prev?.length ?? 0);
    const now = cur.padStart(len, " "), was = (prev ?? cur).padStart(len, " ");
    let wave = 0, column = 0;
    return (
        <span role="img" aria-label={value} className={`inline-flex items-start ${className}`} style={{ gap: 2 * cell - dot }}>
            {[...now].map((ch, i) => {
                if (ch === " " && was[i] === " ") return null;
                const w = ((ch === " " ? cols(was[i]) : cols(ch)).length - 1) * cell + dot;
                const changed = prev != null && was[i] !== ch;
                const delay = changed ? wave++ * 40 : 0;
                const from = column; column += cols(ch === " " ? was[i] : ch).length;
                return (
                    <span key={i} aria-hidden className="relative block overflow-hidden" style={{ width: w, height: h }}>
                        {changed && was[i] !== " " && <Glyph key={`o${gen}`} ch={was[i]} cell={cell} dot={dot} h={h} phase="out" delay={delay} sweepFrom={sweep ? from : undefined} />}
                        {ch !== " " && <Glyph key={changed ? `n${gen}` : "s"} ch={ch} cell={cell} dot={dot} h={h} phase={changed ? "in" : undefined} delay={delay} sweepFrom={sweep ? from : undefined} />}
                    </span>
                );
            })}
        </span>
    );
}
