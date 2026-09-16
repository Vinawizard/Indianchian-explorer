import { NextResponse } from "next/server";
import { getMainnetRecordRows } from "@/lib/mainnet-records";
export const dynamic = "force-dynamic";
/** Ready-made mainnet record rows (chain + anchor data), served from the node host for remote copies of the explorer. */
export async function GET() {
    if (!process.env.MAINNET_APP_DB_URL) return NextResponse.json({ rows: [] });   // remote copies don't compute this themselves
    const rows = await getMainnetRecordRows();
    return NextResponse.json({ rows }, { headers: { "Cache-Control": "public, max-age=30" } });
}
