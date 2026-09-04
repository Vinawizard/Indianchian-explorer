export const dynamic = "force-dynamic"; // never cache
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getApi } from "@/lib/polkadot";
import { scrapePrometheusMetrics } from "@/lib/prometheus";
import { resolveNetwork } from "@/lib/network";

export async function GET(request: Request) {
    try {
        const network = resolveNetwork(request);
        const api = await getApi(network);

        const [header, finalizedHeader, name, metrics] = await Promise.all([
            api.rpc.chain.getHeader(),
            api.rpc.chain.getFinalizedHead().then(hash => api.rpc.chain.getHeader(hash)),
            api.rpc.system.chain(),
            scrapePrometheusMetrics(network),
        ]);

        return NextResponse.json({
            status: "ok",
            chainNetwork: network,
            stats: {
                latestBlock: header.number.toNumber(),
                finalizedBlock: finalizedHeader.number.toNumber(),
                chainName: name.toString(),
                network: metrics,
            }
        });
    } catch (error: any) {
        console.error("[api/chain/stats] Error:", error);
        return NextResponse.json(
            { status: "error", message: error?.message || "Failed to fetch chain stats" },
            { status: 500 }
        );
    }
}
