import Link from "next/link";
import type { MainnetRecordRow } from "@/lib/mainnet-records";
import { fmtInt, recordHref, recordTypeShort, shortId } from "@/lib/format";
import { Hash } from "@/components/ui/hash";
import { Status } from "@/components/ui/status";
import { TimeAgo } from "@/components/ui/time-ago";

type Col = "record" | "version" | "farmer" | "block" | "time" | "tx" | "anchor";
const ALL: Col[] = ["record", "version", "farmer", "block", "time", "tx", "anchor"];

/** One row per record version: what it is, where it is on IndianChain, and whether Cardano has sealed it. */
export function RecordsTable({ rows, cols = ALL, caption }: { rows: MainnetRecordRow[]; cols?: Col[]; caption?: string }) {
    const has = (c: Col) => cols.includes(c);
    return (
        <div className="overflow-x-auto">
            <table className="table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {has("record") && <th scope="col">Record</th>}
                        {has("version") && <th scope="col" className="r hidden sm:table-cell">Version</th>}
                        {has("farmer") && <th scope="col" className="hidden lg:table-cell">Farmer</th>}
                        {has("block") && <th scope="col" className="r hidden sm:table-cell">Block</th>}
                        {has("time") && <th scope="col" className="hidden md:table-cell">Finalized</th>}
                        {has("tx") && <th scope="col" className="hidden xl:table-cell">Transaction</th>}
                        {has("anchor") && <th scope="col">Cardano anchor</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const id = r.record_id ?? r.entity_id ?? "";
                        return (
                            <tr key={r.payload_id}>
                                {has("record") && (
                                    <td>
                                        <Link href={recordHref(id, r.version)} className="group inline-flex items-baseline gap-2">
                                            <span className="text-muted group-hover:text-ink transition-colors">{recordTypeShort(r.record_type)}</span>
                                            <span className="mono link" title={id}>{shortId(id)}</span>
                                            {has("version") && <span className="num text-faint sm:hidden">v{r.version ?? "—"}</span>}
                                        </Link>
                                    </td>
                                )}
                                {has("version") && <td className="r num hidden text-muted sm:table-cell">v{r.version ?? "—"}</td>}
                                {has("farmer") && (
                                    <td className="hidden lg:table-cell">
                                        {r.farmer_id ? (
                                            <Link href={`/records?farmer=${r.farmer_id}`} className="mono text-muted hover:text-ink transition-colors" title={r.farmer_id}>{shortId(r.farmer_id)}</Link>
                                        ) : <span className="text-faint">—</span>}
                                    </td>
                                )}
                                {has("block") && <td className="r hidden sm:table-cell"><Link href={`/block/${r.block_number}`} className="num link">{fmtInt(r.block_number)}</Link></td>}
                                {has("time") && <td className="hidden text-muted md:table-cell"><TimeAgo iso={r.confirmed_at} /></td>}
                                {has("tx") && <td className="hidden xl:table-cell"><Hash value={r.tx_hash} head={8} tail={6} copy={false} /></td>}
                                {has("anchor") && (
                                    <td>
                                        {r.batch_index != null || r.cardano_tx_hash ? (
                                            r.batch_index != null ? (
                                                <Link href={`/anchor/${r.batch_index}`} className="inline-flex items-center gap-2">
                                                    <Status tone="positive">Anchored</Status>
                                                    <span className="num hidden text-muted hover:text-ink sm:inline">#{fmtInt(r.batch_index)}</span>
                                                </Link>
                                            ) : <Status tone="positive">Anchored</Status>
                                        ) : (
                                            <Status tone="warning"><span className="sm:hidden">Waiting</span><span className="hidden sm:inline">Waiting for anchor</span></Status>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
