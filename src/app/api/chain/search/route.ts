export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveNetwork } from "@/lib/network";
import { resolveSearch } from "@/lib/search";

/** ?q=  ->  { status: "ok", result: "/path" } or 404 { status: "not_found" } */
export async function GET(request: Request) {
    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ status: "error", message: "Missing query" }, { status: 400 });
    if (q.length > 140) return NextResponse.json({ status: "not_found" }, { status: 404 });
    try {
        const result = await resolveSearch(q, resolveNetwork(request));
        return result
            ? NextResponse.json({ status: "ok", result })
            : NextResponse.json({ status: "not_found", message: "No results matched your query" }, { status: 404 });
    } catch (error: any) {
        console.error("[api/chain/search] Error:", error);
        return NextResponse.json({ status: "error", message: "Search failed" }, { status: 500 });
    }
}
