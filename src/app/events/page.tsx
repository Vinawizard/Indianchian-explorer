import { redirect } from "next/navigation";

/** The old events list moved to /records; its filters carry over. */
export default async function EventsRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const p = new URLSearchParams();
    const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
    if (one("record_type")) p.set("type", one("record_type"));
    if (one("status")) p.set("status", one("status"));
    if (one("start")) p.set("start", one("start"));
    if (one("end")) p.set("end", one("end"));
    redirect(p.toString() ? `/records?${p}` : "/records");
}
