"use client";
import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

type Opt<T extends string> = { value: T; label: string };

/**
 * The original 1D/1W/1M switch on dark glass: tracked 10px labels and a white thumb that slides
 * to the chosen segment (shared layout, spring without bounce), like the nav plate.
 */
export function Segmented<T extends string>({ options, value, onChange, label, size = "md", className = "" }: {
    options: Opt<T>[]; value: T; onChange: (v: T) => void; label: string; size?: "sm" | "md"; className?: string;
}) {
    const id = useId();
    const reduce = useReducedMotion();
    const h = size === "sm" ? "h-8 px-3.5" : "h-9 px-5";
    return (
        <div role="tablist" aria-label={label} className={`glass relative inline-flex rounded-[10px] p-[3px] ${className}`}>
            {options.map((o) => {
                const on = value === o.value;
                return (
                    <button key={o.value} type="button" role="tab" aria-selected={on} onClick={() => onChange(o.value)}
                        className={`relative isolate inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[7px] text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 ${h} ${on ? "text-black" : "text-muted hover:text-white"}`}>
                        {on && (
                            <motion.span layoutId={`seg-${id}`} aria-hidden className="absolute inset-0 -z-10 rounded-[7px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                                transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }} />
                        )}
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
