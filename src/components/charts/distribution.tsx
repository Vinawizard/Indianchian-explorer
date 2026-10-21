import { SERIES } from "./palette";

type Counts = { farmer: number; agri_record: number; credit_app: number };
const ROWS: { key: keyof Counts; label: string }[] = [
    { key: "farmer", label: "Farmer" },
    { key: "agri_record", label: "Agricultural" },
    { key: "credit_app", label: "Credit" },
];

/** Record distribution: a thin ring (2px surface gaps between segments) with the values labelled beside it. */
export function Distribution({ counts }: { counts: Counts | null }) {
    const total = counts ? counts.farmer + counts.agri_record + counts.credit_app : 0;
    const R = 70, SW = 10, C = 2 * Math.PI * R, GAP = 12;
    let offset = 0;
    return (
        <section className="card flex h-full flex-col" aria-labelledby="rd">
            <div className="card-head">
                <div>
                    <h2 id="rd" className="section-title">Record distribution</h2>
                    <p className="mt-1 pl-[13px] text-[12px] text-white/55">By record type</p>
                </div>
            </div>
            {counts && total > 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-7 sm:flex-row sm:gap-10">
                    <div className="relative shrink-0">
                        <svg width={2 * R + SW + 4} height={2 * R + SW + 4} viewBox={`0 0 ${2 * R + SW + 4} ${2 * R + SW + 4}`} role="img" aria-label="Records by type">
                            <defs><filter id="rd-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                            <g transform={`rotate(-90 ${R + SW / 2 + 2} ${R + SW / 2 + 2})`}>
                                <circle cx={R + SW / 2 + 2} cy={R + SW / 2 + 2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={SW} />
                                {ROWS.map(({ key }) => {
                                    const len = (counts[key] / total) * C;
                                    const seg = Math.max(0, len - GAP);
                                    const el = <circle key={key} cx={R + SW / 2 + 2} cy={R + SW / 2 + 2} r={R} fill="none" stroke={SERIES[key]} strokeWidth={SW} strokeLinecap="round"
                                        strokeDasharray={`${seg} ${C - seg}`} strokeDashoffset={-offset} className="ring-seg" filter="url(#rd-glow)"
                                        style={{ ["--seg" as string]: `${seg}px`, ["--gap" as string]: `${C - seg}px`, ["--c" as string]: `${C}px` }} />;
                                    offset += len;
                                    return el;
                                })}
                            </g>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="num text-[22px] font-semibold tracking-[-0.02em] text-white">{(total / 1e6).toFixed(2)}M</span>
                            <span className="label">Records</span>
                        </div>
                    </div>
                    <ul className="w-full max-w-[280px] space-y-4">
                        {ROWS.map(({ key, label }) => {
                            const v = counts[key];
                            const share = (v / total) * 100;
                            return (
                                <li key={key}>
                                    <div className="flex items-center gap-3">
                                        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[key], boxShadow: `0 0 10px ${SERIES[key]}` }} />
                                        <span className="flex-1 text-[14px] text-white/80">{label}</span>
                                        <span className="num text-[14px] font-medium text-white">{v.toLocaleString("en-US")}</span>
                                        <span className="num w-11 text-right text-[12px] text-white/50">{share < 10 ? share.toFixed(1) : Math.round(share)}%</span>
                                    </div>
                                    <div className="ml-[22px] mt-2 h-[3px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${Math.max(1.5, share)}%`, background: SERIES[key] }} /></div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <p className="label px-6 py-16 text-center">Unavailable</p>
            )}
        </section>
    );
}
