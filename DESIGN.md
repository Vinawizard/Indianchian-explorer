# IndianChain Explorer design

The original IndianChain explorer is the reference: its type, sizes, table layout, chips and colours.
The redesign keeps all of that and changes only the surfaces (dark see-through glass over the
Trivolve backdrop) and the details (contrast, hover, motion).

## Type

- Text is the platform UI sans (`ui-sans-serif, system-ui`), which is what the original actually
  rendered: Segoe UI on Windows, SF on Mac. No web text fonts.
- Doto (dot matrix) for the word "IndianChain" and for the headline figures (hero, stat boxes,
  farmer trace), separators pulled in so each number reads as one. Tables keep the sans.
- Page title 48px (36px on phones), uppercase, -0.05em. Card titles 20px uppercase, -0.05em.
- Labels, table headers, card subtitles, breadcrumbs, chips, buttons and fields: 10px uppercase,
  tracked 0.1em–0.2em, `#888`.
- Table cells 12px; block numbers 14px white with a small dim `#`, no thousands separator.
- JSON is the only monospace (`.code`, 11px on 24px lines).

## Colour

| Token | Value | Use |
|---|---|---|
| `--blue` | `#0018fe` | Trivolve blue: buttons, LATEST tag, area fills |
| `--blue-line` | `#2d45ff` | strokes, the selection underline, hover bars (3.4:1) |
| `--blue-text` | `#6b7aff` | blue text: links, chips, units (5.9:1) |
| `--muted` | `#888888` | labels and secondary text |
| red | `#ff2a2a` / `#ff5c5c` | credit series line / its figure |

No green or amber. Status is a chip: blue with a check when done, quiet grey with a clock while waiting.

## Surfaces

- `.card`: dark glass, `rgba(5,6,14,.38)` to `rgba(0,0,0,.5)`, `blur(24px) saturate(160%)`, a 1px rim
  (blue top-left, red bottom-right, lit under the cursor). Radius 16px. No grey fills, no header bands.
- Backdrop: one fixed layer behind every page (`.aurora`): black, Trivolve blue and red light
  drifting slowly (four transform-only CSS loops, 44-60 s), the plus-sign grid on top. Boxes never
  carry their own gradient, so every box shows the same colours moving behind it.
- `.panel`: the card's rim with nothing inside, fully see-through; used for the landing hero.

## Tables

The original events table: icon + tracked label headers (icons in `--blue-text`), 20px row padding,
32px side padding, hairline row dividers, the whole row is the link, a square chevron at the end.
Hover: a blue sweep and a 2px blue bar on the left; copy buttons appear on hover only.

## Motion

- Nav: the current page sits on a glass plate with the blue underline; the plate slides between
  items (spring, 0.35s, no bounce).
- Live feed: a new block slides in at the top (220ms ease-out). Nothing blinks or pulses.
- Range and feed switches: the white thumb slides the same way.
- Charts draw once on load and on a range change. Reduced motion stops the backdrop and removes movement.

## Charts

The original two cards: Network activity (stepped, blue) and Record distribution (smooth: farmer
white, agri blue, credit red). No legend and no printed totals; the original tooltip (date, then
`Farmer: 48` etc. in each series' colour) appears on hover or with the arrow keys.

## Landing page

One see-through hero (wordmark, search, the three figures), then the two charts, then the live
feed. Every section below the hero is a card with the same head: title, tracked subtitle, switch.

## Words

Records are called events (nav, pages, tables); the list lives at `/events` and `/records`
redirects there. Anchors use the Cardano mark.
