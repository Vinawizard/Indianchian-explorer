/**
 * Chart colours, validated with the dataviz skill's checker on the #0a0a0a card surface
 * (lightness band, chroma floor, CVD and normal-vision separation, 3:1 contrast all pass).
 * Trivolve blue and red are lifted just enough to stay visible as marks on black.
 */
export const SERIES = {
    farmer: "#4a5cff",       // Trivolve blue
    agri_record: "#16a2b5",  // teal, the original explorer's cyan
    credit_app: "#ff4242",   // Trivolve red
} as const;
export const BAR = SERIES.farmer;
export const GRID = "rgba(255,255,255,0.07)";
export const TICK = "rgba(255,255,255,0.5)";
