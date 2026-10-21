import Link from "next/link";
import { Empty } from "@/components/ui/empty";

export default function NotFound() {
    return (
        <div className="page pt-10">
            <div className="card">
                <Empty title="Not found" action={<><Link href="/" className="btn">Home</Link><Link href="/events" className="btn">Events</Link></>} />
            </div>
        </div>
    );
}
