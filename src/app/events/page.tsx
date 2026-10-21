import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getMainnetSummary, queryMainnetRecords, type MainnetRecordRow } from "@/lib/mainnet-records";
import { supabase } from "@/lib/supabase";
import { SUPABASE_CHAIN } from "@/lib/network";
import { CARDANO_PROOF_OR_FILTER } from "@/lib/cardano-proof";
import { fmtInt, shortId } from "@/lib/format";
import { PageHeader, StatBox } from "@/components/ui/page-header";
import { RecordsTable } from "@/components/records/records-table";
import { Empty } from "@/components/ui/empty";
import { Hash } from "@/components/ui/hash";
import { DotNum } from "@/components/ui/dot-num";

export const revalidate = 0;
export const maxDuration = 60;
export const metadata: Metadata = { title: "Events" };

const PAGE = 50;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const int = (v: string) => (/^\d+$/.test(v) ? parseInt(v, 10) : null);

async function previewRows(f: { type: string; start: number | null; end: number | null }): Promise<MainnetRecordRow[]> {
    let q = supabase.from("event_payload_data")
        .select("payload_id, block_number, submission_status, chain, record_type, type, tx_hash, block_hash, signer_address, tx_fee, tx_index, timestamp, confirmed_at, entity_id, farmer_id, record_id, version, payload_hash, merkle_root, cardano_tx_hash")
        .eq("chain", SUPABASE_CHAIN.preview).or(CARDANO_PROOF_OR_FILTER);
    if (f.type) q = q.eq("record_type", f.type);
    if (f.start != null) q = q.gte("block_number", f.start);
    if (f.end != null) q = q.lte("block_number", f.end);
    const { data } = await q.order("block_number", { ascending: false }).range(0, PAGE - 1);
    return (data ?? []) as MainnetRecordRow[];
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const type = one(sp.type) || one(sp.record_type);
    const status = one(sp.status);
    const farmer = one(sp.farmer).trim().toLowerCase();
    let start = int(one(sp.start)), end = int(one(sp.end));
    if (start != null && end != null && start > end) [start, end] = [end, start];
    const before = one(sp.before);
    const filtered = !!(type || status || start != null || end != null || farmer);

    let rows: MainnetRecordRow[] = [];
    let total = -1, blocks = -1;
    let failed = false;
    if (network === "mainnet") {
        try {
            const r = await queryMainnetRecords({
                record_type: type || undefined, status: status || undefined, minBlock: start, maxBlock: end,
                farmer: farmer || undefined, before: before || undefined, limit: farmer ? 300 : PAGE, noCount: !filtered,
            });
            rows = r.rows; total = r.total;
            if (!filtered) {
                const s = await getMainnetSummary();
                total = s.totalEvents || (s.ledgerTotal ?? -1);
                blocks = s.totalBlocks || -1;
            }
        } catch { failed = true; }
    } else {
        try { rows = await previewRows({ type, start, end }); } catch { failed = true; }
    }

    const last = rows[rows.length - 1];
    const next = !farmer && rows.length === PAGE && last?.record_id ? `${last.block_number}:${last.record_id}:${last.version ?? 1}` : null;
    const keep = (extra: Record<string, string | null>) => {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries({ type, status, start: start?.toString() ?? "", end: end?.toString() ?? "", farmer, ...extra })) if (v) p.set(k, v);
        const s = p.toString();
        return s ? `/events?${s}` : "/events";
    };

    if (farmer) return <FarmerTrace farmer={farmer} rows={rows} failed={failed} />;

    const lbl = "mb-1 text-[10px] uppercase tracking-[0.2em] text-muted";
    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Network events" }]}
                title="Data events"
                actions={total >= 0 ? (
                    <StatBox label={filtered ? "Matching" : "Network activity"}
                        items={filtered ? [{ value: fmtInt(total), unit: "Events" }] : [{ value: fmtInt(total), unit: "Events" }, ...(blocks > 0 ? [{ value: fmtInt(blocks), unit: "Blocks" }] : [])]} />
                ) : undefined}
            />

            {!filtered && !before && total > PAGE && (
                <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-muted">
                    Showing the latest {PAGE} of {fmtInt(total)} events — use the block range or filters to see others
                </p>
            )}

            {/* the original filter bar */}
            <form method="get" action="/events" className="mb-12 mt-10 flex w-full flex-col flex-wrap items-stretch gap-6 md:flex-row md:items-end">
                <label className="flex w-full flex-col md:w-52">
                    <span className={lbl}>Record sector</span>
                    <select name="type" defaultValue={type} className="field">
                        <option value="">ALL_RECORDS</option>
                        <option value="farmer">FARMER</option>
                        <option value="agri_record">AGRI_RECORD</option>
                        <option value="credit_app">CREDIT_APP</option>
                    </select>
                </label>
                <label className="flex w-full flex-col md:w-52">
                    <span className={lbl}>Current status</span>
                    <select name="status" defaultValue={status} className="field">
                        <option value="">ALL_STATUS</option>
                        <option value="anchored">ANCHORED (ON CARDANO)</option>
                        <option value="confirmed">PENDING ANCHOR</option>
                    </select>
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col">
                    <span className={lbl}>Block start</span>
                    <input name="start" inputMode="numeric" pattern="[0-9]*" defaultValue={start ?? ""} placeholder="000,000" autoComplete="off" className="field num" />
                </label>
                <label className="flex min-w-[120px] flex-1 flex-col">
                    <span className={lbl}>Block end</span>
                    <input name="end" inputMode="numeric" pattern="[0-9]*" defaultValue={end ?? ""} placeholder="999,999" autoComplete="off" className="field num" />
                </label>
                <label className="flex min-w-[200px] flex-[1.4] flex-col">
                    <span className={lbl}>Farmer ID</span>
                    <input name="farmer" defaultValue="" placeholder="Farmer UUID…" spellCheck={false} autoComplete="off" className="field" />
                </label>
                <div className="flex h-[43px] items-center gap-3 md:ml-auto lg:ml-0">
                    <Link href="/events" className="btn btn-text !px-5">Reset</Link>
                    <button type="submit" className="btn btn-blue !h-[43px] !px-8">Init_filter</button>
                </div>
            </form>

            <section className="card" aria-label="Events">
                {failed ? (
                    <Empty title="Could not load events" action={<Link href={keep({})} className="btn">Retry</Link>} />
                ) : rows.length === 0 ? (
                    <Empty title="No_data_available" action={filtered ? <Link href="/events" className="btn">Reset filters</Link> : undefined} />
                ) : (
                    <RecordsTable rows={rows} caption="Events" />
                )}
            </section>

            {rows.length > 0 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">
                        Feed_segment <span className="num text-white">#{rows[0].block_number}–#{last!.block_number}</span>
                        {total >= 0 && <> / <span className="num text-white">{fmtInt(total)}</span> events</>}
                    </p>
                    <div className="flex items-center gap-2">
                        {before ? <Link href={keep({ before: null })} className="btn !px-4"><ChevronLeft className="h-4 w-4" aria-hidden />Newest</Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled><ChevronLeft className="h-4 w-4" aria-hidden />Newest</span>}
                        {next ? <Link href={keep({ before: next })} className="btn !px-4">Older<ChevronRight className="h-4 w-4" aria-hidden /></Link>
                            : <span className="btn pointer-events-none !px-4 opacity-30" aria-disabled>Older<ChevronRight className="h-4 w-4" aria-hidden /></span>}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Everything one farmer has on chain: the farmer record's versions and its agricultural and credit records. */
function FarmerTrace({ farmer, rows, failed }: { farmer: string; rows: MainnetRecordRow[]; failed: boolean }) {
    const count = (t: string) => rows.filter((r) => r.record_type === t).length;
    const distinct = (t: string) => new Set(rows.filter((r) => r.record_type === t).map((r) => r.record_id)).size;
    const anchored = rows.filter((r) => r.batch_index != null || r.cardano_tx_hash).length;
    const order: Record<string, number> = { farmer: 0, agri_record: 1, credit_app: 2 };
    const sorted = [...rows].sort((a, b) => (order[a.record_type] ?? 9) - (order[b.record_type] ?? 9) || (a.record_id ?? "").localeCompare(b.record_id ?? "") || (a.version ?? 0) - (b.version ?? 0));
    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Network events", href: "/events" }, { label: `Farmer ${shortId(farmer)}` }]}
                title="Farmer trace"
                meta={<Hash value={farmer} full />}
                actions={<Link href={`/record/${farmer}`} className="btn">Farmer record<ChevronRight className="h-4 w-4" aria-hidden /></Link>}
            />
            <section className="panel mb-10 grid grid-cols-2 overflow-hidden md:grid-cols-4 [&>*+*]:border-l [&>*]:border-white/10">
                {[
                    ["Farmer versions", count("farmer")],
                    ["Agricultural", distinct("agri_record")],
                    ["Credit", distinct("credit_app")],
                    ["Anchored", anchored],
                ].map(([l, v]) => (
                    <div key={l as string} className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                        <DotNum value={fmtInt(v as number)} />
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/70">{l}</div>
                    </div>
                ))}
            </section>
            <section className="card" aria-label="Farmer events">
                {failed ? <Empty title="Events could not be loaded" />
                    : rows.length === 0 ? <Empty title="No events on chain yet" />
                    : <RecordsTable rows={sorted} cols={["block", "event", "sector", "version", "time", "anchor"]} caption={`Events of farmer ${farmer}`} />}
            </section>
            {rows.length >= 300 && <p className="label mt-4">First 300 versions</p>}
        </div>
    );
}
