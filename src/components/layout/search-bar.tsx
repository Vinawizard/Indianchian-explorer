"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

/**
 * One global lookup on every page. Accepts a block number, a block or transaction hash,
 * a record ID (with or without its version), a farmer ID or a Cardano transaction hash.
 */
export function SearchBar({ className = "", autoFocus, large }: { className?: string; autoFocus?: boolean; large?: boolean }) {
    const router = useRouter();
    const ref = useRef<HTMLInputElement>(null);
    const [q, setQ] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (e.key === "/" && !(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))) {
                e.preventDefault();
                ref.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const query = q.trim();
        if (!query || busy) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/chain/search?q=${encodeURIComponent(query)}`);
            const data = await res.json().catch(() => null);
            if (res.ok && data?.status === "ok" && typeof data.result === "string") {
                setQ("");
                router.push(data.result);
            } else {
                setError(res.status === 404 ? "No match found." : "Search is unavailable. Try again.");
            }
        } catch {
            setError("Search is unavailable. Try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form role="search" onSubmit={submit} className={`relative ${className}`}>
            <label htmlFor={autoFocus ? "search-m" : "search"} className="sr-only">Search blocks, records, farmers and transactions</label>
            <Search aria-hidden className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint ${large ? "left-4 h-5 w-5 text-white/60" : "left-3.5 h-4 w-4"}`} />
            <input
                id={autoFocus ? "search-m" : "search"}
                ref={ref}
                value={q}
                onChange={(e) => { setQ(e.target.value); if (error) setError(null); }}
                autoFocus={autoFocus}
                autoComplete="off"
                spellCheck={false}
                placeholder="Block, hash, record or farmer ID"
                aria-invalid={!!error}
                aria-describedby={error ? "search-error" : undefined}
                className={`field pl-10 pr-10 tracking-wide ${large ? "!h-14 bg-black/60 !pl-12 text-[15px] backdrop-blur-sm" : "bg-white/[0.03]"}`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-faint" /> : <kbd className="hidden h-5 items-center border border-line px-1.5 text-[11px] text-faint sm:inline-flex">/</kbd>}
            </span>
            {error && (
                <p id="search-error" role="alert" className="absolute left-0 right-0 top-full z-50 mt-1 border border-line bg-[#0e0e0e] px-3 py-2.5 text-[13px] text-muted shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
                    {error}
                </p>
            )}
        </form>
    );
}
