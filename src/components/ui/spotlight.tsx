"use client";
import { useEffect } from "react";

/**
 * Cursor light for every glass surface: one delegated pointermove listener writes the pointer
 * position into --mx/--my on the surface under the cursor (rAF-throttled, fine pointers only).
 * The CSS paints a soft light on the rim and the fill from those two variables.
 */
export function Spotlight() {
    useEffect(() => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        let raf = 0, ev: PointerEvent | null = null, current: HTMLElement | null = null;
        const SEL = ".card, .panel, .spot";
        const apply = () => {
            raf = 0;
            if (!ev) return;
            const el = (ev.target as Element | null)?.closest?.(SEL) as HTMLElement | null;
            if (current && current !== el) { current.style.removeProperty("--mx"); current.style.removeProperty("--my"); current.removeAttribute("data-lit"); }
            current = el;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty("--mx", `${ev.clientX - r.left}px`);
            el.style.setProperty("--my", `${ev.clientY - r.top}px`);
            el.setAttribute("data-lit", "");
        };
        const onMove = (e: PointerEvent) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
        const onLeave = () => { if (current) { current.style.removeProperty("--mx"); current.style.removeProperty("--my"); current.removeAttribute("data-lit"); current = null; } };
        document.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        return () => { document.removeEventListener("pointermove", onMove); document.documentElement.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(raf); };
    }, []);
    return null;
}
