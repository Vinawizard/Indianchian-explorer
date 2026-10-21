import type { ReactNode } from "react";

/** An empty or error block keeps its frame and says what to do next. */
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="px-6 py-14 text-center">
            <p className="text-[15px] font-medium text-ink">{title}</p>
            {children && <div className="mx-auto mt-1.5 max-w-[52ch] text-[14px] text-muted">{children}</div>}
            {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
        </div>
    );
}
