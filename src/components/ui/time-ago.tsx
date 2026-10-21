"use client";
import { useEffect, useState } from "react";
import { ago, utc } from "@/lib/format";

/** Relative time that keeps itself current; the absolute UTC time is in the tooltip. */
export function TimeAgo({ iso, className = "" }: { iso: string | null | undefined; className?: string }) {
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        setNow(Date.now());
        const t = setInterval(() => setNow(Date.now()), 10_000);
        return () => clearInterval(t);
    }, []);
    if (!iso) return <span className="text-faint">—</span>;
    return (
        <time dateTime={iso} title={utc(iso)} className={`whitespace-nowrap ${className}`}>
            {now == null ? utc(iso).replace(" UTC", "") : ago(iso, now)}
        </time>
    );
}
