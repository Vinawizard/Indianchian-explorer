"use client";
import { useEffect, useState } from "react";
import { DEFAULT_NETWORK, NETWORK_COOKIE, isChainNetwork, type ChainNetwork } from "@/lib/network";
import { Segmented } from "@/components/ui/segmented";

function readCookie(): ChainNetwork {
    if (typeof document === "undefined") return DEFAULT_NETWORK;
    const m = document.cookie.match(/(?:^|;\s*)icnet=(mainnet|preview)/);
    return m && isChainNetwork(m[1]) ? m[1] : DEFAULT_NETWORK;
}

export function NetworkSwitcher({ className = "" }: { className?: string }) {
    const [network, setNetwork] = useState<ChainNetwork>(DEFAULT_NETWORK);
    useEffect(() => { setNetwork(readCookie()); }, []);
    return (
        <Segmented label="Network" size="sm" className={className} value={network}
            options={[{ value: "mainnet", label: "Mainnet" }, { value: "preview", label: "Preview" }]}
            onChange={(v) => {
                if (v === network) return;
                setNetwork(v);
                document.cookie = `${NETWORK_COOKIE}=${v}; path=/; max-age=31536000; SameSite=Lax`;
                setTimeout(() => window.location.reload(), 180);   // let the thumb land first
            }} />
    );
}
