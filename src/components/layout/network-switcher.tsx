"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NETWORK, NETWORK_COOKIE, isChainNetwork, type ChainNetwork } from "@/lib/network";

const OPTIONS: { value: ChainNetwork; label: string }[] = [
    { value: "mainnet", label: "MAINNET" },
    { value: "preview", label: "PREVIEW" },
];

function readCookie(): ChainNetwork {
    if (typeof document === "undefined") return DEFAULT_NETWORK;
    const m = document.cookie.match(/(?:^|;\s*)icnet=(mainnet|preview)/);
    return m && isChainNetwork(m[1]) ? m[1] : DEFAULT_NETWORK;
}

export function NetworkSwitcher({ className }: { className?: string }) {
    const [network, setNetwork] = useState<ChainNetwork>(DEFAULT_NETWORK);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setNetwork(readCookie());
        setMounted(true);
    }, []);

    const select = (value: ChainNetwork) => {
        if (value === network) return;
        document.cookie = `${NETWORK_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
        setNetwork(value);
        // Full reload so the server snapshot, feeds and polls all re-resolve
        // against the selected network.
        window.location.reload();
    };

    return (
        <div className={`flex items-stretch border border-white/10 bg-white/5 ${className || ""}`} role="group" aria-label="Select network">
            {OPTIONS.map((opt, i) => {
                const isActive = mounted && network === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => select(opt.value)}
                        aria-pressed={isActive}
                        className={`flex flex-1 justify-center items-center px-4 py-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-all ${i > 0 ? "border-l border-white/10" : ""} ${isActive
                            ? "bg-white/10 text-white border-b-2 border-b-accent"
                            : "text-muted-foreground hover:text-white hover:bg-white/5 border-b-2 border-b-transparent"
                            }`}
                    >
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
