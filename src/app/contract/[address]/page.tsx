"use client";

import { use, useState } from "react";
import { Check, Copy, Code, BookOpen, PenTool, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const sampleCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IndiCoin is ERC20, Ownable {
    constructor(address initialOwner) 
        ERC20("IndiCoin", "IND")
        Ownable(initialOwner) 
    {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

export default function ContractPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("code");

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sampleCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        Contract <span className="text-muted-foreground font-normal font-mono text-xl">{address}</span>
                    </h1>
                    <p className="text-sm font-medium text-emerald-500 mt-1 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Source Code Verified
                    </p>
                </div>
            </div>

            <div className="border-b border-border flex items-center gap-6 mb-6 overflow-x-auto scrollbar-none">
                {[
                    { id: "code", label: "Code", icon: Code },
                    { id: "read", label: "Read Contract", icon: BookOpen },
                    { id: "write", label: "Write Contract", icon: PenTool },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-2 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {activeTab === "code" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-muted-foreground">Compiler:</span> <span>v0.8.20+commit.a1b79de6</span>
                            <span className="text-muted-foreground ml-4">Optimization:</span> <span className="text-emerald-500">Yes (200)</span>
                        </div>
                        <button onClick={copyToClipboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-md">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} Copy Code
                        </button>
                    </div>
                    <div className="p-0 bg-[#0d1117] text-[#c9d1d9] overflow-x-auto">
                        <pre className="text-sm font-mono p-6">
                            <code>{sampleCode}</code>
                        </pre>
                    </div>
                </motion.div>
            )}

            {activeTab !== "code" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center border border-border border-dashed rounded-2xl text-muted-foreground bg-muted/20">
                    <h3>{activeTab === "read" ? "Read" : "Write"} functionality will connect directly to the Web3 Provider.</h3>
                </motion.div>
            )}

        </div>
    );
}
