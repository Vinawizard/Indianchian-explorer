"use client";

import { use, useState } from "react";
import { Copy, Check, TrendingUp, Users, ArrowRightLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockChartData = [
    { day: "Mon", price: 1.2 }, { day: "Tue", price: 1.4 },
    { day: "Wed", price: 1.1 }, { day: "Thu", price: 1.6 },
    { day: "Fri", price: 1.9 }, { day: "Sat", price: 2.1 },
    { day: "Sun", price: 2.4 },
];

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Token Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
                        IN
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">IndiCoin</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold px-2 py-0.5 bg-muted rounded border border-border text-foreground">IND</span>
                            <div className="flex items-center gap-1 group">
                                <span className="font-mono text-xs text-muted-foreground line-clamp-1 max-w-[120px]">{address}</span>
                                <button onClick={copyToClipboard} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground opacity-0 group-hover:opacity-100">
                                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Price</p>
                        <p className="text-2xl font-bold">$2.43 <span className="text-sm text-emerald-500 font-medium ml-1">+14.2%</span></p>
                    </div>
                    <div className="w-px bg-border my-1" />
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Market Cap</p>
                        <p className="text-2xl font-bold">$1.2B</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart Segment - Utilizing Recharts */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Price History (7d)</h3>
                    </div>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockChartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /> {/* Primary color approx */}
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                                <YAxis hide domain={['dataMin - 0.5', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overview segment */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Token Info</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Holders</span>
                                <span className="font-medium text-sm">45,210</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transfers</span>
                                <span className="font-medium text-sm">1.2M</span>
                            </div>
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-sm text-muted-foreground">Max Total Supply</span>
                                <span className="font-medium text-sm">1,000,000,000 IND</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-4 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20">
                        Trade on DEX
                    </button>
                </div>
            </div>

            {/* Sub Tabs for Transfers / Holders */}
            <div className="text-center mt-8 text-sm text-muted-foreground bg-card p-8 border border-border shadow-sm rounded-xl">
                Advanced token transfer history and top holders list will be implemented here.
            </div>
        </div>
    );
}
