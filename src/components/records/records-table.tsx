import Link from "next/link";
import { Box, ChevronRight, Clock, FileText, Layers, ScrollText, User } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import { fmtInt, recordHref, shortId } from "@/lib/format";
import { CardanoIcon } from "@/components/ui/cardano-icon";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";

type Col = "block" | "event" | "sector" | "version" | "farmer" | "time" | "anchor";
const ALL: Col[] = ["block", "event", "sector", "version", "farmer", "time", "anchor"];
const sector = (t: string) => t.replace(/_/g, " ");

/** The original events table: `#` block, the record's sector as an outlined chip, its Cardano anchor, a chevron. */
export function RecordsTable({ rows, cols = ALL, caption }: { rows: MainnetRecordRow[]; cols?: Col[]; caption?: string }) {
    const has = (c: Col) => cols.includes(c);
    return (
        <div className="overflow-x-auto">
            <table className="table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {has("block") && <th scope="col"><span className="h"><Box aria-hidden />Block</span></th>}
                        {has("event") && <th scope="col"><span className="h"><ScrollText aria-hidden />Event</span></th>}
                        {has("sector") && <th scope="col"><span className="h"><FileText aria-hidden />Sector</span></th>}
                        {has("version") && <th scope="col" className="hidden sm:table-cell"><span className="h"><Layers aria-hidden />Version</span></th>}
                        {has("farmer") && <th scope="col" className="hidden xl:table-cell"><span className="h"><User aria-hidden />Farmer</span></th>}
                        {has("time") && <th scope="col" className="hidden md:table-cell"><span className="h"><Clock aria-hidden />Age</span></th>}
                        {has("anchor") && <th scope="col"><span className="h"><CardanoIcon className="h-3.5 w-3.5" />Cardano</span></th>}
                        <th scope="col" className="w-12"><span className="sr-only">Open</span></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const id = r.record_id ?? r.entity_id ?? "";
                        const anchored = r.batch_index != null || !!r.cardano_tx_hash;
                        return (
                            <tr key={r.payload_id}>
                                {has("block") && <td><Link href={`/block/${r.block_number}`} className="z blk transition-colors hover:text-blue-text">{r.block_number}</Link></td>}
                                {has("event") && <td><Link href={recordHref(id, r.version)} className="row-link mono text-white/85" title={id}>{shortId(id)}</Link></td>}
                                {has("sector") && <td><span className="chip chip-sector">{sector(r.record_type)}</span></td>}
                                {has("version") && <td className="num hidden sm:table-cell">v{r.version ?? "—"}</td>}
                                {has("farmer") && (
                                    <td className="hidden xl:table-cell">
                                        {r.farmer_id ? <Link href={`/events?farmer=${r.farmer_id}`} className="z mono text-white/50 transition-colors hover:text-blue-text" title={r.farmer_id}>{shortId(r.farmer_id)}</Link> : <span className="text-white/30">—</span>}
                                    </td>
                                )}
                                {has("time") && <td className="hidden md:table-cell"><TimeAgo iso={r.confirmed_at} /></td>}
                                {has("anchor") && (
                                    <td>
                                        {anchored ? (
                                            <span className="inline-flex items-center gap-3">
                                                <Status tone="positive">Anchored</Status>
                                                {r.batch_index != null && <Link href={`/anchor/${r.batch_index}`} className="z num hidden text-white/45 transition-colors hover:text-blue-text lg:inline">#{fmtInt(r.batch_index)}</Link>}
                                            </span>
                                        ) : <Status>Pending</Status>}
                                    </td>
                                )}
                                <td className="r"><span className="row-go" aria-hidden><ChevronRight className="h-4 w-4" /></span></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

