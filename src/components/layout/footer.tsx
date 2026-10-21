import Image from "next/image";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="mt-24 border-t border-white/5">
            <div className="page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={98} height={32} className="h-8 w-auto self-start" />
                    <p className="label">Building the decentralized future</p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                    <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-faint">
                        <Link href="/records" className="hover:text-white">Records</Link>
                        <Link href="/anchors" className="hover:text-white">Anchors</Link>
                        <a href="https://ic-node.trivolvetech.com/integration-api/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white">API</a>
                    </nav>
                    <p className="label">© 2026 Trivolve Tech. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
