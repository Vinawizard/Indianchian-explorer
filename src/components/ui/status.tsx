import type { ReactNode } from "react";

type Tone = "positive" | "warning" | "negative" | "neutral" | "blue";
const CLS: Record<Tone, string> = { positive: "s-green", warning: "s-amber", negative: "s-red", neutral: "s-grey", blue: "s-blue" };

/** A lit dot and a word: status stays readable without a filled chip on every row. */
export function Status({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
    return <span className={`status ${CLS[tone]}`}>{children}</span>;
}
