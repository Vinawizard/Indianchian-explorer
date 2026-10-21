import type { ReactNode } from "react";
import { Check } from "lucide-react";

type Tone = "positive" | "warning" | "negative" | "neutral" | "blue";
const CLS: Record<Tone, string> = { positive: "chip-green", warning: "chip-amber", negative: "chip-red", neutral: "chip-grey", blue: "chip-blue" };

/** The original bordered status chip. */
export function Status({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
    return (
        <span className={`chip ${CLS[tone]}`}>
            {tone === "positive" && <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />}
            {children}
        </span>
    );
}
