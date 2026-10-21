import { DotText } from "./dot-text";

/** A figure in the wordmark's dot matrix, drawn on the 4px dot grid (see DotText). */
export function DotNum({ value, className = "" }: { value: string; className?: string }) {
    return <DotText text={value} cell={4} label={value} descender className={className} />;
}
