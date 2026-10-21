export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveNetwork } from "@/lib/network";
import { getBlockDetail } from "@/lib/block-data";

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
    try {
        const { number } = await params;
        const n = parseInt(number, 10);
        if (isNaN(n)) return NextResponse.json({ status: "error", message: "Invalid block number" }, { status: 400 });
        const block = await getBlockDetail(resolveNetwork(request), n);
        if (!block) return NextResponse.json({ status: "error", message: "Block not found" }, { status: 404 });
        return NextResponse.json({ status: "ok", block });
    } catch (error: any) {
        console.error(`[api/chain/block] Error for block:`, error);
        return NextResponse.json({ status: "error", message: error?.message || "Failed to fetch block" }, { status: 500 });
    }
}
