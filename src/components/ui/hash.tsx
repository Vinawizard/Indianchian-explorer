import Link from "next/link";
import { CopyButton } from "./copy-button";
import { shortHash } from "@/lib/format";

/**
 * A hash or ID in mono. `full` prints it whole and lets it wrap (detail pages); otherwise it is
 * shortened in the middle with the whole value in the tooltip. Copy is always one click away.
 */
export function Hash({ value, href, external, full, copy = true, head, tail, className = "" }: {
    value: string | null | undefined; href?: string; external?: boolean; full?: boolean; copy?: boolean; head?: number; tail?: number; className?: string;
}) {
    if (!value) return <span className="text-faint">—</span>;
    const text = full ? value : shortHash(value, head, tail);
    const body = <span className={`mono ${full ? "break-all" : "whitespace-nowrap"}`} title={full ? undefined : value}>{text}</span>;
    return (
        <span className={`inline-flex items-center gap-1 min-w-0 ${className}`}>
            {href ? (
                external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="link min-w-0">{body}</a>
                ) : (
                    <Link href={href} className="link min-w-0">{body}</Link>
                )
            ) : (
                <span className="text-ink min-w-0">{body}</span>
            )}
            {copy && <CopyButton value={value} label="Copy to clipboard" />}
        </span>
    );
}
