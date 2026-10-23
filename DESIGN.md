# IndianChain Explorer design

The original IndianChain explorer is the reference: its type, sizes, table layout, chips and colours.
The redesign keeps all of that and changes only the surfaces (dark see-through glass over the
Trivolve backdrop) and the details (contrast, hover, motion).

## Type

- Text is the platform UI sans (`ui-sans-serif, system-ui`), which is what the original actually
  rendered: Segoe UI on Windows, SF on Mac. No web text fonts.
- Doto's dot patterns, drawn as squares on whole-pixel grids: the wordmark (8px cell), hero figures
  and landing section titles (4px; titles in 60% "fine" dots), stat-box figures (small grid,
  `--cell-s`: 3px at 100%, 3.2px at 125%). Tables, keys and values keep the sans.
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

**Red means Cardano.** IndianChain is blue; red marks where a record meets Cardano: Cardano
transaction hashes and links (red at rest, `#ff5c5c`, 6.9:1), the Cardano mark (always `#ff2a2a`),
the Cardanoscan button. Under the cursor every blue link, a hovered row's link and its chevron turn
red, and the hero's "Anchored on Cardano" figure turns red one dot column at a time. Chips stay blue.

## Surfaces

- `.card`: dark glass, `rgba(0,0,4,.56)` to `rgba(0,0,0,.68)`, `blur(16px) saturate(130%)`, a 1px rim
  (blue top-left, red bottom-right). The cursor warms the rim in Trivolve blue, never white.
  Measured: the glass is darker than the page beside it (0.5x luminance; it was 1.6x, a grey film
  from the blurred plus marks), and the cursor glint is a third of what it was. Radius 16px.
- Plus marks at 6% white; still glows blue 0.22 / red 0.12 on inner pages.
- Backdrop: one fixed layer behind every page (`.backdrop`): black, a still Trivolve blue glow
  top-left and red bottom-right, the plus-sign grid. Boxes never carry their own gradient.
- Landing page only (`.aurora`): the same light moving, four transform-only CSS loops (26-34 s).
  Measured with Playwright on the backdrop alone across the loop: brightest hero point (p99)
  luminance 0.012, so the `#888` labels stay at 4.78:1 or better and white text at 16.9:1.
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
- Charts draw once on load and on a range change. Reduced motion stops the landing light and removes movement.

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
