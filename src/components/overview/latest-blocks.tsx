"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fmtInt, shortHash } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";
import { Status } from "@/components/ui/status";

type B = { number: number; hash: string; extrinsicsCount: number; timestamp: string | null };

/** The newest blocks, refreshed every block while the tab is visible. */
export function LatestBlocks({ initial, initialFinalized, network }: { initial: B[]; initialFinalized: number | null; network: string }) {
    const [blocks, setBlocks] = useState(initial);
    const [finalized, setFinalized] = useState(initialFinalized);
    const busy = useRef(false);
    useEffect(() => {
        const tick = async () => {
            if (document.hidden || busy.current) return;
            busy.current = true;
            try {
                const r = await fetch(`/api/chain/blocks?count=${initial.length || 6}&network=${network}`, { cache: "no-store" });
                const j = await r.json();
                if (j.status === "ok") { setBlocks(j.blocks); setFinalized(j.finalized ?? null); }
            } catch { /* keep the last list */ } finally { busy.current = false; }
        };
        const t = setInterval(tick, 6000);
        return () => clearInterval(t);
    }, [network, initial.length]);

    if (!blocks.length) return <p className="px-4 py-10 text-center text-[14px] text-muted">Blocks are unavailable while the node is unreachable.</p>;
    return (
        <div className="overflow-x-auto"><table className="table">
            <caption className="sr-only">Latest blocks</caption>
            <thead><tr><th scope="col">Block</th><th scope="col">Produced</th><th scope="col" className="r hidden sm:table-cell">Extrinsics</th><th scope="col">Status</th></tr></thead>
            <tbody>
                {blocks.map((b) => (
                    <tr key={b.number}>
                        <td>
                            <Link href={`/block/${b.number}`} className="num link">{fmtInt(b.number)}</Link>
                            <span className="mono ml-3 hidden text-[12px] text-faint xl:inline" title={b.hash}>{shortHash(b.hash, 8, 4)}</span>
                        </td>
                        <td className="text-muted"><TimeAgo iso={b.timestamp} /></td>
                        <td className="r num hidden text-muted sm:table-cell">{b.extrinsicsCount}</td>
                        <td>{finalized != null && b.number <= finalized ? <Status tone="positive">Finalized</Status> : <Status>Finalizing</Status>}</td>
                    </tr>
                ))}
            </tbody>
        </table></div>
    );
}
