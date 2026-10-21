import { siCardano } from "simple-icons";

/** The Cardano mark (simple-icons, CC0) in the current text colour, sized like the lucide icons beside it. */
export function CardanoIcon({ className = "h-3.5 w-3.5", title }: { className?: string; title?: string; "aria-hidden"?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
            {title && <title>{title}</title>}
            <path d={siCardano.path} />
        </svg>
    );
}
