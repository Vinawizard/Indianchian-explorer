import { NextResponse } from "next/server";
import { DEFAULT_ROW_LIMIT, getMainnetSummary, queryMainnetRecords } from "@/lib/mainnet-records";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const H = { "Cache-Control": "public, max-age=30" };
/**
 * Mainnet records for remote copies of the explorer, served from the node host.
 *   ?summary=1                       -> home-page totals + chart series (a few KB)
 *   ?status=&record_type=&start=&end=&find=&limit=   -> { rows (newest first, capped), total }
 * Never returns every row: 100k+ rows is ~100 MB and breaks a serverless function.
 */
export async function GET(req: Request) {
    if (!process.env.MAINNET_APP_DB_URL) return NextResponse.json({ rows: [], total: 0 });   // remote copies don't compute this themselves
    const q = new URL(req.url).searchParams;
    if (q.get("summary")) return NextResponse.json(await getMainnetSummary(), { headers: H });
    const num = (k: string) => { const v = q.get(k); return v && /^\d+$/.test(v) ? parseInt(v, 10) : null; };
    const limit = Math.min(num("limit") ?? DEFAULT_ROW_LIMIT, 10_000);
    const r = await queryMainnetRecords({
        status: q.get("status") ?? undefined, record_type: q.get("record_type") ?? undefined,
        minBlock: num("start"), maxBlock: num("end"), find: q.get("find") ?? undefined, limit,
    });
    return NextResponse.json(r, { headers: H });
}
