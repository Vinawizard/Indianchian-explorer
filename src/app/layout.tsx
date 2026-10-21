import type { Metadata } from "next";
import { Inter, Roboto_Mono, Silkscreen } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreviewNotice } from "@/components/layout/preview-notice";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap" });
// Brand face, used only next to the Trivolve wordmark.
const silkscreen = Silkscreen({ weight: "400", variable: "--font-silkscreen", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: { default: "IndianChain Explorer", template: "%s · IndianChain Explorer" },
    description:
        "Blocks, farmer, agricultural and credit records on IndianChain, the Cardano partner chain built by Trivolve Tech, and the Cardano mainnet transactions that anchor them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        // Font variables live on <html> so every token that references them resolves.
        <html lang="en" className={`dark ${inter.variable} ${robotoMono.variable} ${silkscreen.variable}`}>
            <body className="min-h-screen flex flex-col">
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-primary">
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
