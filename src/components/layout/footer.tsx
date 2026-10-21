import Image from "next/image";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-20 border-t border-line">
            <div className="shell flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={86} height={28} className="h-7 w-auto opacity-90" />
                    <p className="text-[13px] text-faint">
                        IndianChain is a Cardano partner chain for agricultural records, built by Trivolve Tech.
                    </p>
                </div>
                <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
                    <Link href="/records" className="hover:text-ink">Records</Link>
                    <Link href="/anchors" className="hover:text-ink">Cardano anchors</Link>
                    <a href="https://ic-node.trivolvetech.com/integration-api/docs" className="hover:text-ink" target="_blank" rel="noopener noreferrer">Verification API</a>
                    <a href="https://trivolvetech.com" className="hover:text-ink" target="_blank" rel="noopener noreferrer">trivolvetech.com</a>
                </nav>
            </div>
        </footer>
    );
}
