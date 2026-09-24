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

        // Mainnet also reports the pallet's own record counter so the home cards update live.
        // Preview totals are Cardano-proof records from Supabase, so no counter is sent there.
        const counter = network === "mainnet"
            ? (api.query as unknown as Record<string, Record<string, (() => Promise<{ toString(): string }>) | undefined> | undefined>).indianchain?.totalRecords
            : undefined;
        const [header, finalizedHeader, name, metrics, totalRecords] = await Promise.all([
            api.rpc.chain.getHeader(),
            api.rpc.chain.getFinalizedHead().then(hash => api.rpc.chain.getHeader(hash)),
            api.rpc.system.chain(),
            scrapePrometheusMetrics(network),
            counter ? counter().then((v) => Number(v.toString())).catch(() => undefined) : Promise.resolve(undefined),
        ]);

        return NextResponse.json({
            status: "ok",
            chainNetwork: network,
            stats: {
                latestBlock: header.number.toNumber(),
                finalizedBlock: finalizedHeader.number.toNumber(),
                chainName: name.toString(),
                network: metrics,
                ...(typeof totalRecords === "number" && totalRecords > 0 ? { totalRecords } : {}),
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
