import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import { fmtInt, recordHref, recordTypeShort, shortHash, shortId } from "@/lib/format";
import { SERIES } from "@/components/charts/palette";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";

type Col = "record" | "version" | "farmer" | "block" | "time" | "tx" | "anchor";
const ALL: Col[] = ["record", "version", "farmer", "block", "time", "anchor"];
const TYPE_COLOR: Record<string, string> = { farmer: SERIES.farmer, agri_record: SERIES.agri_record, credit_app: SERIES.credit_app };

/** Every row is one target (stretched link); type is a coloured dot, status a lit dot and a word. */
export function RecordsTable({ rows, cols = ALL, caption }: { rows: MainnetRecordRow[]; cols?: Col[]; caption?: string }) {
    const has = (c: Col) => cols.includes(c);
    return (
        <div className="overflow-x-auto">
            <table className="table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {has("record") && <th scope="col">Record</th>}
                        {has("version") && <th scope="col">Version</th>}
                        {has("farmer") && <th scope="col" className="hidden lg:table-cell">Farmer</th>}
                        {has("block") && <th scope="col" className="r hidden sm:table-cell">Block</th>}
                        {has("time") && <th scope="col" className="hidden md:table-cell">Age</th>}
                        {has("tx") && <th scope="col" className="hidden xl:table-cell">Transaction</th>}
                        {has("anchor") && <th scope="col">Cardano</th>}
                        <th scope="col" className="w-10"><span className="sr-only">Open</span></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const id = r.record_id ?? r.entity_id ?? "";
                        const anchored = r.batch_index != null || !!r.cardano_tx_hash;
                        return (
                            <tr key={r.payload_id}>
                                {has("record") && (
                                    <td>
                                        <Link href={recordHref(id, r.version)} className="row-link inline-flex items-center gap-3">
                                            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_COLOR[r.record_type] ?? "#888", boxShadow: `0 0 10px ${TYPE_COLOR[r.record_type] ?? "#888"}` }} />
                                            <span className="w-[88px] text-[13px] text-white/70">{recordTypeShort(r.record_type)}</span>
                                            <span className="mono text-white" title={id}>{shortId(id)}</span>
                                        </Link>
                                    </td>
                                )}
                                {has("version") && <td><span className="chip chip-grey num !normal-case">v{r.version ?? "—"}</span></td>}
                                {has("farmer") && (
                                    <td className="hidden lg:table-cell">
                                        {r.farmer_id ? <Link href={`/records?farmer=${r.farmer_id}`} className="z mono text-white/55 transition-colors hover:text-[#b8c0ff]" title={r.farmer_id}>{shortId(r.farmer_id)}</Link> : <span className="text-white/30">—</span>}
                                    </td>
                                )}
                                {has("block") && <td className="r hidden sm:table-cell"><Link href={`/block/${r.block_number}`} className="z num text-white/75 transition-colors hover:text-[#b8c0ff]">{fmtInt(r.block_number)}</Link></td>}
                                {has("time") && <td className="dim hidden md:table-cell"><TimeAgo iso={r.confirmed_at} /></td>}
                                {has("tx") && <td className="hidden xl:table-cell"><span className="mono text-white/50" title={r.tx_hash ?? ""}>{shortHash(r.tx_hash, 10, 6)}</span></td>}
                                {has("anchor") && (
                                    <td>
                                        {anchored ? (
                                            <span className="inline-flex items-center gap-2.5">
                                                <Status tone="positive">Anchored</Status>
                                                {r.batch_index != null && <Link href={`/anchor/${r.batch_index}`} className="z num hidden text-[13px] text-white/45 transition-colors hover:text-[#b8c0ff] sm:inline">#{fmtInt(r.batch_index)}</Link>}
                                            </span>
                                        ) : <Status tone="warning">Pending</Status>}
                                    </td>
                                )}
                                <td className="r"><ArrowRight className="row-arrow ml-auto h-4 w-4" aria-hidden /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
