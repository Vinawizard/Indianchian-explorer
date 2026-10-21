"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { SearchBar } from "./search-bar";
import { NetworkSwitcher } from "./network-switcher";

export const NAV = [
    { href: "/", label: "Overview", match: (p: string) => p === "/" },
    { href: "/records", label: "Records", match: (p: string) => p.startsWith("/record") || p.startsWith("/event") },
    { href: "/blocks", label: "Blocks", match: (p: string) => p.startsWith("/block") },
    { href: "/anchors", label: "Cardano anchors", match: (p: string) => p.startsWith("/anchor") },
];

export function Header() {
    const pathname = usePathname() || "/";
    const [menu, setMenu] = useState(false);
    const [search, setSearch] = useState(false);
    useEffect(() => { setMenu(false); setSearch(false); }, [pathname]);

    return (
        <header className="sticky top-0 z-40 border-b border-line bg-ground">
            <div className="shell flex h-14 items-center gap-6">
                <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="IndianChain Explorer, home">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={98} height={32} priority className="h-8 w-auto" />
                    <span aria-hidden className="h-5 w-px bg-line" />
                    <span className="font-brand text-[13px] leading-none tracking-[0.02em] text-ink">Explorer</span>
                </Link>

                <nav aria-label="Main" className="hidden h-full items-stretch gap-6 lg:flex">
                    {NAV.map((n) => (
                        <Link key={n.href} href={n.href} aria-current={n.match(pathname) ? "page" : undefined} className="tab text-[14px] font-medium">
                            {n.label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto hidden items-center gap-3 md:flex">
                    <SearchBar className="w-[300px] xl:w-[360px]" />
                    <NetworkSwitcher />
                </div>

                <div className="ml-auto flex items-center md:hidden">
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-ink" aria-label="Search" aria-expanded={search} onClick={() => { setSearch((v) => !v); setMenu(false); }}>
                        <Search className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-ink" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => { setMenu((v) => !v); setSearch(false); }}>
                        {menu ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
                <div className="hidden md:flex lg:hidden">
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-muted hover:text-ink" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                        {menu ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
            </div>

            {search && (
                <div className="border-t border-line md:hidden">
                    <div className="shell py-3"><SearchBar autoFocus className="w-full" /></div>
                </div>
            )}
            {menu && (
                <div className="border-t border-line lg:hidden">
                    <nav aria-label="Main" className="shell flex flex-col py-2">
                        {NAV.map((n) => (
                            <Link key={n.href} href={n.href} aria-current={n.match(pathname) ? "page" : undefined}
                                className={`flex h-12 items-center text-[15px] ${n.match(pathname) ? "text-ink" : "text-muted hover:text-ink"}`}>
                                {n.match(pathname) && <span aria-hidden className="mr-3 h-4 w-px bg-accent" />}
                                {n.label}
                            </Link>
                        ))}
                        <div className="py-3 md:hidden"><NetworkSwitcher /></div>
                    </nav>
                </div>
            )}
        </header>
    );
}
