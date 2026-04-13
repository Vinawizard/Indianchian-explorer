import dayjs from "dayjs";

export type ChartEventRow = {
    timestamp: string | null;
    tx_hash: string | null;
    record_type: string | null;
};

export type TransactionChartPoint = {
    day: string;
    events: number;
    transactions: number;
    fullDate: string;
    dateKey: string;
};

export type DistributionChartPoint = {
    day: string;
    farmer: number;
    agri: number;
    credit: number;
    fullDate: string;
    dateKey: string;
};

type DayAgg = {
    date: string;
    day: string;
    events: number;
    transactions: Set<string>;
    farmer: number;
    agri: number;
    credit: number;
    fullDate: string;
};

export function buildChartSeries(
    rows: ChartEventRow[],
    maxDistinctDays: number
): {
    transactionChartData: TransactionChartPoint[];
    distributionChartData: DistributionChartPoint[];
} {
    const dateMap = new Map<string, DayAgg>();

    for (const event of rows) {
        if (!event.timestamp) continue;
        const eventDate = dayjs(event.timestamp);
        const dateStr = eventDate.format("YYYY-MM-DD");

        if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
                date: dateStr,
                day: eventDate.format("MMM DD"),
                events: 0,
                transactions: new Set<string>(),
                farmer: 0,
                agri: 0,
                credit: 0,
                fullDate: eventDate.format("MMM DD, YYYY"),
            });
        }

        const dayData = dateMap.get(dateStr)!;
        dayData.events++;
        if (event.tx_hash) dayData.transactions.add(event.tx_hash);

        const type = event.record_type?.toLowerCase() || "";
        if (type.includes("farmer")) dayData.farmer++;
        else if (type.includes("agri")) dayData.agri++;
        else if (type.includes("credit")) dayData.credit++;
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const slice = sortedDates.slice(-maxDistinctDays);

    const transactionChartData: TransactionChartPoint[] = slice.map((d) => {
        const x = dateMap.get(d)!;
        return {
            day: x.day,
            events: x.events,
            transactions: x.transactions.size,
            fullDate: x.fullDate,
            dateKey: x.date,
        };
    });

    const distributionChartData: DistributionChartPoint[] = slice.map((d) => {
        const x = dateMap.get(d)!;
        return {
            day: x.day,
            farmer: x.farmer,
            agri: x.agri,
            credit: x.credit,
            fullDate: x.fullDate,
            dateKey: x.date,
        };
    });

    return { transactionChartData, distributionChartData };
}
