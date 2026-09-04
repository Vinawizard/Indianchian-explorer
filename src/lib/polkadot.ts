import { ApiPromise, WsProvider } from "@polkadot/api";
import { DEFAULT_NETWORK, type ChainNetwork } from "./network";

const ENDPOINTS: Record<ChainNetwork, string> = {
    preview:
        process.env.PREVIEW_WS_ENDPOINT ||
        process.env.CHAIN_WS_ENDPOINT ||
        "ws://localhost:9944",
    mainnet: process.env.MAINNET_WS_ENDPOINT || "ws://localhost:9967",
};

const apiInstance: Partial<Record<ChainNetwork, ApiPromise | null>> = {};
const apiPromise: Partial<Record<ChainNetwork, Promise<ApiPromise> | null>> = {};

/**
 * Returns a per-network singleton ApiPromise connected to an IndianChain node.
 * Lazy-initializes on first call, reuses on subsequent calls.
 */
export async function getApi(network: ChainNetwork = DEFAULT_NETWORK): Promise<ApiPromise> {
    const existing = apiInstance[network];
    if (existing && existing.isConnected) {
        return existing;
    }

    const inflight = apiPromise[network];
    if (inflight) {
        return inflight;
    }

    const promise = (async () => {
        try {
            const provider = new WsProvider(ENDPOINTS[network], 2500); // 2.5s reconnect
            const api = await ApiPromise.create({ provider, noInitWarn: true });
            await api.isReady;
            apiInstance[network] = api;

            // Handle disconnection
            provider.on("disconnected", () => {
                console.warn(`[polkadot:${network}] WebSocket disconnected, will reconnect...`);
                apiInstance[network] = null;
                apiPromise[network] = null;
            });

            return api;
        } catch (err) {
            apiInstance[network] = null;
            apiPromise[network] = null;
            throw err;
        }
    })();

    apiPromise[network] = promise;
    return promise;
}

/**
 * Decode hex bytes to a UTF-8 string, stripping non-printable characters.
 */
export function hexToString(hex: string): string {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code > 31 && code < 127) {
            str += String.fromCharCode(code);
        }
    }
    return str;
}

/**
 * Try to parse a string as JSON, return the string as-is if it fails.
 */
export function tryParseJson(str: string): unknown {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}
