import { MetricCards } from "@/components/dashboard/metric-cards";
import { NetworkCharts } from "@/components/dashboard/network-charts";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export const revalidate = 0;

export default async function Home() {
  // Fetch ALL records to get accurate totals (handling the 1000 limit)
  let allEvents: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("event_payload_data")
      .select("block_number, tx_hash, timestamp, record_type")
      .order("block_number", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching event_payload_data:", error);
      break;
    }
    if (!data || data.length === 0) break;

    allEvents = [...allEvents, ...data];
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Calculate Metrics
  const totalEvents = allEvents.length;
  const latestBlock = allEvents.length > 0 ? allEvents[0].block_number : 0;

  // Calculate distinctive transactions
  const txHashes = new Set(allEvents.map(e => e.tx_hash).filter(Boolean));
  const totalTransactions = txHashes.size;

  // Process Chart Data: Extract distinct dates from database
  const dateMap = new Map<string, {
    date: string,
    day: string,
    events: number,
    transactions: Set<string>,
    farmer: number,
    agri: number,
    credit: number,
    fullDate: string
  }>();

  allEvents.forEach(event => {
    if (!event.timestamp) return;
    const eventDate = dayjs(event.timestamp);
    const dateStr = eventDate.format('YYYY-MM-DD');

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, {
        date: dateStr,
        day: eventDate.format('MMM DD'),
        events: 0,
        transactions: new Set<string>(),
        farmer: 0,
        agri: 0,
        credit: 0,
        fullDate: eventDate.format('MMM DD, YYYY')
      });
    }

    const dayData = dateMap.get(dateStr)!;
    dayData.events++;
    if (event.tx_hash) {
      dayData.transactions.add(event.tx_hash);
    }

    const type = event.record_type?.toLowerCase() || '';
    if (type.includes('farmer')) dayData.farmer++;
    else if (type.includes('agri')) dayData.agri++;
    else if (type.includes('credit')) dayData.credit++;
  });

  // Sort dates chronologically and take up to the last 7 distinct dates
  const sortedDates = Array.from(dateMap.keys()).sort();
  const last7DistinctDates = sortedDates.slice(-7).map(date => dateMap.get(date)!);

  const transactionChartData = last7DistinctDates.map(d => ({
    day: d.day,
    events: d.events,
    transactions: d.transactions.size,
    fullDate: d.fullDate
  }));

  const distributionChartData = last7DistinctDates.map(d => ({
    day: d.day,
    farmer: d.farmer,
    agri: d.agri,
    credit: d.credit,
    fullDate: d.fullDate
  }));

  const stats = {
    latestBlock,
    totalTransactions,
    totalEvents,
    validators: 5
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 relative">
      <div className="grid-pattern" />

      {/* Hero Section */}
      <section className="mb-12 relative pt-8">
        <div className="absolute -top-20 -left-20 w-96 h-96 glow-blue pointer-events-none opacity-50" />
        <div className="absolute top-10 right-0 w-80 h-80 glow-red pointer-events-none opacity-30" />

        <div className="relative">
          <h1 className="text-6xl md:text-7xl text-heading mb-4 uppercase">
            India<span className="text-white decoration-2">Chain </span>
            EXPLORER
          </h1>
        </div>
      </section>

      {/* Network Stats Cards */}
      <MetricCards stats={stats} />

      {/* Network Charts */}
      <div className="mt-8">
        <NetworkCharts
          transactionData={transactionChartData}
          distributionData={distributionChartData}
        />
      </div>
    </div>
  );
}

