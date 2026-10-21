"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Anchor, Box, Layers, Menu, X } from "lucide-react";
import { SearchBar } from "./search-bar";
import { NetworkSwitcher } from "./network-switcher";

const NAV = [
    { href: "/", label: "Home", icon: Activity, match: (p: string) => p === "/" },
    { href: "/records", label: "Records", icon: Layers, match: (p: string) => p.startsWith("/record") || p.startsWith("/event") },
    { href: "/blocks", label: "Blocks", icon: Box, match: (p: string) => p.startsWith("/block") },
    { href: "/anchors", label: "Anchors", icon: Anchor, match: (p: string) => p.startsWith("/anchor") },
];

export function Header() {
    const pathname = usePathname() || "/";
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [pathname]);

    return (
        <header className="sticky top-0 z-50 h-[72px] border-b border-white/[0.07] bg-black/45 shadow-[0_1px_0_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[24px] backdrop-saturate-150">
            <div className="page flex h-full items-center gap-6">
                <Link href="/" className="flex shrink-0 items-center" aria-label="IndianChain Explorer home">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={110} height={36} priority className="h-8 w-auto lg:h-9" />
                </Link>

                <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
                    {NAV.map(({ href, label, icon: Icon, match }) => {
                        const active = match(pathname);
                        return (
                            <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                className={`relative flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 ${active ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-white/55 hover:bg-white/[0.04] hover:text-white"}`}>
                                {active && <span aria-hidden className="absolute -bottom-[17px] left-3 right-3 h-[2px] rounded-full bg-blue shadow-[0_0_10px_rgba(0,24,254,0.9)]" />}
                                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#8f9bff]" : ""}`} aria-hidden />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-auto hidden w-full max-w-md lg:block">{pathname !== "/" && <SearchBar />}</div>

                <div className="ml-auto flex items-center gap-3 lg:ml-0">
                    <div className="hidden lg:block"><NetworkSwitcher /></div>
                    <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
                        className="icon-btn h-10 w-10 lg:hidden">
                        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 top-[72px] z-40 bg-black/80 backdrop-blur-[30px] lg:hidden">
                    <div className="page flex flex-col gap-6 py-6">
                        <SearchBar />
                        <NetworkSwitcher className="w-full" />
                        <nav aria-label="Main" className="flex flex-col gap-2">
                            {NAV.map(({ href, label, icon: Icon, match }) => {
                                const active = match(pathname);
                                return (
                                    <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-4 rounded-[12px] px-4 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] ${active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"}`}>
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
