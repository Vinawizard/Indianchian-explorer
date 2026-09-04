export interface NodeMetrics {
    id: number;
    port: number;
    status: "up" | "down";
    blockHeight: number;
    peers: number;
}

export interface NetworkMetrics {
    nodes: NodeMetrics[];
    activeValidators: number;
    highestBlock: number;
}

import { getApi } from "./polkadot";
import { DEFAULT_NETWORK, type ChainNetwork } from "./network";

const MAINNET_PROMETHEUS = process.env.MAINNET_PROMETHEUS_URL || "http://127.0.0.1:9091";

type PromResult = { metric: { instance?: string }; value: [number, string] };

async function promQuery(query: string): Promise<PromResult[]> {
    const res = await fetch(
        `${MAINNET_PROMETHEUS}/api/v1/query?query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(2500), cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Prometheus HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== "success") throw new Error("Prometheus query failed");
    return body.data.result as PromResult[];
}

/**
 * Mainnet validators expose metrics only inside their compose network; the
 * mainnet Prometheus scrapes them, so per-validator height/peers come from it.
 * Instance labels look like "validator-3:9615". Returns null if unavailable.
 */
async function mainnetValidatorMetrics(): Promise<NetworkMetrics | null> {
    try {
        const [heights, peers] = await Promise.all([
            promQuery('substrate_block_height{status="best",job="indianchain-validator"}'),
            promQuery('substrate_sub_libp2p_peers_count{job="indianchain-validator"}'),
        ]);
        if (heights.length === 0) return null;

        const idOf = (instance?: string) => {
            const m = instance?.match(/validator-(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
        };
        const peersById = new Map(peers.map((r) => [idOf(r.metric.instance), parseInt(r.value[1], 10) || 0]));

        const nodes: NodeMetrics[] = heights
            .map((r) => {
                const id = idOf(r.metric.instance);
                return {
                    id,
                    port: 0,
                    status: "up" as const,
                    blockHeight: parseInt(r.value[1], 10) || 0,
                    peers: peersById.get(id) ?? 0,
                };
            })
            .filter((n) => n.id > 0)
            .sort((a, b) => a.id - b.id);

        return {
            nodes,
            activeValidators: nodes.length,
            highestBlock: Math.max(0, ...nodes.map((n) => n.blockHeight)),
        };
    } catch {
        return null;
    }
}

export async function scrapePrometheusMetrics(network: ChainNetwork = DEFAULT_NETWORK): Promise<NetworkMetrics> {
    if (network === "mainnet") {
        const real = await mainnetValidatorMetrics();
        if (real) return real;
        // fall through to the RPC-derived view if Prometheus is unreachable
    }
    try {
        const api = await getApi(network);
        
        // Fetch chain health and header
        const [health, header] = await Promise.all([
            api.rpc.system.health(),
            api.rpc.chain.getHeader()
        ]);
        
        const highestBlock = header.number.toNumber();
        const nodes: NodeMetrics[] = [];
        
        // Try parsing validators from the session pallet
        if (api.query.session && api.query.session.validators) {
            const valIds = await api.query.session.validators();
            
            (valIds as unknown as any[]).forEach((val: any, index: number) => {
                nodes.push({
                    id: index + 1,
                    port: 0,
                    status: "up", // Active validator in the set is up
                    blockHeight: highestBlock,
                    peers: health.peers.toNumber()
                });
            });
        } else {
            // Fallback: If no session module exists, just use connected peers
            const peers = await api.rpc.system.peers();
            
            // Add primary self node
            nodes.push({
                id: 1,
                port: 0,
                status: "up",
                blockHeight: highestBlock,
                peers: health.peers.toNumber()
            });

            peers.forEach((peer, index) => {
                nodes.push({
                    id: index + 2,
                    port: 0,
                    status: "up",
                    blockHeight: peer.bestNumber.toNumber(),
                    peers: 1
                });
            });
        }

        return {
            nodes,
            activeValidators: nodes.length,
            highestBlock,
        };
    } catch (err) {
        console.error("Failed to fetch dynamic node metrics:", err);
        return {
            nodes: [],
            activeValidators: 0,
            highestBlock: 0,
        };
    }
}
