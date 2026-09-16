import Link from "next/link";
import { getMainnetAnchorBatches } from "@/lib/mainnet-anchors";
import { resolveNetworkFromCookies } from "@/lib/network-server";
export const revalidate = 0;
const short = (h: string | null, n = 12) => (h ? `${h.slice(0, n)}…${h.slice(-6)}` : "—");
export default async function AnchorsPage() {
    const network = await resolveNetworkFromCookies();
    const batches = network === "mainnet" ? await getMainnetAnchorBatches() : [];
    const confirmed = batches.filter((b) => b.submission_status === "CONFIRMED");
    const records = confirmed.reduce((s, b) => s + (b.record_count ?? 0), 0);
    return (
        <div className="min-h-screen bg-black relative py-8 w-full overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
            <div className="max-w-[1280px] w-[90%] mx-auto pb-24 relative z-10">
                <div className="flex flex-wrap items-center gap-3 text-sm font-heading mb-8 uppercase tracking-widest">
                    <Link href="/" className="text-muted-foreground hover:text-white transition-colors">INDIANCHAIN</Link>
                    <span className="text-white/20">/</span><span className="text-accent font-bold">CARDANO ANCHORS</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div><h1 className="text-4xl font-heading text-white uppercase">Cardano Anchors</h1>
                        <p className="text-[11px] font-heading text-muted-foreground uppercase tracking-widest mt-2">Merkle batches of 100 IndianChain records settled on Cardano L1 · metadata label 1804</p></div>
                    <div className="card-premium px-6 py-4 flex gap-8">
                        {[["BATCHES", confirmed.length], ["RECORDS ANCHORED", records], ["ADA LOCKED", confirmed.length * 2]].map(([l, v]) => (
                            <div key={String(l)}><div className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest">{l}</div>
                                <div className="text-2xl font-heading text-white">{v}</div></div>))}
                    </div>
                </div>
                {network !== "mainnet" ? (
                    <div className="card-premium px-8 py-16 text-center text-sm font-heading text-muted-foreground uppercase tracking-widest">Anchor batches are shown for MAINNET — switch network in the header. Preview anchors appear in the Events log.</div>
                ) : batches.length === 0 ? (
                    <div className="card-premium px-8 py-16 text-center text-sm font-heading text-muted-foreground uppercase tracking-widest">NO_ANCHORS_YET</div>
                ) : (
                    <div className="card-premium overflow-x-auto">
                        <table className="w-full text-left text-[12px] font-mono">
                            <thead><tr className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest border-b border-white/10">
                                {["Batch", "Records", "Merkle root", "L2 blocks", "Cardano tx", "Status", "Confirmed"].map((h) => <th key={h} className="px-5 py-4">{h}</th>)}</tr></thead>
                            <tbody>{batches.map((b) => (
                                <tr key={b.batch_index} className="border-b border-white/5 hover:bg-white/[0.03]">
                                    <td className="px-5 py-3 text-white font-heading">#{b.batch_index}</td>
                                    <td className="px-5 py-3">{b.record_count}</td>
                                    <td className="px-5 py-3 text-white/80" title={b.merkle_root}>{short(b.merkle_root, 14)}</td>
                                    <td className="px-5 py-3 text-white/60">{b.l2_from_block ?? "—"} → {b.l2_to_block ?? "—"}</td>
                                    <td className="px-5 py-3">{b.cardano_tx_hash ? <a href={b.cardanoscan_url ?? `https://cardanoscan.io/transaction/${b.cardano_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-[#4d9fff] hover:text-white" title={b.cardano_tx_hash}>{short(b.cardano_tx_hash, 14)}</a> : "—"}</td>
                                    <td className="px-5 py-3"><span className={`px-2 py-0.5 text-[10px] font-heading uppercase tracking-widest ${b.submission_status === "CONFIRMED" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>{b.submission_status}</span></td>
                                    <td className="px-5 py-3 text-white/60">{b.confirmed_at ? new Date(b.confirmed_at).toUTCString().replace(" GMT", " UTC") : "—"}</td>
                                </tr>))}</tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
