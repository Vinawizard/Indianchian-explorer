"use client";
import { useState, useSyncExternalStore } from "react";
import { DEFAULT_NETWORK, NETWORK_COOKIE, isChainNetwork, type ChainNetwork } from "@/lib/network";
import { Segmented } from "@/components/ui/segmented";

function readCookie(): ChainNetwork {
    const m = document.cookie.match(/(?:^|;\s*)icnet=(mainnet|preview)/);
    return m && isChainNetwork(m[1]) ? m[1] : DEFAULT_NETWORK;
}
const noSubscribe = () => () => {};

export function NetworkSwitcher({ className = "" }: { className?: string }) {
    // the cookie is read after hydration (the server renders the default); a pick shows at once, then reloads
    const fromCookie = useSyncExternalStore(noSubscribe, readCookie, () => DEFAULT_NETWORK);
    const [picked, setPicked] = useState<ChainNetwork | null>(null);
    const network = picked ?? fromCookie;
    return (
        <Segmented label="Network" size="sm" className={className} value={network}
            options={[{ value: "mainnet", label: "Mainnet" }, { value: "preview", label: "Preview" }]}
            onChange={(v) => {
                if (v === network) return;
                setPicked(v);
                document.cookie = `${NETWORK_COOKIE}=${v}; path=/; max-age=31536000; SameSite=Lax`;
                setTimeout(() => window.location.reload(), 180);   // let the thumb land first
            }} />
    );
}
