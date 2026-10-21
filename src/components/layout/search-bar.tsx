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
        <form role="search" onSubmit={submit} className={`relative ${large ? "glass-rim rounded-[14px]" : ""} ${className}`}>
            <label htmlFor={autoFocus ? "search-m" : "search"} className="sr-only">Search blocks, records, farmers and transactions</label>
            <Search aria-hidden className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-white/45 ${large ? "left-4 h-5 w-5 text-white/60" : "left-3.5 h-4 w-4"}`} />
            <input
                id={autoFocus ? "search-m" : "search"}
                ref={ref}
                value={q}
                onChange={(e) => { setQ(e.target.value); if (error) setError(null); }}
                autoFocus={autoFocus}
                autoComplete="off"
                spellCheck={false}
                placeholder="Search block, hash or ID"
                aria-invalid={!!error}
                aria-describedby={error ? "search-error" : undefined}
                className={`field pl-10 pr-10 ${large ? "!h-[52px] !rounded-[14px] !bg-white/[0.07] !pl-12 text-[15px]" : "!h-[38px]"}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2">
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-faint" /> : <kbd className="hidden h-5 min-w-5 items-center justify-center rounded-[5px] border border-white/15 bg-white/5 px-1.5 text-[11px] text-white/55 sm:inline-flex">/</kbd>}
            </span>
            {error && (
                <p id="search-error" role="alert" className="glass absolute left-0 right-0 top-full z-50 mt-2 rounded-[12px] px-4 py-3 text-[13px] text-white/80">
                    {error}
                </p>
            )}
        </form>
    );
}
