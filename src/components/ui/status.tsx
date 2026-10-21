import type { ReactNode } from "react";

type Tone = "positive" | "warning" | "negative" | "neutral";
const TONE: Record<Tone, string> = {
    positive: "bg-positive-bg text-positive",
    warning: "bg-warning-bg text-warning",
    negative: "bg-negative-bg text-negative",
    neutral: "bg-raised text-muted",
};

/** A status mark inside a row: a pale tint of the hue with text of the same hue. */
export function Status({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
    return (
        <span className={`inline-flex h-[22px] items-center gap-1.5 px-2 text-[12px] font-medium whitespace-nowrap ${TONE[tone]}`}>
            <span aria-hidden className="h-1.5 w-1.5 bg-current" />
            {children}
        </span>
    );
}
