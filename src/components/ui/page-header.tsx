import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb, an uppercase title, an optional status line and actions, as in the original pages. */
export function PageHeader({ crumbs, title, meta, actions }: { crumbs?: Crumb[]; title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="pb-7 pt-9">
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-5">
                    <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                        {crumbs.map((c, i) => (
                            <li key={i} className="flex min-w-0 items-center gap-2">
                                {i > 0 && <span aria-hidden className="text-white/20">/</span>}
                                {c.href ? <Link href={c.href} className="transition-colors hover:text-white">{c.label}</Link>
                                    : <span aria-current="page" className="truncate text-white">{c.label}</span>}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="t-title break-words text-white">{title}</h1>
                    {meta && <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[13px] text-white/60">{meta}</div>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
