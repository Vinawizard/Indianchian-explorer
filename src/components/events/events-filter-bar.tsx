"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const selectClass = "w-full appearance-none bg-black border border-white/10 text-[10px] text-white rounded-none px-4 py-3 focus:outline-none focus:border-accent cursor-pointer transition-colors hover:border-white/20 uppercase tracking-widest";
const inputClass = "w-full bg-black border border-white/10 text-[10px] text-white rounded-none px-4 py-3 focus:outline-none focus:border-accent placeholder:text-muted-foreground/40 transition-colors hover:border-white/20 uppercase tracking-widest";
const labelClass = "text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1 font-mono";

const ChevronIcon = () => (
    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
        <svg className="w-3 h-3 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

export function EventsFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [chain, setChain] = useState("");
    const [recordType, setRecordType] = useState("");
    const [status, setStatus] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    // Sync state with URL
    useEffect(() => {
        setChain(searchParams.get("chain") || "");
        setRecordType(searchParams.get("record_type") || "");
        setStatus(searchParams.get("status") || "");
        setStart(searchParams.get("start") || "");
        setEnd(searchParams.get("end") || "");
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (chain) params.set("chain", chain);
        if (recordType) params.set("record_type", recordType);
        if (status) params.set("status", status);
        if (start) params.set("start", start);
        if (end) params.set("end", end);

        router.push(`/events?${params.toString()}`);
    };

    const handleReset = () => {
        setChain("");
        setRecordType("");
        setStatus("");
        setStart("");
        setEnd("");
        router.push("/events");
    };

    return (
        <div className="flex flex-col md:flex-row flex-wrap items-end gap-6 mb-12 mt-10 w-full relative z-10">
            {/* Chain */}
            <div className="flex flex-col w-full md:w-52">
                <label className={labelClass}>Operational Chain</label>
                <div className="relative">
                    <select value={chain} onChange={(e) => setChain(e.target.value)} className={selectClass}>
                        <option value="">ALL_CHAINS</option>
                        <option value="indiachain">INDIANCHAIN</option>
                    </select>
                    <ChevronIcon />
                </div>
            </div>

            {/* Record Type */}
            <div className="flex flex-col w-full md:w-52">
                <label className={labelClass}>Record Sector</label>
                <div className="relative">
                    <select value={recordType} onChange={(e) => setRecordType(e.target.value)} className={selectClass}>
                        <option value="">ALL_RECORDS</option>
                        <option value="farmer">FARMER</option>
                        <option value="agri_record">AGRI_RECORD</option>
                        <option value="credit_app">CREDIT_APP</option>
                    </select>
                    <ChevronIcon />
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-col w-full md:w-52">
                <label className={labelClass}>Current Status</label>
                <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                        <option value="">ALL_STATUS</option>
                        <option value="confirmed">CONFIRMED</option>

                    </select>
                    <ChevronIcon />
                </div>
            </div>

            {/* Start Block */}
            <div className="flex flex-col flex-1 min-w-[120px]">
                <label className={labelClass}>Block Start</label>
                <input
                    type="number"
                    placeholder="000,000"
                    className={inputClass}
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />
            </div>

            {/* End Block */}
            <div className="flex flex-col flex-1 min-w-[120px]">
                <label className={labelClass}>Block End</label>
                <input
                    type="number"
                    placeholder="999,999"
                    className={inputClass}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 ml-auto lg:ml-0 h-[43px]">
                <button
                    onClick={handleReset}
                    className="px-6 py-2.5 text-[10px] font-heading text-muted-foreground hover:text-white uppercase tracking-widest transition-colors"
                >
                    RESET
                </button>
                <button
                    onClick={handleFilter}
                    className="px-8 py-2.5 text-[10px] font-heading bg-accent text-white uppercase tracking-[0.2em] transition-all hover:bg-accent/80 active:scale-95"
                >
                    INIT_FILTER
                </button>
            </div>
        </div>
    );
}
