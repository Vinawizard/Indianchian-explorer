import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_NETWORK, NETWORK_COOKIE, isChainNetwork, type ChainNetwork } from "./network";

/** Network resolution for server components (reads the request cookies). */
export async function resolveNetworkFromCookies(): Promise<ChainNetwork> {
    const store = await cookies();
    const v = store.get(NETWORK_COOKIE)?.value;
    return isChainNetwork(v) ? v : DEFAULT_NETWORK;
}
