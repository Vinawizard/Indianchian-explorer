export type ChainNetwork = "mainnet" | "preview";

export const DEFAULT_NETWORK: ChainNetwork = "mainnet";
export const NETWORK_COOKIE = "icnet";

export function isChainNetwork(v: unknown): v is ChainNetwork {
    return v === "mainnet" || v === "preview";
}

/**
 * Resolve the target network for an API route handler.
 * Priority: explicit ?network= query param, then the icnet cookie, then default.
 * (Server components use resolveNetworkFromCookies in network-server.ts.)
 */
export function resolveNetwork(request: Request): ChainNetwork {
    try {
        const q = new URL(request.url).searchParams.get("network");
        if (isChainNetwork(q)) return q;
    } catch {
        /* fall through to cookie */
    }
    const cookie = request.headers.get("cookie") || "";
    const m = cookie.match(/(?:^|;\s*)icnet=(mainnet|preview)/);
    return m && isChainNetwork(m[1]) ? m[1] : DEFAULT_NETWORK;
}
