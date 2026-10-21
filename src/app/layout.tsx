import type { Metadata } from "next";
import { Doto, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreviewNotice } from "@/components/layout/preview-notice";

// Inter with its optical-size axis: display sizes get the tighter, SF-Display-like cut.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap", axes: ["opsz"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap" });
// Trivolve's dot-matrix display voice (trivolvetech.com uses OffBit Dot; Doto is the open-licence match).
const doto = Doto({ weight: ["800"], variable: "--font-doto", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: { default: "IndianChain Explorer", template: "%s · IndianChain Explorer" },
    description: "IndianChain mainnet explorer by Trivolve Tech: blocks, records and their Cardano anchors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        // Font variables live on <html> so every token that references them resolves.
        <html lang="en" className={`dark ${inter.variable} ${robotoMono.variable} ${doto.variable}`}>
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
            </body>
        </html>
    );
}
