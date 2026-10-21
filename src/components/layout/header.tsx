"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, Box, Layers, Menu, X } from "lucide-react";
import { CardanoIcon } from "@/components/ui/cardano-icon";
import { SearchBar } from "./search-bar";
import { NetworkSwitcher } from "./network-switcher";

const NAV = [
    { href: "/", label: "Home", icon: Activity, match: (p: string) => p === "/" },
    { href: "/events", label: "Events", icon: Layers, match: (p: string) => p.startsWith("/event") || p.startsWith("/record") },
    { href: "/blocks", label: "Blocks", icon: Box, match: (p: string) => p.startsWith("/block") },
    { href: "/anchors", label: "Anchors", icon: CardanoIcon, match: (p: string) => p.startsWith("/anchor") },
];

export function Header() {
    const pathname = usePathname() || "/";
    // the menu belongs to the page it was opened on, so it closes itself on navigation
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const reduce = useReducedMotion();

    return (
        <header className="sticky top-0 z-50 h-[72px] border-b border-white/[0.07] bg-black/50 backdrop-blur-[24px] backdrop-saturate-150">
            <div className="page flex h-full items-center gap-6">
                <Link href="/" className="flex shrink-0 items-center" aria-label="IndianChain Explorer home">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={110} height={36} priority className="h-8 w-auto lg:h-9" />
                </Link>

                {/* the original nav: tracked labels, the current page on a glass plate with the blue underline; the plate slides */}
                <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
                    {NAV.map(({ href, label, icon: Icon, match }) => {
                        const active = match(pathname);
                        return (
                            <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                className={`relative isolate flex h-9 items-center gap-2 rounded-[8px] px-5 text-[11px] focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-white/40 uppercase tracking-[0.12em] transition-colors duration-150 ${active ? "text-white" : "text-muted hover:text-white"}`}>
                                {active && (
                                    <motion.span layoutId="nav-plate" aria-hidden
                                        className="absolute inset-0 -z-10 overflow-hidden rounded-[8px] border border-white/[0.08] bg-white/[0.05]"
                                        transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}>
                                        <span className="absolute inset-x-3 bottom-0 h-[2px] bg-blue-line" />
                                    </motion.span>
                                )}
                                <Icon className={`h-3.5 w-3.5 ${active ? "text-blue-text" : ""}`} aria-hidden />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-auto hidden w-full max-w-md lg:block">{pathname !== "/" && <SearchBar />}</div>

                <div className="ml-auto flex items-center gap-3 lg:ml-0">
                    <div className="hidden lg:block"><NetworkSwitcher /></div>
                    <button type="button" onClick={() => setOpenOn(open ? null : pathname)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
                        className="icon-btn h-10 w-10 lg:hidden">
                        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 top-[72px] z-40 bg-black/85 backdrop-blur-[30px] lg:hidden">
                    <div className="page flex flex-col gap-6 py-6">
                        <SearchBar />
                        <NetworkSwitcher className="w-full" />
                        <nav aria-label="Main" className="flex flex-col gap-1">
                            {NAV.map(({ href, label, icon: Icon, match }) => {
                                const active = match(pathname);
                                return (
                                    <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-4 border-l-2 px-5 py-4 text-[11px] uppercase tracking-[0.12em] ${active ? "border-blue-line bg-white/[0.04] text-white" : "border-transparent text-muted hover:text-white"}`}>
                                        <Icon className={`h-4 w-4 ${active ? "text-blue-text" : ""}`} aria-hidden />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
