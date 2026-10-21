# IndianChain Explorer design

The explorer is a working tool (block, record and anchor lookups read in long sessions), so the design is
quiet and exact: colour goes on data, status and one action; everything else is type, alignment and
1px lines. It keeps the Trivolve identity: true black, the Trivolve blue `#0018fe`, the angular T mark,
square corners.

## Tokens (`src/app/globals.css`)

| Role | Value | Use |
|---|---|---|
| ground | `#000000` | page |
| surface | `#0a0a0b` | panels |
| raised | `#141416` | hover rows, selected items |
| line | `#1f1f22` | panel edges, header rule |
| rule | `#161618` | rows inside a panel |
| control | `#3a3a3f` | outlines of inputs and buttons |
| ink | `#f5f5f6` | text and figures |
| muted | `#b4b4b8` | secondary text (9.8:1) |
| faint | `#8d8d93` | labels, meta (6.2:1) |
| accent | `#0018fe` | the selection line, focus ring, chart bars, text selection. Never as text |
| link | `#8c97ff` | links and IDs as text (the brand blue lifted to 7.9:1) |
| positive / warning / negative | `#3fc07a` / `#e0a63a` / `#ef6b7f` on dark tints of themselves | status only |

Radius 0 everywhere. No gradients, glows, blur, background patterns or resting shadows. The one
shadow is on the floating search error.

## Type

- Inter for everything; figures use `.num` (tabular digits). Roboto Mono only for hashes, IDs and code (`.mono`, 13px).
- Silkscreen only for the word "Explorer" beside the Trivolve logo.
- Title 24/600, panel titles 14/600, body 14, tables 13, labels and headers 12-13, nothing under 11.
- Sentence case everywhere. No snake_case or tracked uppercase labels.

## The one move

Every selection (nav item, network switch, current version) is a 1px accent line exactly as wide as its
label (`.tab`). Nothing else uses the accent as decoration.

## Layout

One column, `max-width: 1200px` plus a 24px gutter (16px on phones), shared by header, pages and
footer. Each screen opens with breadcrumb, a noun title and one line that answers its question
(`PageHeader`). Panels: `.panel` with `.panel-head`. Tables: `.table`, numbers right-aligned;
secondary columns step back on small screens.

## Components (`src/components/ui`)

`PageHeader`, `KV` (label/value rows), `Hash` (middle-shortened with copy; `full` on detail pages),
`Status` (pale tint), `TimeAgo` (relative, absolute UTC in the tooltip), `Empty` (empty, error and
404 states that say what to do next), `BarChart` (one series, one hue, round ticks).

## Honesty rules

- Figures come from the chain (record counter, heights, validators) or the read-only ledger; no invented numbers.
- Never print 100% while records are still waiting; "finalized" comes from the finalized head.
- The payload hash is described as the commitment stored on chain, nothing more.
