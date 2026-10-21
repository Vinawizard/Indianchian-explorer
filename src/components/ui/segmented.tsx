"use client";
import { useLayoutEffect, useRef, useState } from "react";

type Opt<T extends string> = { value: T; label: string };

/**
 * The original 1D/1W/1M switch on dark glass: tracked 10px labels, a white thumb that slides
 * between segments (240 ms ease-out, transform and width).
 */
export function Segmented<T extends string>({ options, value, onChange, label, size = "md", className = "" }: {
    options: Opt<T>[]; value: T; onChange: (v: T) => void; label: string; size?: "sm" | "md"; className?: string;
}) {
    const wrap = useRef<HTMLDivElement>(null);
    const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
    useLayoutEffect(() => {
        const el = wrap.current?.querySelector<HTMLButtonElement>(`[data-v="${value}"]`);
        if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    }, [value, options.length]);
    const h = size === "sm" ? "h-8 px-3.5" : "h-9 px-5";
    return (
        <div ref={wrap} role="tablist" aria-label={label} className={`glass relative inline-flex rounded-[10px] p-[3px] ${className}`}>
            {thumb && (
                <span aria-hidden className="absolute top-[3px] bottom-[3px] left-0 rounded-[7px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-[transform,width] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} />
            )}
            {options.map((o) => (
                <button key={o.value} type="button" role="tab" data-v={o.value} aria-selected={value === o.value} onClick={() => onChange(o.value)}
                    className={`relative z-10 inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[7px] text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 ${h} ${value === o.value ? "text-black" : "text-muted hover:text-white"}`}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}
