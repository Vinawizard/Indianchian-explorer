import Link from "next/link";
import type { Metadata } from "next";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { getMainnetSummary, queryMainnetRecords, type MainnetRecordRow } from "@/lib/mainnet-records";
import { supabase } from "@/lib/supabase";
import { SUPABASE_CHAIN } from "@/lib/network";
import { CARDANO_PROOF_OR_FILTER } from "@/lib/cardano-proof";
import { fmtInt, shortId } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { RecordsTable } from "@/components/records/records-table";
import { Empty } from "@/components/ui/empty";
import { Hash } from "@/components/ui/hash";

export const revalidate = 0;
export const maxDuration = 60;
export const metadata: Metadata = { title: "Records" };

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

export default async function RecordsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const network = await resolveNetworkFromCookies();
    const type = one(sp.type) || one(sp.record_type);
    const status = one(sp.status);
    const farmer = one(sp.farmer).toLowerCase();
    let start = int(one(sp.start)), end = int(one(sp.end));
    if (start != null && end != null && start > end) [start, end] = [end, start];
    const before = one(sp.before);
    const filtered = !!(type || status || start != null || end != null || farmer);

    let rows: MainnetRecordRow[] = [];
    let total = -1;
    let failed = false;
    if (network === "mainnet") {
        try {
            const r = await queryMainnetRecords({
                record_type: type || undefined, status: status || undefined, minBlock: start, maxBlock: end,
                farmer: farmer || undefined, before: before || undefined, limit: farmer ? 300 : PAGE, noCount: !filtered,
            });
            rows = r.rows; total = r.total;
            if (!filtered) total = (await getMainnetSummary()).ledgerTotal ?? -1;
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
        return s ? `/records?${s}` : "/records";
    };

    if (farmer) return <FarmerTrace farmer={farmer} rows={rows} failed={failed} />;

    return (
        <div className="page">
            <PageHeader
                crumbs={[{ label: "IndianChain", href: "/" }, { label: "Records" }]}
                title="Records"
                actions={total >= 0 ? (
                    <div className="glass rounded-[14px] px-5 py-3 text-right">
                        <p className="label">{filtered ? "Matching" : "On chain"}</p>
                        <p className="num mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{fmtInt(total)}</p>
                    </div>
                ) : undefined}
            />

            <form method="get" action="/records" className="mb-8 grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-[1fr_1fr_160px_160px_auto]">
                <label className="label flex flex-col gap-2">
                    Record type
                    <select name="type" defaultValue={type} className="field">
                        <option value="">All types</option>
                        <option value="farmer">Farmer</option>
                        <option value="agri_record">Agricultural record</option>
                        <option value="credit_app">Credit application</option>
                    </select>
                </label>
                <label className="label flex flex-col gap-2">
                    Cardano anchor
                    <select name="status" defaultValue={status} className="field">
                        <option value="">Any</option>
                        <option value="anchored">Anchored</option>
                        <option value="confirmed">Pending</option>
                    </select>
                </label>
                <label className="label flex flex-col gap-2">
                    From block
                    <input name="start" inputMode="numeric" pattern="[0-9]*" defaultValue={start ?? ""} placeholder="0" className="field num" />
                </label>
                <label className="label flex flex-col gap-2">
                    To block
                    <input name="end" inputMode="numeric" pattern="[0-9]*" defaultValue={end ?? ""} placeholder="Latest" className="field num" />
                </label>
                <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
                    <button type="submit" className="btn btn-blue !h-[42px]">Apply</button>
                    {filtered && <Link href="/records" className="btn !h-[42px]">Reset</Link>}
                </div>
            </form>

            <section className="card" aria-label="Records">
                {failed ? (
                    <Empty title="Could not load records" action={<Link href={keep({})} className="btn">Retry</Link>} />
                ) : rows.length === 0 ? (
                    <Empty title="No records found" action={filtered ? <Link href="/records" className="btn">Reset filters</Link> : undefined} />
                ) : (
                    <RecordsTable rows={rows} caption="Records" />
                )}
                {(before || next) && (
                    <div className="flex items-center justify-between border-t border-line px-6 py-4">
                        {before ? <Link href={keep({ before: null })} className="btn">Newest</Link> : <span />}
                        {next ? <Link href={keep({ before: next })} className="btn">Older</Link> : <span className="label">End</span>}
                    </div>
                )}
            </section>
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
                crumbs={[{ label: "Records", href: "/records" }, { label: `Farmer ${shortId(farmer)}` }]}
                title="Farmer trace"
                meta={<Hash value={farmer} full />}
                actions={<Link href={`/record/${farmer}`} className="btn">Farmer record</Link>}
            />
            <section className="wash-x mb-8 grid grid-cols-2 border border-white/10 md:grid-cols-4 [&>*+*]:border-l [&>*]:border-white/10">
                {[
                    ["Farmer versions", count("farmer")],
                    ["Agricultural", distinct("agri_record")],
                    ["Credit", distinct("credit_app")],
                    ["Anchored", anchored],
                ].map(([l, v]) => (
                    <div key={l as string} className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                        <div className="t-figure !text-[28px] text-white">{fmtInt(v as number)}</div>
                        <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/80">{l}</div>
                    </div>
                ))}
            </section>
            <section className="card" aria-label="Farmer records">
                {failed ? <Empty title="Records could not be loaded" />
                    : rows.length === 0 ? <Empty title="No records on chain yet" />
                    : <RecordsTable rows={sorted} cols={["record", "version", "block", "time", "anchor"]} caption={`Records of farmer ${farmer}`} />}
            </section>
            {rows.length >= 300 && <p className="label mt-3">First 300 versions</p>}
        </div>
    );
}
