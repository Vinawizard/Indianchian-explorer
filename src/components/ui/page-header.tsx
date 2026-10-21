import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/** The title row every screen opens with: breadcrumb, a noun title, one line that answers the screen's question. */
export function PageHeader({ crumbs, title, meta, actions }: { crumbs?: Crumb[]; title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="pt-8 pb-6">
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-faint">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        {crumbs.map((c, i) => (
                            <li key={i} className="flex items-center gap-1.5 min-w-0">
                                {i > 0 && <span aria-hidden className="text-control">/</span>}
                                {c.href ? (
                                    <Link href={c.href} className="hover:text-ink transition-colors">{c.label}</Link>
                                ) : (
                                    <span className="text-muted truncate" aria-current="page">{c.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-[-0.015em] text-ink break-words">{title}</h1>
                    {meta && <div className="mt-1.5 text-[14px] text-muted">{meta}</div>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
