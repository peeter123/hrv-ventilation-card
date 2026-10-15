// The SVG drawing of the airflow diagram: the exchanger, the two crossing streams with a gradient each, the bypass
// path, and the outdoor and house symbols. No text: the labels are HTML on top (see the card). Colours come from the
// theme's variables and the stream colours, so the drawing works in light and dark themes.
//
// The streams run from the top corners to the opposite bottom corners: outdoor air (top left) to supply air (bottom
// right, into the house), extract air (top right) to exhaust air (bottom left). The bypass carries the outdoor air
// below the exchanger to the supply end.
//
// Moving air: each drawn path has a dashed overlay with the same geometry and opacity, whose dashes a CSS animation
// moves in the flow direction. Each stream's speed is a CSS custom property on the drawing, so a speed change does not
// restart the animation; the card's styles stop it with `animation.enabled: false` or reduced motion.
import { svg, type SVGTemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type { Stream } from '../lib/config';

/** The drawing's coordinate system: 2 by 1, the drawing band's aspect ratio. */
export const VIEW_BOX = { width: 400, height: 200 };

/** The paths of the streams and the bypass, also used by the animated overlays. */
export const PATHS = {
  supply: 'M 86 62 C 160 62 240 138 306 138',
  exhaust: 'M 314 62 C 240 62 160 138 94 138',
  // Between the exchanger and the exhaust flow label above the exhaust arrow, then below the exchanger.
  bypass: 'M 86 62 C 146 62 124 192 200 192 C 272 192 280 138 306 138',
} as const;

const STROKE = 14;

// The arrowheads at the supply and exhaust ends, wider than the stroke. The stream ends stay clear of the outer
// 70 units, where the corner labels are.
const HEADS = {
  supply: '306,124 326,138 306,152',
  exhaust: '94,124 74,138 94,152',
};

const EXCHANGER = '175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100';
const EXCHANGER_INNER = '181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100';

// A cloud and a house, drawn in a 24 by 24 box like an icon.
const CLOUD = 'M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z';
const HOUSE = 'M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z';

/** The IDs one card instance gives its gradients: unique per instance, as several cards share a page's IDs. */
export interface DrawingIds {
  supply: string;
  exhaust: string;
}

let instances = 0;

/** New gradient IDs for a card instance. */
export function drawingIds(): DrawingIds {
  instances += 1;
  const suffix = String(instances);
  return { supply: `hrv-supply-${suffix}`, exhaust: `hrv-exhaust-${suffix}` };
}

export interface DrawingInput {
  ids: DrawingIds;
  /** The colour of each stream end. */
  colors: Readonly<Record<Stream, string>>;
  /** The share of the outdoor air taking the bypass, 0 to 1. */
  bypass: number;
  /** The speed factor of each stream (see flow.ts); 0 stands still. */
  speeds: { supply: number; exhaust: number };
}

/** The time the dashes take to move one dash pattern at the medium speed, in seconds. */
export const BASE_DURATION = 1.5;

/** The CSS custom properties that set a stream's animation: its duration, and paused while it stands still. */
function speedProperties(stream: 'supply' | 'exhaust', speed: number): Record<string, string> {
  const duration = speed > 0 ? Math.round((BASE_DURATION / speed) * 1000) / 1000 : BASE_DURATION;
  return {
    [`--${stream}-duration`]: `${String(duration)}s`,
    [`--${stream}-state`]: speed > 0 ? 'running' : 'paused',
  };
}

/**
 * A stream path and its moving overlay, both at the path's strength; nothing at strength 0. The bypass carries
 * supply air, so its overlay moves at the supply air's speed.
 */
function streamPath(name: keyof typeof PATHS, stroke: string, strength: number): SVGTemplateResult | null {
  if (strength <= 0) return null;
  const air = name === 'exhaust' ? 'exhaust' : 'supply';
  return svg`<path class="stream ${name}" d=${PATHS[name]} stroke=${stroke} stroke-width=${STROKE}
      opacity=${strength}></path>
    <path class="flow ${air}-air" d=${PATHS[name]} opacity=${strength}></path>`;
}

const stop = (offset: string, color: string): SVGTemplateResult =>
  // stop-color as a style, not an attribute: presentation attributes do not resolve var().
  svg`<stop offset=${offset} style=${styleMap({ 'stop-color': color })}></stop>`;

const symbol = (x: number, color: string, shape: string): SVGTemplateResult =>
  svg`<g class="symbol">
    <circle cx=${x} cy="100" r="20" style=${styleMap({ fill: color })}></circle>
    <path d=${shape} transform="translate(${String(x - 12)} ${String(100 - 12)})"></path>
  </g>`;

/** The drawing for the current colours and bypass strength. A path at strength 0 is left out. */
export function drawing({ ids, colors, bypass, speeds }: DrawingInput): SVGTemplateResult {
  // Rounded, so float noise (1 - 0.07 = 0.9299999999999999) stays out of the DOM.
  const share = (value: number): number => Math.round(value * 1000) / 1000;
  const [around, through] = [share(bypass), share(1 - bypass)];
  const supplyStroke = `url(#${ids.supply})`;
  const exhaustStroke = `url(#${ids.exhaust})`;
  return svg`<svg
    class="art"
    viewBox="0 0 ${String(VIEW_BOX.width)} ${String(VIEW_BOX.height)}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    style=${styleMap({ ...speedProperties('supply', speeds.supply), ...speedProperties('exhaust', speeds.exhaust) })}
  >
    <defs>
      <linearGradient id=${ids.supply} gradientUnits="userSpaceOnUse" x1="86" y1="62" x2="326" y2="138">
        ${stop('0', colors.outdoor)}${stop('1', colors.supply)}
      </linearGradient>
      <linearGradient id=${ids.exhaust} gradientUnits="userSpaceOnUse" x1="314" y1="62" x2="74" y2="138">
        ${stop('0', colors.extract)}${stop('1', colors.exhaust)}
      </linearGradient>
    </defs>
    ${symbol(36, colors.outdoor, CLOUD)}
    ${symbol(364, colors.extract, HOUSE)}
    <polygon class="exchanger" points=${EXCHANGER}></polygon>
    <polygon class="exchanger-inner" points=${EXCHANGER_INNER}></polygon>
    ${streamPath('bypass', supplyStroke, around)}
    ${streamPath('supply', supplyStroke, through)}
    <polygon class="head" points=${HEADS.supply} style=${styleMap({ fill: colors.supply })}></polygon>
    ${streamPath('exhaust', exhaustStroke, 1)}
    <polygon class="head" points=${HEADS.exhaust} style=${styleMap({ fill: colors.exhaust })}></polygon>
  </svg>`;
}
