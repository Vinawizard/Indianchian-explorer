import { NextResponse } from "next/server";
import { anchorsPerDay, findAnchorByTx, getAnchor, listAnchors } from "@/lib/mainnet-anchors";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "public, max-age=20" };

/**
 * Cardano anchor batches, served from the node host for remote copies of the explorer.
 *   ?limit=&before=   -> { batches (newest first), total }
 *   ?index=N          -> { batch }
 *   ?tx=<cardano tx>  -> { batch }
 *   ?daily=14         -> { days: [{ day, anchors, records }] }
 */
export async function GET(req: Request) {
    if (!process.env.MAINNET_APP_DB_URL) return NextResponse.json({ batches: [], total: 0 });
    const q = new URL(req.url).searchParams;
    const num = (k: string) => { const v = q.get(k); return v && /^\d+$/.test(v) ? parseInt(v, 10) : null; };
    if (q.get("index")) return NextResponse.json({ batch: await getAnchor(num("index") ?? -1) }, { headers: H });
    if (q.get("tx")) return NextResponse.json({ batch: await findAnchorByTx(q.get("tx")!) }, { headers: H });
    if (q.get("daily")) return NextResponse.json({ days: await anchorsPerDay(Math.min(num("daily") ?? 14, 60)) }, { headers: H });
    return NextResponse.json(await listAnchors(Math.min(num("limit") ?? 25, 100), num("before")), { headers: H });
}
