"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function SearchBar() {
    const router = useRouter();
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const clearSearch = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const trimmed = query.trim();
        if (!trimmed) return;

        setIsFocused(false);
        // Everything goes to the event page now (it handles both block number and tx_hash)
        router.push(`/event/${trimmed}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto z-50">
            <motion.div
                animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "flex items-center bg-white/5 border border-white/10 rounded-none px-4 py-2.5 transition-all duration-200",
                    isFocused ? "border-accent ring-1 ring-accent bg-accent/5" : "hover:border-white/20"
                )}
            >
                <button
                    onClick={() => handleSearch()}
                    className="p-1 -ml-1 mr-2 text-muted-foreground hover:text-accent transition-colors"
                    aria-label="Search"
                >
                    <Search className="w-4 h-4" />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="ENTER TXN HASH / BLOCK"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted-foreground placeholder:text-[10px] placeholder:uppercase placeholder:tracking-[0.2em] text-sm md:text-base selection:bg-accent selection:text-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                />
                <AnimatePresence>
                    {query && (
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
        </div>
    );
}
