export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getApi } from "@/lib/polkadot";
import { resolveNetwork } from "@/lib/network";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const countParam = searchParams.get("count") || "10";
        let count = parseInt(countParam, 10);

        // limit max count to prevent abusing the RPC
        if (isNaN(count) || count < 1) count = 10;
        if (count > 50) count = 50;

        const api = await getApi(resolveNetwork(request));

        // Get the latest header first
        const latestHeader = await api.rpc.chain.getHeader();
        const latestNum = latestHeader.number.toNumber();

        const blocks = [];

        // Fetch `count` blocks backwards
        for (let i = latestNum; i > latestNum - count && i > 0; i--) {
            const hash = await api.rpc.chain.getBlockHash(i);
            const signedBlock = await api.rpc.chain.getBlock(hash);

            blocks.push({
                number: i,
                hash: hash.toHex(),
                extrinsicsCount: signedBlock.block.extrinsics.length,
            });
        }

        return NextResponse.json({
            status: "ok",
            blocks,
        });
    } catch (error: any) {
        console.error("[api/chain/blocks] Error:", error);
        return NextResponse.json(
            { status: "error", message: error?.message || "Failed to fetch blocks" },
            { status: 500 }
        );
    }
}
