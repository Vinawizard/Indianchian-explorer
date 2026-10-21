/** A figure in the wordmark's dot matrix; thousands separators are pulled in so the digits read as one number. */
export function DotNum({ value, className = "" }: { value: string; className?: string }) {
    return (
        <span className={`fig ${className}`}>
            {value.split(/(,)/).map((part, i) => (part === "," ? <span key={i} className="sep">,</span> : part))}
        </span>
    );
}
