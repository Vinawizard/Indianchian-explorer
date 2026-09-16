import { NextResponse } from "next/server";
import { getMainnetAnchorBatches, getMainnetAnchorLinks } from "@/lib/mainnet-anchors";
export const dynamic = "force-dynamic";
/** Read-only JSON of mainnet L1 anchor batches (served from the node host; Vercel's copy fetches this). */
export async function GET(req: Request) {
    if (!process.env.MAINNET_APP_DB_URL) return NextResponse.json({ batches: [], links: {} });
    const links = new URL(req.url).searchParams.get("links") === "1";
    return NextResponse.json({ batches: await getMainnetAnchorBatches(), ...(links ? { links: await getMainnetAnchorLinks() } : {}) },
        { headers: { "Cache-Control": "public, max-age=30" } });
}
