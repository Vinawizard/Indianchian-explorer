import { resolveNetworkFromCookies } from "@/lib/network-server";
import { previewOnline } from "@/lib/preview-status";

export async function PreviewNotice() {
    const network = await resolveNetworkFromCookies();
    if (network !== "preview" || (await previewOnline())) return null;
    return (
        <div role="status" className="border-b border-white/5 bg-white/[0.02]">
            <div className="page flex items-center gap-3 py-2.5">
                <span className="chip">Offline</span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted">Preview network is offline</span>
            </div>
        </div>
    );
}
