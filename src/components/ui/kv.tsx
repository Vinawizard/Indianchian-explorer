import type { ReactNode } from "react";

/** Label / value rows inside a card: tracked uppercase label, value in full. */
export function KV({ rows }: { rows: { label: string; value: ReactNode }[] }) {
    return (
        <dl>
            {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-1 gap-1.5 border-b border-white/[0.045] px-6 py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.025] md:min-h-[56px] md:grid-cols-[168px_1fr] md:items-center md:gap-6 md:py-0">
                    <dt className="label">{r.label}</dt>
                    <dd className="min-w-0 text-[14px] text-white/92">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}
