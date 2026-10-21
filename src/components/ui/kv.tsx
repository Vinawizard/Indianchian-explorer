import type { ReactNode } from "react";

/** Label / value rows inside a card, as in the original expanded panel: tracked label, value in full. */
export function KV({ rows }: { rows: { label: string; value: ReactNode }[] }) {
    return (
        <dl>
            {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-1 gap-1.5 border-b border-white/[0.05] px-5 py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-[rgba(0,24,254,0.05)] sm:px-8 md:min-h-[56px] md:grid-cols-[200px_1fr] md:items-center md:gap-6 md:py-0">
                    <dt className="label">{r.label}</dt>
                    <dd className="min-w-0 text-[12px] text-white/85">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}
