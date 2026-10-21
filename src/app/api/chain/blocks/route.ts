export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveNetwork } from "@/lib/network";
import { listBlocks } from "@/lib/block-data";

/** ?count=10&before=N -> { blocks: [{ number, hash, extrinsicsCount, timestamp }], best, finalized } */
export async function GET(request: Request) {
    try {
        const sp = new URL(request.url).searchParams;
        let count = parseInt(sp.get("count") || "10", 10);
        if (isNaN(count) || count < 1) count = 10;
        const before = sp.get("before") && /^\d+$/.test(sp.get("before")!) ? parseInt(sp.get("before")!, 10) : null;
        const r = await listBlocks(resolveNetwork(request), Math.min(count, 50), before);
        return NextResponse.json({
            status: "ok", best: r.best, finalized: r.finalized,
            blocks: r.blocks.map((b) => ({ number: b.number, hash: b.hash, extrinsicsCount: b.extrinsics, timestamp: b.timestamp })),
        });
    } catch (error: any) {
        console.error("[api/chain/blocks] Error:", error);
        return NextResponse.json({ status: "error", message: error?.message || "Failed to fetch blocks" }, { status: 500 });
    }
}
