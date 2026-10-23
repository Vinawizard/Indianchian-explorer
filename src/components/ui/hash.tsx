import Link from "next/link";
import { CopyButton } from "./copy-button";
import { shortHash } from "@/lib/format";

/**
 * A hash or ID, small and tabular as in the original. `full` prints it whole and lets it wrap (detail pages); otherwise it is
 * shortened in the middle with the whole value in the tooltip. Copy is always one click away.
 */
export function Hash({ value, href, external, full, copy = true, head, tail, className = "", red }: {
    value: string | null | undefined; href?: string; external?: boolean; full?: boolean; copy?: boolean; head?: number; tail?: number; className?: string;
    red?: boolean;   // a Cardano hash: red at rest (red means Cardano)
}) {
    if (!value) return <span className="text-faint">—</span>;
    const text = full ? value : shortHash(value, head, tail);
    const body = <span className={`mono ${full ? "break-all" : "whitespace-nowrap"}`} title={full ? undefined : value}>{text}</span>;
    return (
        <span className={`inline-flex items-center gap-1 min-w-0 ${className}`}>
            {href ? (
                external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={`${red ? "link-red" : "link"} min-w-0`}>{body}</a>
                ) : (
                    <Link href={href} className={`${red ? "link-red" : "link"} min-w-0`}>{body}</Link>
                )
            ) : (
                <span className="min-w-0 text-white/85">{body}</span>
            )}
            {copy && <CopyButton value={value} label="Copy to clipboard" />}
        </span>
    );
}
