import Link from "next/link";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
    return (
        <div className="shell">
            <PageHeader title="Not found" />
            <section className="panel">
                <Empty title="Nothing on IndianChain matches this address"
                    action={<><Link href="/records" className="btn">Browse records</Link><Link href="/" className="btn">Overview</Link></>}>
                    Check the ID, or search from the header: a block number, a block or transaction hash, a record ID or a farmer ID.
                </Empty>
            </section>
        </div>
    );
}
