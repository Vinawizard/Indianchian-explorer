"use client";
import { useEffect, useState } from "react";
import { DEFAULT_NETWORK, NETWORK_COOKIE, isChainNetwork, type ChainNetwork } from "@/lib/network";

const OPTIONS: { value: ChainNetwork; label: string }[] = [
    { value: "mainnet", label: "Mainnet" },
    { value: "preview", label: "Preview" },
];

function readCookie(): ChainNetwork {
    if (typeof document === "undefined") return DEFAULT_NETWORK;
    const m = document.cookie.match(/(?:^|;\s*)icnet=(mainnet|preview)/);
    return m && isChainNetwork(m[1]) ? m[1] : DEFAULT_NETWORK;
}

/** Mainnet / Preview. The selection is the style's 1px accent line, like every other selection. */
export function NetworkSwitcher() {
    const [network, setNetwork] = useState<ChainNetwork>(DEFAULT_NETWORK);
    useEffect(() => { setNetwork(readCookie()); }, []);
    const select = (value: ChainNetwork) => {
        if (value === network) return;
        document.cookie = `${NETWORK_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();   // server data, feeds and polls all re-resolve for the network
    };
    return (
        <div role="group" aria-label="Network" className="flex h-9 items-stretch gap-4 border-b border-transparent text-[13px]">
            {OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => select(o.value)} aria-pressed={network === o.value} className="tab font-medium">
                    {o.label}
                </button>
            ))}
        </div>
    );
}
