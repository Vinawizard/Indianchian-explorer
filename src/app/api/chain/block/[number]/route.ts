export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getApi, hexToString, tryParseJson } from "@/lib/polkadot";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ number: string }> }
) {
    try {
        const { number } = await params;
        const blockNum = parseInt(number, 10);

        if (isNaN(blockNum)) {
            return NextResponse.json({ status: "error", message: "Invalid block number" }, { status: 400 });
        }

        const api = await getApi();
        const hash = await api.rpc.chain.getBlockHash(blockNum);

        if (hash.isEmpty) {
            return NextResponse.json({ status: "error", message: "Block not found" }, { status: 404 });
        }

        const signedBlock = await api.rpc.chain.getBlock(hash);
        const events = (await api.query.system.events.at(hash)) as any[];

        const extrinsics = signedBlock.block.extrinsics.map((ext, index) => {
            // Find the success/failure event for this extrinsic
            const extEvents = events.filter(
                ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
            );

            const isSuccess = extEvents.some(({ event }) =>
                api.events.system.ExtrinsicSuccess.is(event)
            );

            const isFailed = extEvents.some(({ event }) =>
                api.events.system.ExtrinsicFailed.is(event)
            );

            // Handle custom decoding for dataRegistry calls
            let decodedArgs: any = {};

            if (ext.method.section === "dataRegistry" && ext.method.method === "storeData") {
                const key = ext.method.args[0].toHuman();
                const rawData = ext.method.args[1].toString(); // hex payload
                const jsonStr = hexToString(rawData);
                const parsedData = tryParseJson(jsonStr);

                decodedArgs = { key, data: parsedData };
            } else {
                decodedArgs = ext.method.args.map(a => a.toHuman());
            }

            return {
                index,
                hash: ext.hash.toHex(),
                section: ext.method.section,
                method: ext.method.method,
                args: decodedArgs,
                signer: ext.isSigned ? ext.signer.toString() : null,
                status: isSuccess ? "success" : isFailed ? "failed" : "unknown",
            };
        });

        return NextResponse.json({
            status: "ok",
            block: {
                number: blockNum,
                hash: hash.toHex(),
                parentHash: signedBlock.block.header.parentHash.toHex(),
                stateRoot: signedBlock.block.header.stateRoot.toHex(),
                extrinsicsRoot: signedBlock.block.header.extrinsicsRoot.toHex(),
                extrinsics,
            }
        });

    } catch (error: any) {
        console.error(`[api/chain/block] Error for block:`, error);
        return NextResponse.json(
            { status: "error", message: error?.message || "Failed to fetch block" },
            { status: 500 }
        );
    }
}
