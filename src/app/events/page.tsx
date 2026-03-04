import Link from "next/link";
import { EventsFilterBar } from "@/components/events/events-filter-bar";
import { EventsTable } from "@/components/events/events-table";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const filterChain = typeof params.chain === "string" ? params.chain : "";
    const filterRecordType = typeof params.record_type === "string" ? params.record_type : "";
    const filterStatus = typeof params.status === "string" ? params.status : "";
    const filterStart = typeof params.start === "string" ? parseInt(params.start, 10) : NaN;
    const filterEnd = typeof params.end === "string" ? parseInt(params.end, 10) : NaN;

    const PAGE_SIZE = 1000;
    let allEvents: any[] = [];
    let from = 0;

    // Determine block range correctly
    let minBlock = !isNaN(filterStart) ? filterStart : null;
    let maxBlock = !isNaN(filterEnd) ? filterEnd : null;

    // If both are provided, ensure min is actually smaller
    if (minBlock !== null && maxBlock !== null) {
        const actualMin = Math.min(minBlock, maxBlock);
        const actualMax = Math.max(minBlock, maxBlock);
        minBlock = actualMin;
        maxBlock = actualMax;
    }

    while (true) {
        let query = supabase
            .from("event_payload_data")
            .select(
                "payload_id, block_number, submission_status, chain, record_type, type, tx_hash, block_hash, signer_address, tx_fee, tx_index, timestamp, confirmed_at, entity_id, farmer_id, record_id, version, payload_hash"
            );

        // Apply filters at DB level
        if (filterChain) query = query.eq("chain", filterChain);
        if (filterRecordType) query = query.eq("record_type", filterRecordType.toLowerCase());
        if (filterStatus) query = query.eq("submission_status", filterStatus.toLowerCase());
        if (minBlock !== null) query = query.gte("block_number", minBlock);
        if (maxBlock !== null) query = query.lte("block_number", maxBlock);

        const { data, error } = await query
            .order("block_number", { ascending: false })
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error("Error fetching events:", error);
            break;
        }

        if (data && data.length > 0) {
            allEvents = allEvents.concat(data);
        }

        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    const filteredEvents = allEvents;

    // Group by block_number — preserve DB insertion order
    const blockMap = new Map<
        number,
        {
            block_number: number;
            submission_status: string;
            chain: string;
            record_types: {
                payload_id: string;
                record_type: string;
                type: string | null;
                tx_hash: string | null;
                block_hash: string | null;
                signer_address: string | null;
                tx_fee: number | null;
                tx_index: number | null;
                timestamp: string | null;
                confirmed_at: string | null;
                entity_id: string | null;
                farmer_id: string | null;
                record_id: string | null;
                version: number | null;
                payload_hash: string | null;
            }[];
        }
    >();

    for (const row of filteredEvents) {
        if (!blockMap.has(row.block_number)) {
            blockMap.set(row.block_number, {
                block_number: row.block_number,
                submission_status: row.submission_status,
                chain: row.chain,
                record_types: [],
            });
        }
        blockMap.get(row.block_number)!.record_types.push({
            payload_id: row.payload_id,
            record_type: row.record_type,
            type: row.type,
            tx_hash: row.tx_hash,
            block_hash: row.block_hash,
            signer_address: row.signer_address,
            tx_fee: row.tx_fee,
            tx_index: row.tx_index,
            timestamp: row.timestamp,
            confirmed_at: row.confirmed_at,
            entity_id: row.entity_id,
            farmer_id: row.farmer_id,
            record_id: row.record_id,
            version: row.version,
            payload_hash: row.payload_hash,
        });
    }

    const groupedEvents = Array.from(blockMap.values());

    return (
        <div className="container mx-auto px-4 lg:px-8 py-12 relative overflow-hidden">
            <div className="grid-pattern" />

            <div className="mb-8 relative z-10">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-6">
                    <Link href="/" className="hover:text-white transition-colors">IndiaChain</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-white">Network Events</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl text-heading uppercase tracking-tighter text-white">
                            Data <span className="text-accent underline decoration-1 underline-offset-8">Events</span>
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-3 max-w-lg">
                            Real-time structural intelligence feed. Protocol interactions and state changes.
                        </p>
                    </div>

                    <div className="flex bg-white/5 border border-white/10 p-4 rounded-none">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Network Activity</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-heading text-white">{filteredEvents.length.toLocaleString()} <span className="text-[10px] text-accent">RECORDS</span></span>
                                <span className="h-3 w-px bg-white/10"></span>
                                <span className="text-xl font-heading text-white">{groupedEvents.length.toLocaleString()} <span className="text-[10px] text-accent">BLOCKS</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EventsFilterBar />
            <EventsTable events={groupedEvents} />
        </div>
    );
}
