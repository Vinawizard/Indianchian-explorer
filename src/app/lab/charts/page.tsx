import type { Metadata } from "next";
import { getMainnetSummary } from "@/lib/mainnet-records";
import { PageHeader } from "@/components/ui/page-header";
import { Empty } from "@/components/ui/empty";
import { ActivityBars, ActivityLed, ActivityLine, ActivityStep, DistAreas, DistLed, DistRows, DistStacked, Option } from "@/components/charts/chart-lab";

export const revalidate = 300;
export const metadata: Metadata = { title: "Chart options", robots: { index: false, follow: false } };

/** A side-by-side of chart designs for the landing page, on live data (not linked from the site). */
export default async function ChartLab() {
    const daily = (await getMainnetSummary().catch(() => null))?.daily?.slice(-14) ?? [];
    if (!daily.length) return <div className="page"><PageHeader title="Chart options" /><div className="card"><Empty title="No data" /></div></div>;
    const days = daily.map((d) => d.day);
    const totals = daily.map((d) => d.farmer + d.agri_record + d.credit_app);
    return (
        <div className="page">
            <PageHeader crumbs={[{ label: "IndianChain", href: "/" }, { label: "Chart options" }]} title="Chart options"
                meta={<span className="text-[10px] uppercase tracking-[0.1em] text-muted">Same colours, same live data (last 14 days). Hover any chart. Pick one per row.</span>} />

            <h2 className="label mb-4">Network activity</h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Option id="A" name="Stepped area (now)" note="What the landing page shows today: the original stepped line with a blue fill."><ActivityStep days={days} values={totals} /></Option>
                <Option id="B" name="Dot-matrix columns" note="Each day is a column of lit dots on the same 4px grid as the hero figures; unlit dots show the board."><ActivityLed days={days} values={totals} /></Option>
                <Option id="C" name="Bars with a lit cap" note="Square bars fading down from a bright blue cap; the hovered day stays lit, the others dim."><ActivityBars days={days} values={totals} /></Option>
                <Option id="D" name="Smooth line with day markers" note="A calm curve with one marker per day; easiest to read the trend at a glance."><ActivityLine days={days} values={totals} /></Option>
            </div>

            <h2 className="label mb-4 mt-14">Record distribution</h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Option id="A" name="Overlapping curves (now)" note="What the landing page shows today: three smooth areas over each other."><DistAreas data={daily} /></Option>
                <Option id="B" name="Stacked bars" note="Each day's total as one bar, split into farmer, agri and credit; shows the total and the mix together."><DistStacked data={daily} /></Option>
                <Option id="C" name="Dot-matrix stacked columns" note="The stacked bars drawn as lit dots in the three colours, on the hero's 4px grid."><DistLed data={daily} /></Option>
                <Option id="D" name="One row per sector" note="Farmer, agri and credit each get their own row on the same scale, so nothing overlaps."><DistRows data={daily} /></Option>
            </div>
        </div>
    );
}
