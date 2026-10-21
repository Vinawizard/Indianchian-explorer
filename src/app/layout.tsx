import type { Metadata } from "next";
import { Doto, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { Spotlight } from "@/components/ui/spotlight";

// Space Grotesk + Space Mono: one geometric, technical family that sits naturally beside the
// dot-matrix title (closest open match to trivolvetech.com's Neue Machina + OffBit Dot pairing).
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], display: "swap" });
const spaceMono = Space_Mono({ variable: "--font-spacemono", weight: ["400", "700"], subsets: ["latin"], display: "swap" });
// Trivolve's dot-matrix display voice (trivolvetech.com uses OffBit Dot; Doto is the open-licence match).
const doto = Doto({ weight: ["800"], variable: "--font-doto", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: { default: "IndianChain Explorer", template: "%s · IndianChain Explorer" },
    description: "IndianChain mainnet explorer by Trivolve Tech: blocks, records and their Cardano anchors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        // Font variables live on <html> so every token that references them resolves.
        <html lang="en" className={`dark ${grotesk.variable} ${spaceMono.variable} ${doto.variable}`}>
            <body className="min-h-screen flex flex-col">
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
