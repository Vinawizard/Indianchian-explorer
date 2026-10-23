"use client";
import { usePathname } from "next/navigation";

/**
 * The Trivolve light behind every page, moving (CSS only, see .aurora in globals.css). The Events
 * list keeps the still light it had (.backdrop), as asked.
 */
export function Aurora() {
    const path = usePathname() || "/";
    if (path.startsWith("/events")) return <div className="backdrop" aria-hidden />;
    return <div className="aurora" aria-hidden><i className="a1" /><i className="a2" /><i className="a3" /><i className="a4" /></div>;
}
