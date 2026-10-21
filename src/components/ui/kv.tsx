import type { ReactNode } from "react";

/** Label / value rows inside a card: tracked uppercase label, value in full. */
export function KV({ rows }: { rows: { label: string; value: ReactNode }[] }) {
    return (
        <dl>
            {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-1 gap-1.5 border-b border-rule px-6 py-4 last:border-b-0 transition-colors hover:bg-white/[0.02] md:grid-cols-[168px_1fr] md:items-center md:gap-6 md:py-0 md:min-h-[60px]">
                    <dt className="label">{r.label}</dt>
                    <dd className="min-w-0 text-[14px] text-white/90">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}
