import { DotCounter } from "./dot-counter";

/** A figure in the wordmark's dot matrix on the 4px grid; changed digits drop in (see DotCounter). */
export function DotNum({ value, className = "" }: { value: string; className?: string }) {
    return <DotCounter value={value} className={className} />;
}
