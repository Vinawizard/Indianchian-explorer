/** Client-safe formatting helpers shared by every screen. */

export const fmtInt = (n: number | null | undefined) =>
    n == null || !Number.isFinite(Number(n)) ? "—" : Math.round(Number(n)).toLocaleString("en-US");

export function fmtPct(part: number, whole: number, digits = 2): string {
    if (!(whole > 0)) return "—";
    const p = (part / whole) * 100;
    const cap = 100 - Math.pow(10, -digits);
    if (part < whole && p > cap) return `over ${cap.toFixed(digits)}%`;   // never print 100% while some are missing
    return `${p.toFixed(digits)}%`;
}

/** 0x2f25b05b…cf053313: keeps the start and the end, which is how people compare hashes. */
export function shortHash(h: string | null | undefined, head = 10, tail = 8): string {
    if (!h) return "—";
    return h.length <= head + tail + 1 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortId(id: string | null | undefined): string {
    if (!id) return "—";
    return id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export const RECORD_TYPE_LABEL: Record<string, string> = {
    farmer: "Farmer",
    agri_record: "Agricultural record",
    credit_app: "Credit application",
    generic_record: "Generic record",
};
export const RECORD_TYPE_SHORT: Record<string, string> = {
    farmer: "Farmer",
    agri_record: "Agri record",
    credit_app: "Credit app",
    generic_record: "Generic",
};
export const recordTypeLabel = (t: string | null | undefined) => (t ? RECORD_TYPE_LABEL[t] ?? t.replace(/_/g, " ") : "—");
export const recordTypeShort = (t: string | null | undefined) => (t ? RECORD_TYPE_SHORT[t] ?? t.replace(/_/g, " ") : "—");

/** "4 min ago" from an ISO date and a reference time (ms). */
export function ago(iso: string | null | undefined, now: number = Date.now()): string {
    if (!iso) return "—";
    const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s} s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h} h ago`;
    return `${Math.floor(h / 24)} days ago`;
}

/** 21 Oct 2026, 11:42:07 UTC: one absolute format everywhere. */
export function utc(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    const time = d.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
    return `${date}, ${time} UTC`;
}

/** The explorer's address for one record version. */
export const recordHref = (recordId: string, version?: number | null) =>
    version == null ? `/record/${recordId}` : `/record/${recordId}_${version}`;
