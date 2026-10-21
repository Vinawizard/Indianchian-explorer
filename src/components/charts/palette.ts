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
export const GRID = "#1c1c1c";
export const TICK = "#8a8a8a";
