import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb, an uppercase title, an optional status line and actions, as in the original pages. */
export function PageHeader({ crumbs, title, meta, actions }: { crumbs?: Crumb[]; title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="pt-10 pb-8">
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-5">
                    <ol className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
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
                    <h1 className="heading break-words text-3xl sm:text-4xl">{title}</h1>
                    {meta && <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-muted">{meta}</div>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
