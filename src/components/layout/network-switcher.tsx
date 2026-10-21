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

export function NetworkSwitcher({ className = "" }: { className?: string }) {
    const [network, setNetwork] = useState<ChainNetwork>(DEFAULT_NETWORK);
    useEffect(() => { setNetwork(readCookie()); }, []);
    const select = (value: ChainNetwork) => {
        if (value === network) return;
        document.cookie = `${NETWORK_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
    };
    return (
        <div role="group" aria-label="Network" className={`seg ${className}`}>
            {OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => select(o.value)} aria-pressed={network === o.value}>{o.label}</button>
            ))}
        </div>
    );
}
