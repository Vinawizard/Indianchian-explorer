/** Path builders for the explorer's charts (no chart library). */
export type Pt = { x: number; y: number };

/** Step-after line: holds each value until the next point (the original explorer's look). */
export function stepPath(pts: Pt[], end?: number): string {
    if (!pts.length) return "";
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` H${pts[i].x} V${pts[i].y}`;
    if (end != null) d += ` H${end}`;
    return d;
}

/** Monotone cubic (Fritsch-Carlson): smooth, never overshoots below zero or above the data. */
export function smoothPath(pts: Pt[]): string {
    const n = pts.length;
    if (n < 2) return n ? `M${pts[0].x},${pts[0].y}` : "";
    const dx: number[] = [], dy: number[] = [], m: number[] = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1].x - pts[i].x; dy[i] = pts[i + 1].y - pts[i].y; m[i] = dy[i] / dx[i]; }
    const t: number[] = [m[0]];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    t[n - 1] = m[n - 2];
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i] / 3;
        d += ` C${pts[i].x + h},${pts[i].y + h * t[i]} ${pts[i + 1].x - h},${pts[i + 1].y - h * t[i + 1]} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
}

export const niceMax = (v: number) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= v) return k * p;
    return 10 * p;
};
export const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(Math.round(n)));
export const dayLabel = (d: string, long = false) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } : { day: "2-digit", month: "short", timeZone: "UTC" });
