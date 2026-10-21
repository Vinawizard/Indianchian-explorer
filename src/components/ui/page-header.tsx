import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { DotNum } from "./dot-num";

export type Crumb = { label: string; href?: string };

/** The original page head: tracked breadcrumb, the big uppercase title, figures on the right. */
export function PageHeader({ crumbs, title, meta, actions }: { crumbs?: Crumb[]; title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="pb-10 pt-12">
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-muted">
                        {crumbs.map((c, i) => (
                            <li key={i} className="flex min-w-0 items-center gap-2">
                                {i > 0 && <span aria-hidden className="opacity-40">/</span>}
                                {c.href ? <Link href={c.href} className="transition-colors hover:text-white">{c.label}</Link>
                                    : <span aria-current="page" className="truncate text-white">{c.label}</span>}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="t-title break-words text-white">{title}</h1>
                    {meta && <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-white/60">{meta}</div>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}

/** The original "Network activity" box: a tracked label and dot-matrix figures with small blue units. */
export function StatBox({ label, items }: { label: string; items: { value: string; unit: string }[] }) {
    return (
        <div className="glass rounded-[12px] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</p>
            <div className="mt-2.5 flex items-center gap-4">
                {items.map((it, i) => (
                    <Fragment key={it.unit}>
                        {i > 0 && <span aria-hidden className="h-4 w-px bg-white/15" />}
                        <span className="inline-flex items-baseline gap-2"><DotNum value={it.value} className="fig-sm" /><span className="text-[10px] uppercase tracking-[0.05em] text-blue-text">{it.unit}</span></span>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
