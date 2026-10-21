import type { Metadata } from "next";
import { Doto } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { Spotlight } from "@/components/ui/spotlight";

// Text is the platform UI sans, as the original explorer rendered (see globals.css).
// Trivolve's dot-matrix voice for the IndianChain wordmark only (trivolvetech.com uses OffBit Dot; Doto is the open-licence match).
const doto = Doto({ weight: ["800"], variable: "--font-doto", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: { default: "IndianChain Explorer", template: "%s · IndianChain Explorer" },
    description: "IndianChain mainnet explorer by Trivolve Tech: blocks, events and their Cardano anchors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        // Font variables live on <html> so every token that references them resolves.
        <html lang="en" className={`dark ${doto.variable}`}>
            <body className="min-h-screen flex flex-col">
                {/* the Trivolve light behind every page (still; the landing page adds the moving one) */}
                <div className="backdrop" aria-hidden />
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-white">
                    Skip to content
                </a>
                <Header />
                <PreviewNotice />
                <main id="main" className="flex-1">
                    {children}
                </main>
                <Footer />
                <Spotlight />
            </body>
        </html>
    );
}
