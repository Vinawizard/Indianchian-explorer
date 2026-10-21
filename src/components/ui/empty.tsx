import type { ReactNode } from "react";

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="px-6 py-16 text-center">
            <p className="heading text-sm tracking-[0.12em]">{title}</p>
            {children && <div className="mx-auto mt-2 max-w-[48ch] text-[13px] text-faint">{children}</div>}
            {action && <div className="mt-6 flex justify-center gap-2">{action}</div>}
        </div>
    );
}
