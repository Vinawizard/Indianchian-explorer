/** Supabase PostgREST: row has merkle_root and/or cardano_tx_hash set */
export const CARDANO_PROOF_OR_FILTER = "merkle_root.not.is.null,cardano_tx_hash.not.is.null";

export function hasCardanoProof(row: {
    merkle_root?: string | null;
    cardano_tx_hash?: string | null;
}): boolean {
    const merkle = row.merkle_root;
    const cardano = row.cardano_tx_hash;
    const hasMerkle = merkle != null && String(merkle).trim() !== "";
    const hasCardano = cardano != null && String(cardano).trim() !== "";
    return hasMerkle || hasCardano;
}

export function countUniqueBlocks(
    rows: { block_number: number; merkle_root?: string | null; cardano_tx_hash?: string | null }[]
): number {
    const blocks = new Set<number>();
    for (const row of rows) {
        if (hasCardanoProof(row)) blocks.add(row.block_number);
    }
    return blocks.size;
}
