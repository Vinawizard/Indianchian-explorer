import type { ChainNetwork } from "./network";

/**
 * Client-safe: no server imports. Picks the Cardano explorer by the selected network:
 * IndianChain mainnet anchors on Cardano mainnet, preview on Cardano preview.
 * (Not by the row's `chain` label — mainnet rows carry "indianchain" too.)
 */
export const cardanoscanTx = (network: ChainNetwork, tx: string) =>
    (network === "mainnet" ? "https://cardanoscan.io/transaction/" : "https://preview.cardanoscan.io/transaction/") + tx;
