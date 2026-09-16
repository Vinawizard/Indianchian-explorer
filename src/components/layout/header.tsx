"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Layers, Activity, Zap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "./search-bar";
import { NetworkSwitcher } from "./network-switcher";
import { useState } from "react";

const NAV_ITEMS = [
    { label: "Home", href: "/", icon: Activity },
    { label: "Events", href: "/events", icon: Layers }, { label: "Anchors", href: "/anchors", icon: Layers },
];

export function Header() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${mobileOpen
                    ? "bg-black border-b border-white/10 h-20"
                    : "border-b border-white/5 bg-black/80 backdrop-blur-xl h-20"
                }`}>
                <div className="container mx-auto px-4 lg:px-8 h-full flex items-center justify-between gap-4">

                    {/* Logo / Brand - always visible or specific mobile version */}
                    <div className="flex items-center gap-4 flex-1 lg:flex-none">
                        <Link href="/" className="flex flex-shrink-0 items-center gap-3 group" onClick={() => setMobileOpen(false)}>
                            <Image
                                src="/trivolve-logo.png"
                                alt="Trivolve Tech Logo"
                                width={160}
                                height={40}
                                className={`${mobileOpen ? 'h-7 md:h-8' : 'h-8 md:h-10'} w-auto object-contain transition-all`}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation (lg and above) */}
                    {!mobileOpen && (
                        <nav className="hidden lg:flex items-center gap-2">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative px-6 py-2 text-[10px] text-heading uppercase tracking-widest transition-all z-10 flex items-center gap-2 ${isActive ? "text-white" : "text-muted-foreground hover:text-white"
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="header-active-tab"
                                                className="absolute inset-0 bg-white/5 border-b-2 border-accent z-[-1]"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    )}

                    {/* Search Bar — visible from 768px inline in the header (Desktop) */}
                    {!mobileOpen && (
                        <div className="flex-1 max-w-md hidden lg:block">
                            <SearchBar />
                        </div>
                    )}

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        <NetworkSwitcher className="hidden lg:flex" />
                        {/* Hamburger/Close — visible below lg */}
                        <button
                            className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-none border transition-all ${mobileOpen
                                    ? "border-white/20 bg-white/10 text-white"
                                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20"
                                }`}
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Legacy Mobile Search — Remove this as we integrated it above */}
                {/* <div className="md:hidden border-t border-border/50 p-3 bg-card/30">
                    <SearchBar />
                </div> */}
            </header>

            {/* Mobile Slide-down Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 top-20 z-40 lg:hidden bg-black"
                    >
                        <nav className="container mx-auto px-6 py-8 flex flex-col gap-6">
                            {/* Search and Network inside mobile menu */}
                            <div className="flex flex-col gap-4 mb-2">
                                <div className="w-full">
                                    <NetworkSwitcher className="w-full" />
                                </div>
                                <SearchBar />
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-4 px-5 py-4 border-l-2 text-xs font-mono uppercase tracking-widest transition-all ${isActive
                                            ? "bg-white/5 border-accent text-white"
                                            : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white hover:border-white/20"
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
