import { DotCounter } from "./dot-counter";

/** A figure in the wordmark's dot matrix on the 4px grid; changed digits drop in (see DotCounter). */
export function DotNum({ value, className = "", sweep }: { value: string; className?: string; sweep?: boolean }) {
    return <DotCounter value={value} className={className} sweep={sweep} />;
}
