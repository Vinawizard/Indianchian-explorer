import { unstable_cache } from "next/cache";
import { getApi } from "@/lib/polkadot";
import { scrapePrometheusMetrics } from "@/lib/prometheus";
import type { NetworkMetrics } from "@/lib/prometheus";
import { DEFAULT_NETWORK, type ChainNetwork } from "@/lib/network";

export type ChainBlock = {
    number: number;
    hash: string;
    extrinsicsCount: number;
};

export type ChainSnapshot = {
    latestBlock: number;
    initialBlocks: ChainBlock[];
    initialStats: {
        latestBlock: number;
        finalizedBlock: number;
        chainName: string;
        network: NetworkMetrics;
    } | null;
};

async function fetchChainSnapshot(network: ChainNetwork): Promise<ChainSnapshot> {
    const api = await getApi(network);

    const [latestHeader, finalizedHash, chainName, networkMetrics] = await Promise.all([
        api.rpc.chain.getHeader(),
        api.rpc.chain.getFinalizedHead(),
        api.rpc.system.chain(),
        scrapePrometheusMetrics(network),
    ]);
    const finalizedHeader = await api.rpc.chain.getHeader(finalizedHash);

    const latestNum = latestHeader.number.toNumber();

    const blockNumbers = Array.from({ length: 10 }, (_, idx) => latestNum - idx).filter((n) => n > 0);
    const initialBlocks = await Promise.all(
        blockNumbers.map(async (n) => {
            const hash = await api.rpc.chain.getBlockHash(n);
            const signedBlock = await api.rpc.chain.getBlock(hash);
            return {
                number: n,
                hash: hash.toHex(),
                extrinsicsCount: signedBlock.block.extrinsics.length,
            };
        })
    );

    return {
        latestBlock: latestNum,
        initialBlocks,
        initialStats: {
            latestBlock: latestNum,
            finalizedBlock: finalizedHeader.number.toNumber(),
            chainName: chainName.toString(),
            network: networkMetrics,
        },
    };
}

// The network argument becomes part of the cache key, so preview and
// mainnet snapshots never overwrite each other.
export const getCachedChainSnapshot = unstable_cache(
    async (network: ChainNetwork = DEFAULT_NETWORK): Promise<ChainSnapshot> => {
        try {
            return await fetchChainSnapshot(network);
        } catch (e) {
            console.error(`[chain-snapshot:${network}] Failed to fetch live chain data:`, e);
            return { latestBlock: 0, initialBlocks: [], initialStats: null };
        }
    },
    ["indiachain-chain-snapshot-v2"],
    { revalidate: 10 }
);
