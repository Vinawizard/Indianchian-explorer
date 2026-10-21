import type { ReactNode } from "react";

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="px-6 py-20 text-center">
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{title}</p>
            {children && <div className="mx-auto mt-2 max-w-[48ch] text-[12px] text-muted">{children}</div>}
            {action && <div className="mt-6 flex justify-center gap-2">{action}</div>}
        </div>
    );
}
