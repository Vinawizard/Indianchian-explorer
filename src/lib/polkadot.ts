import { ApiPromise, WsProvider } from "@polkadot/api";
import { DEFAULT_NETWORK, type ChainNetwork } from "./network";

const ENDPOINTS: Record<ChainNetwork, string> = {
    preview:
        process.env.PREVIEW_WS_ENDPOINT ||
        process.env.CHAIN_WS_ENDPOINT ||
        "ws://localhost:9944",
    // Default is the guarded public path on the node host, so a deployment with
    // no MAINNET_WS_ENDPOINT configured (e.g. Vercel) still reaches mainnet.
    mainnet: process.env.MAINNET_WS_ENDPOINT || "ws://139.59.11.86/mainnet-rpc",
};

/**
 * One connection per network for the whole process (globalThis: Next.js bundles this
 * module once per route, and a connection per bundle multiplied sockets and memory).
 *
 * On a disconnect the SAME instance is kept: its provider reconnects every 2.5 s and the
 * instance resumes. The previous version dropped the reference and created a new ApiPromise
 * on every disconnect, while the old one kept reconnecting in the background holding its
 * full decorated metadata — a leak on every RPC-node restart.
 */
type ApiState = {
    instance: Partial<Record<ChainNetwork, ApiPromise>>;
    pending: Partial<Record<ChainNetwork, Promise<ApiPromise>>>;
};
const state: ApiState = ((globalThis as unknown as { __icPolkadot?: ApiState }).__icPolkadot ??= { instance: {}, pending: {} });

const CONNECT_TIMEOUT_MS = 15_000;    // first connection
const RECONNECT_WAIT_MS = 10_000;     // how long a caller waits for an auto-reconnect

function waitConnected(api: ApiPromise, ms: number): Promise<void> {
    if (api.isConnected) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const onConnected = () => { clearTimeout(timer); api.off("connected", onConnected); resolve(); };
        const timer = setTimeout(() => { api.off("connected", onConnected); reject(new Error("chain RPC not connected")); }, ms);
        api.on("connected", onConnected);
    });
}

/**
 * Returns the per-network singleton ApiPromise connected to an IndianChain node.
 * Lazy-initializes on first call, reuses on subsequent calls.
 */
export async function getApi(network: ChainNetwork = DEFAULT_NETWORK): Promise<ApiPromise> {
    const existing = state.instance[network];
    if (existing) {
        await waitConnected(existing, RECONNECT_WAIT_MS);
        return existing;
    }

    const inflight = state.pending[network];
    if (inflight) return inflight;

    const promise = (async () => {
        const provider = new WsProvider(ENDPOINTS[network], 2500); // 2.5s reconnect
        provider.on("disconnected", () => {
            console.warn(`[polkadot:${network}] WebSocket disconnected, will reconnect...`);
        });
        const api = new ApiPromise({ provider, noInitWarn: true });
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            await Promise.race([
                api.isReadyOrError,
                new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`chain RPC connect timed out (${network})`)), CONNECT_TIMEOUT_MS); }),
            ]);
            state.instance[network] = api;
            return api;
        } catch (err) {
            await api.disconnect().catch(() => undefined);   // stop the provider retrying forever
            throw err;
        } finally {
            if (timer) clearTimeout(timer);
            delete state.pending[network];
        }
    })();

    state.pending[network] = promise;
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
