export const dynamic = "force-dynamic"; // never cache
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getApi } from "@/lib/polkadot";
import { scrapePrometheusMetrics } from "@/lib/prometheus";

export async function GET() {
    try {
        const api = await getApi();

        const [header, finalizedHeader, name, metrics] = await Promise.all([
            api.rpc.chain.getHeader(),
            api.rpc.chain.getFinalizedHead().then(hash => api.rpc.chain.getHeader(hash)),
            api.rpc.system.chain(),
            scrapePrometheusMetrics(),
        ]);

        return NextResponse.json({
            status: "ok",
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
