import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import { fmtInt, recordHref, recordTypeShort, shortHash, shortId } from "@/lib/format";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";

type Col = "record" | "version" | "farmer" | "block" | "time" | "tx" | "anchor";
const ALL: Col[] = ["record", "version", "farmer", "block", "time", "anchor"];

export function RecordsTable({ rows, cols = ALL, caption }: { rows: MainnetRecordRow[]; cols?: Col[]; caption?: string }) {
    const has = (c: Col) => cols.includes(c);
    return (
        <div className="overflow-x-auto">
            <table className="table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {has("record") && <th scope="col">Record</th>}
                        {has("version") && <th scope="col" className="r">Version</th>}
                        {has("farmer") && <th scope="col" className="hidden lg:table-cell">Farmer</th>}
                        {has("block") && <th scope="col" className="r hidden sm:table-cell">Block</th>}
                        {has("time") && <th scope="col" className="hidden md:table-cell">Age</th>}
                        {has("tx") && <th scope="col" className="hidden xl:table-cell">Transaction</th>}
                        {has("anchor") && <th scope="col">Cardano</th>}
                        <th scope="col" className="w-14"><span className="sr-only">Open</span></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const id = r.record_id ?? r.entity_id ?? "";
                        const href = recordHref(id, r.version);
                        const anchored = r.batch_index != null || !!r.cardano_tx_hash;
                        return (
                            <tr key={r.payload_id}>
                                {has("record") && (
                                    <td>
                                        <Link href={href} className="inline-flex items-baseline gap-3">
                                            <span className="tag w-[104px]">{recordTypeShort(r.record_type)}</span>
                                            <span className="mono link" title={id}>{shortId(id)}</span>
                                        </Link>
                                    </td>
                                )}
                                {has("version") && <td className="r num text-white/70">v{r.version ?? "—"}</td>}
                                {has("farmer") && (
                                    <td className="hidden lg:table-cell">
                                        {r.farmer_id ? <Link href={`/records?farmer=${r.farmer_id}`} className="mono text-white/50 transition-colors hover:text-white" title={r.farmer_id}>{shortId(r.farmer_id)}</Link> : <span className="text-faint">—</span>}
                                    </td>
                                )}
                                {has("block") && <td className="r hidden sm:table-cell"><Link href={`/block/${r.block_number}`} className="num text-white/70 transition-colors hover:text-white">#{fmtInt(r.block_number)}</Link></td>}
                                {has("time") && <td className="hidden text-white/60 md:table-cell"><TimeAgo iso={r.confirmed_at} /></td>}
                                {has("tx") && <td className="hidden xl:table-cell"><span className="mono text-white/50" title={r.tx_hash ?? ""}>{shortHash(r.tx_hash, 10, 6)}</span></td>}
                                {has("anchor") && (
                                    <td>
                                        <span className="inline-flex items-center gap-3">
                                            {anchored ? <Status tone="positive">Anchored</Status> : <Status tone="warning">Pending</Status>}
                                            {r.batch_index != null && <Link href={`/anchor/${r.batch_index}`} className="num hidden text-[13px] text-white/50 hover:text-white sm:inline">#{fmtInt(r.batch_index)}</Link>}
                                        </span>
                                    </td>
                                )}
                                <td className="r"><Link href={href} className="icon-btn" aria-label={`Open record ${shortId(id)}`}><ChevronRight className="h-4 w-4" aria-hidden /></Link></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
