import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getCachedEvent } from "@/lib/event-data";
import { EventAttributes } from "@/components/events/event-attributes";

export const revalidate = 60;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center px-8 py-5 group hover:bg-white/[0.02] transition-colors">
            <span className="w-64 flex-shrink-0 text-[10px] font-heading text-muted-foreground uppercase tracking-[0.2em] mb-1 md:mb-0">
                {label}
            </span>
            <div className="flex-1 text-white flex items-center">
                {value}
            </div>
        </div>
    );
}

export default async function EventPage({ params }: { params: Promise<{ hash: string }> }) {
    const { hash } = await params;
    const { event, error, isBlockNumber } = await getCachedEvent(hash);

    if (event && !isBlockNumber) {
        redirect(`/event/${event.block_number}`);
    }

    return (
        <div className="min-h-screen bg-black relative py-8 w-full overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-destructive/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1280px] w-[90%] mx-auto pb-24 relative z-10">
                <div className="flex flex-wrap items-center gap-3 text-sm font-heading mb-12 uppercase tracking-widest">
                    <Link href="/" prefetch className="text-muted-foreground hover:text-white transition-colors">
                        TRIVOLVE
                    </Link>
                    <span className="text-white/20 font-normal">/</span>
                    <Link href="/events" prefetch className="text-muted-foreground hover:text-white transition-colors">
                        EVENTS_LOG
                    </Link>
                    <span className="text-white/20 font-normal">/</span>
                    <span className="text-accent font-bold break-all">
                        {event?.block_number ? `BLK_${event.block_number}` : `ID_${hash}`}
                    </span>
                </div>

                {(error || !event) && (
                    <div className="card-premium px-8 py-16 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-10 h-10 text-destructive/50" />
                        <h2 className="text-xl font-heading text-white uppercase tracking-widest">ERROR_404</h2>
                        <p className="text-sm font-heading text-muted-foreground uppercase opacity-60">
                            EVENT_NOT_FOUND_OR_LOAD_FAILED
                        </p>
                        <Link
                            href="/events"
                            prefetch
                            className="mt-4 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-heading text-white hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
                        >
                            ← RETURN_TO_LOGS
                        </Link>
                    </div>
                )}

                {event && (
                    <div className="flex flex-col mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 bg-accent" />
                            <h1 className="text-lg font-heading text-white uppercase tracking-[0.3em]">
                                PRIMARY_METADATA
                            </h1>
                        </div>

                        <div className="card-premium divide-y divide-white/5">
                            <Row
                                label="BLOCK_NUMBER"
                                value={
                                    <Link
                                        href={`/event/${event.block_number}`}
                                        prefetch
                                        className="text-accent hover:text-white transition-colors font-mono tracking-wider"
                                    >
                                        #{event.block_number ?? "—"}
                                    </Link>
                                }
                            />
                            <Row
                                label="TRANSACTION_HASH"
                                value={
                                    <span className="text-white/80 font-mono text-[13px] break-all tracking-wider">
                                        {event.tx_hash ?? "—"}
                                    </span>
                                }
                            />
                            <Row
                                label="EVENT_INDEX"
                                value={
                                    <span className="text-white/60 font-mono tracking-widest">
                                        {event.tx_index ?? "—"}
                                    </span>
                                }
                            />
                            <Row
                                label="EVENT_SIGNATURE"
                                value={
                                    <span className="inline-flex items-center px-4 py-1.5 bg-white/5 text-accent border border-accent/20 text-[10px] font-heading uppercase tracking-[0.2em] rounded-none">
                                        {(event.type || event.record_type)?.replace(/_/g, " ") ?? "—"}
                                    </span>
                                }
                            />
                        </div>
                    </div>
                )}

                {event && <EventAttributes event={event} />}
            </div>
        </div>
    );
}
