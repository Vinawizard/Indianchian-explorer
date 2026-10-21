"use client";
import { useLayoutEffect, useRef, useState } from "react";

type Opt<T extends string> = { value: T; label: string };

/**
 * Glass segmented control with a sliding thumb (functional layer, Liquid Glass): the thumb moves
 * between segments with a 260 ms ease-out on transform and width only.
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
    const h = size === "sm" ? "h-8 text-[11px] px-3" : "h-9 text-[12px] px-4";
    return (
        <div ref={wrap} role="tablist" aria-label={label} className={`relative inline-flex rounded-[10px] border border-white/10 bg-[#0c0c10]/80 p-[3px] backdrop-blur-md ${className}`}>
            {thumb && (
                <span aria-hidden className="absolute top-[3px] bottom-[3px] left-0 rounded-[7px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-[transform,width] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} />
            )}
            {options.map((o) => (
                <button key={o.value} type="button" role="tab" data-v={o.value} aria-selected={value === o.value} onClick={() => onChange(o.value)}
                    className={`relative z-10 inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[7px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${h} ${value === o.value ? "text-black" : "text-white/60 hover:text-white"}`}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}
