"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
    const [done, setDone] = useState(false);
    return (
        <button
            type="button"
            onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* clipboard blocked */ }
            }}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-faint hover:text-ink transition-colors"
            aria-label={done ? "Copied" : label}
            title={done ? "Copied" : label}
        >
            {done ? <Check className="h-3.5 w-3.5 text-positive" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            <span className="sr-only" aria-live="polite">{done ? "Copied" : ""}</span>
        </button>
    );
}
