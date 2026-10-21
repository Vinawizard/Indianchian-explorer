"use client";
import { useSyncExternalStore } from "react";
import { ago, utc } from "@/lib/format";

// One shared clock for every relative time on the page, so rows are always measured from the same
// instant (a fresh row and an older one can no longer disagree). Ticks each second while shown.
let now = 0;
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
    subs.add(cb);
    if (!timer) { now = Date.now(); timer = setInterval(() => { now = Date.now(); subs.forEach((f) => f()); }, 1000); }
    return () => { subs.delete(cb); if (!subs.size && timer) { clearInterval(timer); timer = undefined; } };
}

/** Relative time that keeps itself current; the absolute UTC time is in the tooltip. */
export function TimeAgo({ iso, className = "" }: { iso: string | null | undefined; className?: string }) {
    const t = useSyncExternalStore(subscribe, () => now, () => 0);   // 0 on the server: absolute time until hydrated
    if (!iso) return <span className="text-faint">—</span>;
    return (
        <time dateTime={iso} title={utc(iso)} className={`whitespace-nowrap ${className}`}>
            {t === 0 ? utc(iso).replace(" UTC", "") : ago(iso, t)}
        </time>
    );
}
