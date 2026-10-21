import type { ReactNode } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Tone = "positive" | "warning" | "negative" | "neutral" | "blue";

/** The original explorer's status badge: an outlined chip, Trivolve blue when done, quiet while waiting. */
export function Status({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
    if (tone === "positive" || tone === "blue") return <span className="chip chip-blue"><CheckCircle2 aria-hidden />{children}</span>;
    if (tone === "negative") return <span className="chip chip-red"><XCircle aria-hidden />{children}</span>;
    return <span className="chip"><Clock aria-hidden />{children}</span>;
}
