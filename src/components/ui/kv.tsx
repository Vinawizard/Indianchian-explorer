import type { ReactNode } from "react";

/** Label / value rows for a detail page. Labels are sentence case and readable; values carry the data. */
export function KV({ rows }: { rows: { label: string; value: ReactNode; hint?: string }[] }) {
    return (
        <dl className="divide-y divide-[var(--rule)]">
            {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-6 sm:py-0 sm:min-h-[48px] sm:items-center">
                    <dt className="text-[13px] text-faint">
                        {r.label}
                        {r.hint && <span className="block text-[12px] text-faint/80">{r.hint}</span>}
                    </dt>
                    <dd className="min-w-0 text-[14px] text-ink">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}
