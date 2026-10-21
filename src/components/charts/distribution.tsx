import { SERIES } from "./palette";

type Counts = { farmer: number; agri_record: number; credit_app: number };
const ROWS: { key: keyof Counts; label: string }[] = [
    { key: "farmer", label: "Farmer" },
    { key: "agri_record", label: "Agricultural" },
    { key: "credit_app", label: "Credit" },
];

/** Records on chain by type: one bar per type on a shared scale, value and share labelled directly. */
export function Distribution({ counts }: { counts: Counts | null }) {
    const total = counts ? counts.farmer + counts.agri_record + counts.credit_app : 0;
    const max = counts ? Math.max(counts.farmer, counts.agri_record, counts.credit_app) : 0;
    return (
        <div className="card flex h-full flex-col">
            <div className="card-head">
                <div>
                    <h2 className="section-title">Record distribution</h2>
                    <p className="mt-1.5 pl-[15px] text-[13px] text-faint"><span className="num text-white">{total.toLocaleString("en-US")}</span> records</p>
                </div>
            </div>
            {counts ? (
                <ul className="flex flex-1 flex-col justify-center gap-8 px-6 py-8">
                    {ROWS.map(({ key, label }) => {
                        const v = counts[key];
                        const share = total ? (v / total) * 100 : 0;
                        return (
                            <li key={key}>
                                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                                    <span className="flex items-center gap-2.5 text-[13px] text-white/90">
                                        <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: SERIES[key] }} />
                                        {label}
                                    </span>
                                    <span className="num text-[13px] text-white">
                                        {v.toLocaleString("en-US")}
                                        <span className="ml-2 inline-block w-12 text-right text-faint">{share < 1 ? share.toFixed(1) : Math.round(share)}%</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/[0.04]">
                                    <div className="h-full rounded-r-[4px]" style={{ width: `${max ? Math.max(0.6, (v / max) * 100) : 0}%`, background: SERIES[key] }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="px-6 py-16 text-center text-[13px] text-faint">Unavailable</p>
            )}
        </div>
    );
}
