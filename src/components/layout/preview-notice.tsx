import { resolveNetworkFromCookies } from "@/lib/network-server";
import { previewOnline } from "@/lib/preview-status";

/** When Preview is selected and its chain is down, say so once, at the top of every page. */
export async function PreviewNotice() {
    const network = await resolveNetworkFromCookies();
    if (network !== "preview" || (await previewOnline())) return null;
    return (
        <div role="status" className="border-b border-line bg-warning-bg">
            <div className="shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13px]">
                <span className="font-medium text-warning">Preview network offline</span>
                <span className="text-muted">The Preview testnet is not running, so live blocks are unavailable. Switch to Mainnet for the production chain.</span>
            </div>
        </div>
    );
}
