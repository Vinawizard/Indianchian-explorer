import { notFound, redirect } from "next/navigation";
import { resolveNetworkFromCookies } from "@/lib/network-server";
import { resolveSearch } from "@/lib/search";

/** Old record links (/event/<block | tx hash | record id>) land on the page that now owns them. */
export default async function EventRedirect({ params }: { params: Promise<{ hash: string }> }) {
    const { hash } = await params;
    const target = await resolveSearch(decodeURIComponent(hash), await resolveNetworkFromCookies()).catch(() => null);
    if (!target) notFound();
    redirect(target);
}
