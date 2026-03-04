"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface TransactionDataPoint {
    day: string;
    events: number;
    transactions: number;
    fullDate: string;
}

interface DistributionDataPoint {
    day: string;
    farmer: number;
    agri: number;
    credit: number;
    fullDate: string;
}

const CustomTxTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black border border-white/20 p-4 rounded-none shadow-2xl text-[10px] flex flex-col gap-2 uppercase tracking-widest">
                <p className="font-heading text-white mb-1 border-b border-white/10 pb-1">{data.fullDate}</p>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground whitespace-nowrap">Events:</span>
                    <span className="text-white font-bold">{data.events.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground whitespace-nowrap">Txns:</span>
                    <span className="text-accent font-bold">{data.transactions.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomDistTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black border border-white/20 p-4 rounded-none shadow-2xl text-[10px] flex flex-col gap-2 uppercase tracking-widest">
                <p className="font-heading text-white mb-1 border-b border-white/10 pb-1">{data.fullDate}</p>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Farmer:</span>
                    <span className="text-white font-bold">{data.farmer.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Agri:</span>
                    <span className="text-accent font-bold">{data.agri.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Credit:</span>
                    <span className="text-destructive font-bold">{data.credit.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

export function NetworkCharts({ transactionData, distributionData }: { transactionData: TransactionDataPoint[], distributionData: DistributionDataPoint[] }) {
    const [timeRangeLeft, setTimeRangeLeft] = useState("1W");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Transactions & Events Chart */}
            <div className="card-premium p-8 relative group">
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h2 className="text-heading text-white text-xl uppercase tracking-tighter">Network Activity</h2>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-[0.2em]">
                            Global Transactions & Protocol Events
                        </p>
                    </div>
                    <div className="flex bg-white/5 p-1 border border-white/10">
                        {["1D", "1W", "1M"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRangeLeft(range)}
                                className={`px-4 py-1.5 text-[10px] font-heading uppercase tracking-widest transition-all ${timeRangeLeft === range
                                    ? "bg-white text-black"
                                    : "text-muted-foreground hover:text-white"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[320px] w-full mt-4 text-[9px] font-mono tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={transactionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                            <defs>
                                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTxns" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0018fe" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0018fe" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={true} />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tickMargin={15} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="rgba(0,24,254,0.5)" axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTxTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                            <Area yAxisId="left" type="stepAfter" dataKey="events" stroke="#ffffff" strokeWidth={1} fillOpacity={1} fill="url(#colorEvents)" name="Events" />
                            <Area yAxisId="right" type="stepAfter" dataKey="transactions" stroke="#0018fe" strokeWidth={2} fillOpacity={1} fill="url(#colorTxns)" name="Txns" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Record Type Distribution Chart */}
            <div className="card-premium p-8 relative group">
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h2 className="text-heading text-white text-xl uppercase tracking-tighter">Record Distribution</h2>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-[0.2em]">
                            Sector-specific data visualization
                        </p>
                    </div>
                </div>
                <div className="h-[320px] w-full mt-4 text-[9px] font-mono tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={distributionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                            <defs>
                                <linearGradient id="colorFarmer" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAgri" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0018fe" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0018fe" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff0000" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#ff0000" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={true} />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tickMargin={15} axisLine={false} tickLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomDistTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="farmer" stroke="#ffffff" strokeWidth={1} fillOpacity={1} fill="url(#colorFarmer)" name="Farmer" />
                            <Area type="monotone" dataKey="agri" stroke="#0018fe" strokeWidth={2} fillOpacity={1} fill="url(#colorAgri)" name="Agri" />
                            <Area type="monotone" dataKey="credit" stroke="#ff0000" strokeWidth={1} fillOpacity={1} fill="url(#colorCredit)" name="Credit" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
