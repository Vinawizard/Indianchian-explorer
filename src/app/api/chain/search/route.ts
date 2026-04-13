export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getApi, hexToString, tryParseJson } from "@/lib/polkadot";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();

        if (!q) {
            return NextResponse.json({ status: "error", message: "Missing query" }, { status: 400 });
        }

        // 1. Is it a block number?
        const blockNum = parseInt(q, 10);
        if (!isNaN(blockNum) && String(blockNum) === q) {
            return NextResponse.json({
                status: "ok",
                type: "block",
                result: `/block/${blockNum}`,
            });
        }

        // 2. Is it a Settlement ID/Key? (e.g. IND-AGRI-...)
        if (q.startsWith("IND-") || q.startsWith("FARM-")) {
            const api = await getApi();
            const rawData = await api.query.dataRegistry.registry(q);

            if (!rawData.isEmpty) {
                const jsonStr = hexToString(rawData.toHex());
                return NextResponse.json({
                    status: "ok",
                    type: "record",
                    result: tryParseJson(jsonStr),
                });
            }
        }

        // 3. Is it a Hash? Try block hash first (quick)
        if (q.startsWith("0x") && q.length === 66) {
            const api = await getApi();
            try {
                const blockHashTest = await api.rpc.chain.getBlock(q);
                if (blockHashTest) {
                    return NextResponse.json({
                        status: "ok",
                        type: "block_hash",
                        result: `/block/${blockHashTest.block.header.number.toNumber()}`,
                    });
                }
            } catch (e) {
                // Not a block hash, ignore
            }
        }

        // 4. Try as Extrinsic/Transaction Hash in Supabase
        if (q.startsWith("0x")) {
            const { data, error } = await supabase
                .from("event_payload_data")
                .select("block_number")
                .eq("tx_hash", q)
                .limit(1)
                .maybeSingle();

            if (data) {
                return NextResponse.json({
                    status: "ok",
                    type: "tx_hash",
                    result: `/block/${data.block_number}`,
                });
            }
        }

        return NextResponse.json({ status: "not_found", message: "No results matched your query" }, { status: 404 });

    } catch (error: any) {
        console.error(`[api/chain/search] Error:`, error);
        return NextResponse.json(
            { status: "error", message: error?.message || "Failed to search" },
            { status: 500 }
        );
    }
}
