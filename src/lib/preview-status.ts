import "server-only";
import net from "node:net";

/**
 * Is the Preview (testnet) RPC reachable? A plain TCP probe with a short timeout, cached for
 * 30 s, so an offline Preview never leaves a page waiting or a client reconnecting forever.
 */
const S = ((globalThis as unknown as { __icPreviewProbe?: { at: number; up: boolean } }).__icPreviewProbe ??= { at: 0, up: false });

export async function previewOnline(): Promise<boolean> {
    if (Date.now() - S.at < 30_000) return S.up;
    const raw = process.env.PREVIEW_WS_ENDPOINT || process.env.CHAIN_WS_ENDPOINT || "ws://localhost:9944";
    let host = "localhost", port = 9944;
    try { const u = new URL(raw); host = u.hostname; port = Number(u.port || (u.protocol === "wss:" ? 443 : 80)); } catch { /* keep defaults */ }
    const up = await new Promise<boolean>((resolve) => {
        const s = net.connect({ host, port });
        const done = (v: boolean) => { s.destroy(); resolve(v); };
        s.setTimeout(1500, () => done(false));
        s.once("connect", () => done(true));
        s.once("error", () => done(false));
    });
    S.at = Date.now(); S.up = up;
    return up;
}
