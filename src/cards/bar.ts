// The diverging bar shared by the recovery and moisture cards: styles, the bar with its lanes and zero line, and the
// legend swatches. Layout comes from lib/bar.ts; this file only renders it.
import { css, html, nothing, type TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type { Segment } from '../lib/bar';

/** A segment as drawn: its place on the bar and its fill. */
export interface DrawnSegment extends Segment {
  background: string;
}

/** The fill of a part that is lost (hatched) rather than recovered (solid). */
export const hatch = (color: string): string =>
  `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)`;

export const barStyles = css`
  ha-card {
    /* The outline of the bar, its lanes and the legend swatches: stands out from the card in light and dark themes. */
    --hrv-bar-outline: color-mix(in srgb, var(--secondary-text-color, #727272) 50%, transparent);
    padding: 12px 16px;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0 12px;
    margin-bottom: 8px;
  }
  .title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  /* A title with a muted subtitle under it; the head aligns on the title's baseline. */
  .title-block {
    display: flex;
    flex-direction: column;
  }
  .subtitle {
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .net {
    font-size: 16px;
    font-weight: 500;
  }
  .bar {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 22px;
    border: 1px solid var(--hrv-bar-outline);
    border-radius: 6px;
    overflow: hidden;
    background: var(--secondary-background-color, #eee);
  }
  .bar.lanes {
    height: 28px;
  }
  .lane {
    position: relative;
    flex: 1 1 0;
  }
  /* The line between two lanes lies over them, like the zero line, so it takes no height from either lane. */
  .divider {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    margin-top: -0.5px;
    background: var(--hrv-bar-outline);
  }
  .seg {
    position: absolute;
    top: 0;
    bottom: 0;
    overflow: hidden;
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
  }
  .zero {
    position: absolute;
    top: -2px;
    bottom: -2px;
    left: 50%;
    width: 2px;
    margin-left: -1px;
    background: var(--primary-text-color);
    opacity: 0.6;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 8px;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  /* A legend item: its swatch, words and value stay on one line; lines break between items. */
  .legend .item {
    white-space: nowrap;
  }
  .swatch {
    display: inline-block;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border: 1px solid var(--hrv-bar-outline);
    border-radius: 2px;
    margin-right: 6px;
  }
`;

/**
 * Where a segment's fill sits, in % of the segment: over the whole bar, which the segment clips. Every fill then has
 * the same box, so the stripes of adjacent hatched segments line up as one pattern. Moving a fill sized to the bar
 * with background-position does not: Chrome lays the stripes out from each segment's own box, which drifts by up to
 * a few pixels at a seam.
 */
export function fillBox({ left, width }: Segment): { left: string; width: string } | undefined {
  if (width <= 0) return undefined;
  return { left: `${String((-left / width) * 100)}%`, width: `${String((100 / width) * 100)}%` };
}

/**
 * The bar: one lane per row of segments, all on the same scale, and the zero line in the centre across them. Two
 * lanes make the bar taller and are divided by a line across its middle.
 */
export function renderBar(lanes: readonly (readonly DrawnSegment[])[]): TemplateResult {
  return html`<div class="bar ${lanes.length > 1 ? 'lanes' : ''}">
    ${lanes.map(
      (lane) =>
        html`<div class="lane">
          ${lane.map((segment) => {
            const fill = fillBox(segment);
            return html`<div
              class="seg"
              style=${styleMap({ left: `${String(segment.left)}%`, width: `${String(segment.width)}%` })}
            >
              ${
                fill
                  ? html`<div class="fill" style=${styleMap({ ...fill, background: segment.background })}></div>`
                  : nothing
              }
            </div>`;
          })}
        </div>`,
    )}
    ${lanes.length === 2 ? html`<div class="divider"></div>` : nothing}
    <div class="zero"></div>
  </div>`;
}

/** A legend swatch in a fill, outlined like the bar. */
export function swatch(background: string): TemplateResult {
  return html`<span class="swatch" style=${styleMap({ background })}></span>`;
}
