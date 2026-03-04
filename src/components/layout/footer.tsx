import Link from "next/link";
import Image from "next/image";
import { Hexagon, Github, Twitter, Globe, Layers, Activity } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black">
            <div className="container mx-auto px-4 lg:px-8 py-16">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/trivolve-logo.png"
                                alt="Trivolve Tech Logo"
                                width={140}
                                height={35}
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            BUILDING THE DECENTRALIZED FUTURE
                        </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-3">
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-muted-foreground hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://trivolvetech.com/" target="_blank" className="text-muted-foreground hover:text-white transition-colors">
                                <Globe className="w-5 h-5" />
                            </a>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                            © {new Date().getFullYear()} TRIVOLVE TECH. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
