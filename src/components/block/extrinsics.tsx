"use client";
import { Fragment, useState } from "react";
import { CheckCircle2, ChevronRight, Code2, FileText, Hash as HashIcon, User } from "lucide-react";
import type { BlockExtrinsic } from "@/lib/block-data";
import { shortHash } from "@/lib/format";
import { Status } from "@/components/ui/status";
import { Hash } from "@/components/ui/hash";
import { Segmented } from "@/components/ui/segmented";
import { JsonView } from "@/components/ui/json-view";
import { CopyButton } from "@/components/ui/copy-button";
import { Th } from "@/components/ui/th";

/** applicationId -> "application id"; the label style uppercases it */
const words = (k: string) => k.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
const idLike = (v: string) => v.length > 20 || /^0x[0-9a-f]+$/i.test(v);

/** Flattens a call's arguments into key/value rows, keys as paths (transfers[0].amount), as the original's call data table did. */
function rows(v: unknown, key = ""): { k: string; v: string }[] {
    if (v === null || v === undefined) return [{ k: key || "value", v: "—" }];
    if (Array.isArray(v)) return v.length ? v.flatMap((x, i) => rows(x, `${key}[${i}]`)) : [{ k: key, v: "None" }];
    if (typeof v === "object") {
        const e = Object.entries(v as Record<string, unknown>);
        return e.length ? e.flatMap(([k, x]) => rows(x, key ? `${key} · ${words(k)}` : words(k))) : [{ k: key, v: "None" }];
    }
    return [{ k: key || "value", v: String(v) }];
}

/** The original call data viewer: key/value table, or the raw JSON. */
function CallData({ args }: { args: unknown }) {
    const [view, setView] = useState<"table" | "json">("table");
    const list = rows(args);
    return (
        <div className="border-t border-white/[0.06] bg-black/30">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <span className="label inline-flex items-center gap-2"><Code2 className="h-3.5 w-3.5 text-blue-text" aria-hidden />Call data</span>
                <Segmented label="Call data view" size="sm" value={view} onChange={setView} options={[{ value: "table", label: "Table" }, { value: "json", label: "Json" }]} />
            </div>
            {view === "table" ? (
                <dl>
                    {list.map((r, i) => (
                        <div key={i} className="grid grid-cols-1 gap-1.5 border-t border-white/[0.05] px-5 py-3.5 transition-colors duration-150 hover:bg-[rgba(0,24,254,0.05)] sm:px-8 md:min-h-[52px] md:grid-cols-[240px_1fr] md:items-center md:gap-6 md:py-0">
                            <dt className="label">{r.k}</dt>
                            <dd className="flex min-w-0 items-center gap-1 text-[12px]">
                                <span className={`num break-all ${idLike(r.v) ? "text-blue-text" : "text-white/85"}`}>{r.v}</span>
                                {idLike(r.v) && <CopyButton value={r.v} label="Copy value" />}
                            </dd>
                        </div>
                    ))}
                </dl>
            ) : (
                <div className="border-t border-white/[0.05] [&_pre]:!bg-transparent [&_pre]:!px-5 sm:[&_pre]:!px-8"><JsonView data={args} maxHeight={360} /></div>
            )}
        </div>
    );
}

/** A block's extrinsics: one row per call; open a row to read its call data. */
export function Extrinsics({ items }: { items: BlockExtrinsic[] }) {
    const [open, setOpen] = useState<Set<number>>(new Set());
    const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
    return (
        <div className="overflow-x-auto">
            <table className="table">
                <caption className="sr-only">Extrinsics</caption>
                <thead><tr>
                    <th scope="col" className="r w-14">#</th><Th icon={FileText}>Call</Th><Th icon={HashIcon} className="hidden md:table-cell">Hash</Th>
                    <Th icon={User} className="hidden lg:table-cell">Signer</Th><Th icon={CheckCircle2}>Result</Th><th scope="col" className="w-12"><span className="sr-only">Call data</span></th>
                </tr></thead>
                <tbody>
                    {items.map((x) => {
                        const on = open.has(x.index);
                        return (
                            <Fragment key={x.index}>
                                <tr className={on ? "bg-[linear-gradient(90deg,rgba(0,24,254,0.12),transparent_70%)]" : undefined}>
                                    <td className="r text-muted">{x.index}</td>
                                    <td>
                                        <button type="button" onClick={() => toggle(x.index)} aria-expanded={on} aria-controls={`x-${x.index}`}
                                            className="row-link text-left text-[13px] text-white focus-visible:outline-offset-4">
                                            {x.section}.<span className="text-white">{x.method}</span>
                                        </button>
                                    </td>
                                    <td className="hidden md:table-cell"><span className="z inline-flex"><Hash value={x.hash} head={10} tail={8} /></span></td>
                                    <td className="hidden lg:table-cell">{x.signer ? <span className="mono text-white/50" title={x.signer}>{shortHash(x.signer, 8, 6)}</span> : <span className="chip">Inherent</span>}</td>
                                    <td>{x.status === "success" ? <Status tone="positive">Success</Status> : x.status === "failed" ? <Status tone="negative">Failed</Status> : <Status>Unknown</Status>}</td>
                                    <td className="r"><span className="row-go" aria-hidden><ChevronRight className={`h-4 w-4 transition-transform duration-200 ${on ? "rotate-90" : ""}`} /></span></td>
                                </tr>
                                {on && (
                                    <tr id={`x-${x.index}`} className="hover:!bg-transparent [&>td]:!shadow-none">
                                        <td colSpan={6} className="!p-0 whitespace-normal"><CallData args={x.args} /></td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
