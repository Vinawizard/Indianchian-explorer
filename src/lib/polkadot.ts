import { ApiPromise, WsProvider } from "@polkadot/api";

const WS_ENDPOINT = process.env.CHAIN_WS_ENDPOINT || "ws://localhost:9944";

let apiInstance: ApiPromise | null = null;
let apiPromise: Promise<ApiPromise> | null = null;

/**
 * Returns a singleton ApiPromise connected to the IndianChain node.
 * Lazy-initializes on first call, reuses on subsequent calls.
 */
export async function getApi(): Promise<ApiPromise> {
    if (apiInstance && apiInstance.isConnected) {
        return apiInstance;
    }

    if (apiPromise) {
        return apiPromise;
    }

    apiPromise = (async () => {
        try {
            const provider = new WsProvider(WS_ENDPOINT, 2500); // 2.5s reconnect
            const api = await ApiPromise.create({ provider, noInitWarn: true });
            await api.isReady;
            apiInstance = api;

            // Handle disconnection
            provider.on("disconnected", () => {
                console.warn("[polkadot] WebSocket disconnected, will reconnect...");
                apiInstance = null;
                apiPromise = null;
            });

            return api;
        } catch (err) {
            apiInstance = null;
            apiPromise = null;
            throw err;
        }
    })();

    return apiPromise;
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
