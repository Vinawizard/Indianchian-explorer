/** Client-safe: no server imports. Picks the explorer by the row's chain value. */
export const cardanoscanTx = (chain: string | null | undefined, tx: string) =>
    (chain === "indianchain-mainnet" ? "https://cardanoscan.io/transaction/" : "https://preview.cardanoscan.io/transaction/") + tx;
