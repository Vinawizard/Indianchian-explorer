import { CopyButton } from "./copy-button";

/**
 * Pretty-printed JSON in the original explorer's colours: keys and numbers white, strings and
 * booleans Trivolve blue (lifted for text), null dimmed.
 */
function Value({ v, indent }: { v: unknown; indent: number }) {
    const pad = "  ".repeat(indent);
    if (v === null) return <span className="text-white/40">null</span>;
    if (typeof v === "boolean") return <span className="text-blue-text">{String(v)}</span>;
    if (typeof v === "number") return <span className="text-white">{v}</span>;
    if (typeof v === "string") return <span className="break-all text-blue-text">&quot;{v}&quot;</span>;
    if (Array.isArray(v)) {
        if (!v.length) return <span className="text-white/50">[]</span>;
        return (<>{"[\n"}{v.map((x, i) => <span key={i}>{pad}  <Value v={x} indent={indent + 1} />{i < v.length - 1 ? "," : ""}{"\n"}</span>)}{pad}{"]"}</>);
    }
    const entries = Object.entries(v as Record<string, unknown>);
    if (!entries.length) return <span className="text-white/50">{"{}"}</span>;
    return (
        <>
            {"{\n"}
            {entries.map(([k, x], i) => (
                <span key={k}>{pad}  <span className="text-white">&quot;{k}&quot;</span><span className="text-white/30">: </span><Value v={x} indent={indent + 1} />{i < entries.length - 1 ? <span className="text-white/30">,</span> : ""}{"\n"}</span>
            ))}
            {pad}{"}"}
        </>
    );
}

export function JsonView({ data, maxHeight = 460 }: { data: unknown; maxHeight?: number }) {
    return (
        <div className="relative">
            <div className="absolute right-3 top-3"><CopyButton value={JSON.stringify(data, null, 2)} label="Copy JSON" /></div>
            <pre className="code overflow-auto bg-black/40 px-6 py-5 text-white/80" style={{ maxHeight }}><Value v={data} indent={0} /></pre>
        </div>
    );
}
