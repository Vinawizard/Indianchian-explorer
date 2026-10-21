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
        <header className="sticky top-0 z-50 h-20 border-b border-white/5 bg-black/85 backdrop-blur-xl">
            <div className="page flex h-full items-center gap-6">
                <Link href="/" className="flex shrink-0 items-center" aria-label="IndianChain Explorer home">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={122} height={40} priority className="h-9 w-auto lg:h-10" />
                </Link>

                <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
                    {NAV.map(({ href, label, icon: Icon, match }) => {
                        const active = match(pathname);
                        return (
                            <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                className={`flex h-10 items-center gap-2 border-b-2 px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${active ? "border-blue bg-white/5 text-white" : "border-transparent text-faint hover:text-white"}`}>
                                <Icon className={`h-3.5 w-3.5 ${active ? "text-blue-text" : ""}`} aria-hidden />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-auto hidden w-full max-w-md lg:block">{pathname !== "/" && <SearchBar />}</div>

                <div className="ml-auto flex items-center gap-3 lg:ml-0">
                    <NetworkSwitcher className="hidden lg:inline-flex" />
                    <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
                        className="icon-btn h-10 w-10 lg:hidden">
                        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 top-20 z-40 bg-black lg:hidden">
                    <div className="page flex flex-col gap-6 py-6">
                        <SearchBar />
                        <NetworkSwitcher className="w-full [&>*]:flex-1" />
                        <nav aria-label="Main" className="flex flex-col gap-2">
                            {NAV.map(({ href, label, icon: Icon, match }) => {
                                const active = match(pathname);
                                return (
                                    <Link key={href} href={href} aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-4 border-l-2 px-5 py-4 text-xs font-medium uppercase tracking-[0.14em] ${active ? "border-blue bg-white/5 text-white" : "border-transparent text-faint hover:bg-white/5 hover:text-white"}`}>
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
