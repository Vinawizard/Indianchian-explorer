import Image from "next/image";
import { Globe, Linkedin } from "lucide-react";
import { siX } from "simple-icons";

/** The original footer: wordmark and line on the left; Trivolve on X and LinkedIn and its website, then the copyright. */
export function Footer() {
    return (
        <footer className="mt-24 border-t border-white/5">
            <div className="page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3">
                    <Image src="/trivolve-logo.png" alt="Trivolve Tech" width={98} height={32} className="h-8 w-auto self-start" />
                    <p className="label">Building the decentralized future</p>
                </div>
                <div className="flex flex-col gap-4 sm:items-end">
                    <div className="flex items-center gap-6">
                        <a href="https://x.com/trivolvetech" target="_blank" rel="noopener noreferrer" aria-label="Trivolve Tech on X"
                            className="text-muted transition-colors duration-200 hover:text-red-text">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden><path d={siX.path} /></svg>
                        </a>
                        <a href="https://www.linkedin.com/company/trivolve-tech/" target="_blank" rel="noopener noreferrer" aria-label="Trivolve Tech on LinkedIn"
                            className="text-muted transition-colors duration-200 hover:text-red-text">
                            <Linkedin className="h-5 w-5" aria-hidden />
                        </a>
                        <a href="https://trivolvetech.com/" target="_blank" rel="noopener noreferrer" aria-label="Trivolve Tech website"
                            className="text-muted transition-colors duration-200 hover:text-red-text">
                            <Globe className="h-5 w-5" aria-hidden />
                        </a>
                    </div>
                    <p className="label">© 2026 Trivolve Tech. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
