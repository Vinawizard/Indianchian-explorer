"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSearch } from "@/components/providers/search-provider";

export function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { query: contextQuery, setQuery: setContextQuery, clearQuery } = useSearch();
    const [isFocused, setIsFocused] = useState(false);
    const [localQuery, setLocalQuery] = useState("");
    const [isNavigating, setIsNavigating] = useState(false);
    const [navError, setNavError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if we're on a page that uses inline search
    const isHomePage = pathname === "/";
    const isEventsPage = pathname === "/events";
    const isInlineSearch = isHomePage || isEventsPage;

    // Sync local input with context when navigating between pages
    useEffect(() => {
        if (isInlineSearch) {
            setLocalQuery(contextQuery);
        } else {
            setLocalQuery("");
        }
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear context when leaving an inline-search page
    useEffect(() => {
        if (!isInlineSearch) {
            clearQuery();
        }
    }, [pathname, isInlineSearch, clearQuery]);

    const getPlaceholder = () => {
        if (isHomePage) return "BLOCK # /HASH";
        if (isEventsPage) return "SEARCH BLOCK / TX HASH / ADDRESS";
        return "ENTER TXN HASH / BLOCK";
    };

    const handleInputChange = (value: string) => {
        setLocalQuery(value);
        setNavError(null);
        if (isInlineSearch) {
            // Update context → triggers live feed / events table filter instantly
            setContextQuery(value);
        }
    };

    const clearSearch = () => {
        setLocalQuery("");
        setNavError(null);
        if (isInlineSearch) {
            clearQuery();
        }
        inputRef.current?.focus();
    };

    /**
     * Navigate using the /api/chain/search endpoint.
     * Works for: block numbers, block hashes (0x…66 chars), and tx hashes.
     */
    const navigateToBlock = async (q: string) => {
        if (!q) return;
        setIsNavigating(true);
        setNavError(null);

        try {
            const res = await fetch(`/api/chain/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            if (data.status === "ok" && data.result) {
                // data.result is a path like "/block/878428"
                clearQuery();
                setLocalQuery("");
                router.push(data.result);
            } else {
                setNavError("NOT FOUND");
                setTimeout(() => setNavError(null), 3000);
            }
        } catch {
            setNavError("NETWORK ERROR");
            setTimeout(() => setNavError(null), 3000);
        } finally {
            setIsNavigating(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = localQuery.trim();
        if (!trimmed) return;

        if (isHomePage) {
            // Home page: Enter/click navigates to block detail page
            await navigateToBlock(trimmed);
            return;
        }

        if (isEventsPage) {
            // Events page: Enter just re-applies the context filter (already done on change)
            setContextQuery(trimmed);
            return;
        }

        // Any other page: navigate to event page
        setIsFocused(false);
        router.push(`/event/${trimmed}`);
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            await handleSearch();
        }
        if (e.key === "Escape") {
            clearSearch();
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto z-50">
            <motion.div
                animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "flex items-center bg-white/5 border border-white/10 rounded-none px-4 py-2.5 transition-all duration-200",
                    navError
                        ? "border-red-500/50 ring-1 ring-red-500/30"
                        : isFocused
                            ? "border-accent ring-1 ring-accent bg-accent/5"
                            : "hover:border-white/20"
                )}
            >
                <button
                    onClick={() => handleSearch()}
                    disabled={isNavigating}
                    className="p-1 -ml-1 mr-2 text-muted-foreground hover:text-accent transition-colors disabled:opacity-50"
                    aria-label="Search"
                >
                    {isNavigating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={getPlaceholder()}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted-foreground placeholder:text-[10px] placeholder:uppercase placeholder:tracking-[0.2em] text-sm md:text-base selection:bg-accent selection:text-white"
                    value={localQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => { setIsFocused(true); setNavError(null); }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    disabled={isNavigating}
                />
                <AnimatePresence>
                    {localQuery && !isNavigating && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={clearSearch}
                            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Error tooltip */}
            <AnimatePresence>
                {navError && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1.5 px-3 py-1 bg-red-950 border border-red-500/30 text-[9px] font-mono text-red-400 uppercase tracking-widest pointer-events-none"
                    >
                        ⚠ {navError} — CHECK BLOCK NUMBER OR HASH
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
