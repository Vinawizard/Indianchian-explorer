export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hash: string }> }
) {
    try {
        const { hash } = await params;

        // First try looking in Supabase (historical)
        const { data, error } = await supabase
            .from("event_payload_data")
            .select("*")
            .eq("tx_hash", hash)
            .limit(1)
            .single();

        if (data) {
            return NextResponse.json({
                status: "ok",
                type: "supabase",
                extrinsic: data,
            });
        }

        // Node-side searching by extrinsic hash without an index is extremely slow.
        // Given our scope, if not in Supabase, we return not found.
        return NextResponse.json({ status: "error", message: "Extrinsic not found" }, { status: 404 });

    } catch (error: any) {
        console.error(`[api/chain/extrinsic] Error for hash:`, error);
        return NextResponse.json(
            { status: "error", message: error?.message || "Failed to find extrinsic" },
            { status: 500 }
        );
    }
}
