/**
 * Chart colours from the original explorer: farmer white, agricultural Trivolve blue, credit
 * Trivolve red. The blue stroke is lifted to #2d45ff so the line clears 3:1 on black; fills keep
 * the brand values.
 */
export const SERIES = {
    farmer: "#ffffff",
    agri_record: "#2d45ff",
    credit_app: "#ff2a2a",
} as const;
export const ACTIVITY = "#2d45ff";
/** area fills keep the brand blue; tooltip figures use the text-safe tints */
export const TINT = { blue: "#0018fe" } as const;
export const INK = { white: "#ffffff", blue: "#6b7aff", red: "#ff5c5c" } as const;
