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

export async function scrapePrometheusMetrics(): Promise<NetworkMetrics> {
    try {
        const api = await getApi();
        
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
