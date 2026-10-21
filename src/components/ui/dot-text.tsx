import { DOTO } from "./doto-glyphs";

const NARROW = new Set([",", ".", "-"]);   // trimmed to their lit columns, so separators sit tight
const SPACE = 3;                           // cells; with the previous glyph's gap a word space is 4

/**
 * Text drawn in Doto's dot matrix as exact squares on a cell grid. A 4px cell is a whole number of
 * device pixels at 100%, 125%, 150% and 200% zoom, so every dot lands the same (the font itself
 * at most sizes does not). Digits keep their full width, so figures do not shift as they change.
 */
export function DotText({ text, cell = 4, className = "", label, descender }: {
    text: string; cell?: 4 | 5 | 8; className?: string; label?: string; descender?: boolean;
}) {
    const dot = +(cell * 0.8).toFixed(2);
    const d: string[] = [];
    let x = 0;
    for (const ch of text.toUpperCase()) {
        if (ch === " ") { x += SPACE; continue; }
        const rows = (DOTO[ch] ?? DOTO["-"]).split("/");
        let c0 = 0, c1 = 4;
        if (NARROW.has(ch)) {
            const lit = [0, 1, 2, 3, 4].filter((c) => rows.some((r) => r[c] === "#"));
            c0 = lit[0] ?? 0; c1 = lit[lit.length - 1] ?? 0;
        }
        rows.forEach((r, ry) => {
            for (let c = c0; c <= c1; c++) if (r[c] === "#") d.push(`M${(x + c - c0) * cell} ${ry * cell}h${dot}v${dot}h-${dot}z`);
        });
        x += c1 - c0 + 2;   // the glyph's columns plus one gap
    }
    const rowsUsed = (descender ?? /,/.test(text)) ? 8 : 7;
    const w = Math.max(0, (x - 2) * cell + dot), h = (rowsUsed - 1) * cell + dot;
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" fill="currentColor"
            className={`block ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
            <path d={d.join("")} />
        </svg>
    );
}
