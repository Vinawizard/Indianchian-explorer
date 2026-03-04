"use client";

import { motion, Variants } from "framer-motion";
import { Box, Activity, Zap, Shield } from "lucide-react";

interface MetricStats {
    latestBlock: number;
    totalTransactions: number;
    totalEvents: number;
    validators: number;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } },
};

export function MetricCards({ stats }: { stats: MetricStats }) {
    const cards = [
        {
            label: "Latest Block",
            value: stats.latestBlock,
            icon: Box,
            accent: "#06b6d4",
            glow: "rgba(6,182,212,0.15)",
            border: "rgba(6,182,212,0.25)",
            sub: "Live Height",
        },
        {
            label: "Total Transactions",
            value: stats.totalTransactions.toLocaleString(),
            icon: Activity,
            accent: "#22c55e",
            glow: "rgba(34,197,94,0.15)",
            border: "rgba(34,197,94,0.25)",
            sub: "Cumulative",
        },
        {
            label: "Total Events",
            value: stats.totalEvents.toLocaleString(),
            icon: Zap,
            accent: "#f59e0b",
            glow: "rgba(245,158,11,0.15)",
            border: "rgba(245,158,11,0.25)",
            sub: "All event types",
        },
        {
            label: "Validators",
            value: stats.validators,
            icon: Shield,
            accent: "#a855f7",
            glow: "rgba(168,85,247,0.15)",
            border: "rgba(168,85,247,0.25)",
            sub: "Active nodes",
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {cards.map((card, i) => (
                <motion.div
                    key={i}
                    variants={item}
                    whileHover={{ y: -5 }}
                    className="card-premium relative group cursor-default"
                >
                    <div className="relative h-full p-6 flex flex-col gap-5">
                        {/* Glow blob */}
                        <div
                            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                            style={{ background: card.accent }}
                        />

                        {/* Icon */}
                        <div
                            className="w-12 h-12 rounded-none flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10"
                        >
                            <card.icon className="w-6 h-6" style={{ color: card.accent }} />
                        </div>

                        {/* Text */}
                        <div>
                            <p className="text-[10px] text-heading text-muted-foreground uppercase tracking-widest mb-2">{card.label}</p>
                            <h3 className="text-3xl font-bold tracking-tight text-white mb-1">{card.value}</h3>
                            <div className="flex items-center gap-2">
                                <span className="h-0.5 w-3 bg-accent"></span>
                                <p className="text-[10px] uppercase font-mono tracking-tighter" style={{ color: card.accent }}>{card.sub}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
