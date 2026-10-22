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

const STROKE = 14;

// The stream ends: the outdoor stream starts at IN and the supply stream ends at OUT; the extract and exhaust streams
// mirror them across the middle. Each end has a straight lead of LEAD units: the outdoor air runs straight to the
// point where the bypass splits off (SPLIT), and the supply air and the bypass run straight from the point where they
// merge (MERGE) to the arrowhead. The pre-heater coil sits on the outdoor lead, on the air before the split.
const IN = { x: 86, y: 62 } as const;
const OUT = { x: 306, y: 138 } as const;
const LEAD = 34;
const SPLIT = IN.x + LEAD;
const MERGE = OUT.x - LEAD;
const mirror = (x: number): number => VIEW_BOX.width - x;

// The supply stream's curve between the leads (control points), and the bypass's two curves around the exchanger.
const SUPPLY_CURVE = `C ${String(SPLIT + 51)} ${String(IN.y)} ${String(MERGE - 46)} ${String(OUT.y)} ${String(MERGE)} ${String(OUT.y)}`;
const BYPASS_CURVES =
  `C ${String(SPLIT + 20)} ${String(IN.y)} ${String(SPLIT + 5)} 192 200 192 ` +
  `C ${String(MERGE - 23)} 192 ${String(MERGE - 18)} ${String(OUT.y)} ${String(MERGE)} ${String(OUT.y)}`;
const leads = (curve: string): string =>
  `M ${String(IN.x)} ${String(IN.y)} L ${String(SPLIT)} ${String(IN.y)} ${curve} L ${String(OUT.x)} ${String(OUT.y)}`;

/** The paths of the streams and the bypass, also used by the animated overlays. */
export const PATHS = {
  supply: leads(SUPPLY_CURVE),
  // The supply stream mirrored: from the extract corner, across the exchanger, to the exhaust arrow.
  exhaust: `M ${String(mirror(IN.x))} ${String(IN.y)} L ${String(mirror(SPLIT))} ${String(IN.y)} C ${String(mirror(SPLIT + 51))} ${String(IN.y)} ${String(mirror(MERGE - 46))} ${String(OUT.y)} ${String(mirror(MERGE))} ${String(OUT.y)} L ${String(mirror(OUT.x))} ${String(OUT.y)}`,
  // Between the exchanger and the exhaust flow label above the exhaust arrow, then below the exchanger.
  bypass: leads(BYPASS_CURVES),
} as const;

/** Rounded to a number of decimals, so float noise (1 - 0.07 = 0.9299999999999999) stays out of the DOM. */
const rounded = (value: number, decimals: number): number => Math.round(value * 10 ** decimals) / 10 ** decimals;

// The arrowheads at the supply and exhaust ends, wider than the stroke. The stream ends stay clear of the outer
// 70 units, where the corner labels are.
const HEADS = {
  supply: '306,124 326,138 306,152',
  exhaust: '94,124 74,138 94,152',
};

const EXCHANGER = '175.8,26 224.2,26 255,100 224.2,174 175.8,174 145,100';
const EXCHANGER_INNER = '181.3,38 218.7,38 240.7,100 218.7,162 181.3,162 159.3,100';

// The effectiveness rings start at the top centre and run clockwise. The moisture ring is a stroke along the rim's
// midline, wider than the rim and clipped to it (RIM), so it fills the rim from outline to outline; the empty rim is
// its track. The total ring runs along the inner outline over a faint track.
const MOISTURE_RING = {
  d: 'M 200 32 L 221.45 32 L 247.85 100 L 221.45 168 L 178.55 168 L 152.15 100 L 178.55 32 Z',
  width: 14,
};
const TOTAL_RING = {
  d: 'M 200 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 L 181.3 38 Z',
  width: 3,
};
// The rim: both hexagons in one path, filled evenodd, so the clip leaves out the core.
const RIM =
  'M 175.8 26 L 224.2 26 L 255 100 L 224.2 174 L 175.8 174 L 145 100 Z ' +
  'M 181.3 38 L 218.7 38 L 240.7 100 L 218.7 162 L 181.3 162 L 159.3 100 Z';

/** Percent of the mode's colour in the total ring (the rest is the text colour): the largest that keeps 3:1 against the core and the moisture ring. */
const TOTAL_RING_SHARE = 45;

// The pre-heater coil: a smooth wave wire on the outdoor lead (the straight start of the outdoor stream, before the
// bypass splits off), right of the outdoor stack (x 70 at most) and left of the split. Its centreline is the stream's
// own, its amplitude the stream's half-width, so the first and last points (round caps) sit on the stream's borders.
// Three crests on each side: from the upper border, down, up, down, up, down to the lower border. It is centred on
// the lead.
const COIL_LENGTH = 22.4;
const COIL_X = { from: IN.x + (LEAD - COIL_LENGTH) / 2, to: SPLIT - (LEAD - COIL_LENGTH) / 2 } as const;
const COIL_HALF_WAVES = 5;
const COIL_SAMPLES = 48;
const COIL_WIDTH = 3;
/** The coil's glow stroke is half as wide again as the wire; the blur spreads it by about three of its deviations. */
const GLOW_WIDTH = COIL_WIDTH * 1.5;
const GLOW_BLUR = 1.5;

/** The coil's wire as points: the lead's centreline (y constant) moved down by the half-width times a cosine. */
export function coilPoints(): { x: number; y: number }[] {
  return Array.from({ length: COIL_SAMPLES + 1 }, (_, i) => {
    const s = i / COIL_SAMPLES;
    const offset = (STROKE / 2) * -Math.cos(COIL_HALF_WAVES * Math.PI * s);
    return { x: rounded(COIL_X.from + (COIL_X.to - COIL_X.from) * s, 2), y: rounded(IN.y + offset, 2) };
  });
}

const COIL = coilPoints()
  .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${String(x)} ${String(y)}`)
  .join(' ');

/** The coil's area in user units: the wire's bounds grown by the glow's half stroke and blur. */
function coilArea(): { x: number; y: number; width: number; height: number } {
  const points = coilPoints();
  const [xs, ys] = [points.map((p) => p.x), points.map((p) => p.y)];
  const reach = GLOW_WIDTH / 2 + 3 * GLOW_BLUR;
  const [left, top] = [Math.min(...xs) - reach, Math.min(...ys) - reach];
  return { x: left, y: top, width: Math.max(...xs) + reach - left, height: Math.max(...ys) + reach - top };
}

/** The coil's tap box as CSS percentages of the drawing band, from the coil's bounds (the wire and its glow). */
export function coilBox(): { left: string; top: string; width: string; height: string } {
  const area = coilArea();
  const percent = (value: number, of: number): string => `${String(rounded((value / of) * 100, 2))}%`;
  return {
    left: percent(area.x, VIEW_BOX.width),
    top: percent(area.y, VIEW_BOX.height),
    width: percent(area.width, VIEW_BOX.width),
    height: percent(area.height, VIEW_BOX.height),
  };
}

/** Percent of white in the wire at full level; it falls linearly to 0 at level 0. */
const CORE_WHITE = 45;

// A cloud and a house, drawn in a 24 by 24 box like an icon.
const CLOUD = 'M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z';
const HOUSE = 'M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z';

/** The IDs one card instance gives its gradients, clip path and filter: unique per instance, as several cards share a page's IDs. */
export interface DrawingIds {
  supply: string;
  exhaust: string;
  /** The clip path of the exchanger's rim, which the moisture ring is clipped to. */
  rim: string;
  /** The blur filter of the pre-heater coil's glow. */
  blur: string;
}

let instances = 0;

/** New gradient, clip and filter IDs for a card instance. */
export function drawingIds(): DrawingIds {
  instances += 1;
  const suffix = String(instances);
  return {
    supply: `hrv-supply-${suffix}`,
    exhaust: `hrv-exhaust-${suffix}`,
    rim: `hrv-rim-${suffix}`,
    blur: `hrv-blur-${suffix}`,
  };
}

/** The `exchanger_type` option: heat recovery (HRV) or energy recovery (ERV), which also passes moisture. */
export type ExchangerType = 'hrv' | 'erv';

/** The effectiveness rings (the `show_effectiveness` option). A ring without a figure is empty, with its track. */
export interface Rings {
  /** The total effectiveness in %. */
  total: number | undefined;
  /** The moisture ring, drawn when set: an ERV with humidity for every stream. Its effectiveness in %. */
  moisture?: { figure: number | undefined };
  /** The total ring's colour: the warm colour in heating, the cold colour in cooling. */
  color: string;
}

/** The pre-heater coil (drawn only with `pre_heater.power`). */
export interface Coil {
  /** How hot it glows, 0 (off) to 1; see `preHeaterLevel`. */
  level: number;
  /** The colour it glows in: the `pre_heater.glow_color` option (a warm orange by default). */
  color: string;
}

export interface DrawingInput {
  ids: DrawingIds;
  /** Sets the exchanger's class, which the card's styles fill grey (HRV) or blue-grey (ERV). */
  exchanger: ExchangerType;
  /** The colour of each stream end. */
  colors: Readonly<Record<Stream, string>>;
  /** The share of the outdoor air taking the bypass, 0 to 1. */
  bypass: number;
  /** The speed factor of each stream (see flow.ts); 0 stands still. */
  speeds: { supply: number; exhaust: number };
  /** The effectiveness rings; none without it. */
  rings?: Rings;
  /** The pre-heater coil; none without it. */
  coil?: Coil;
}

/** The time the dashes take to move one dash pattern at the medium speed, in seconds. */
export const BASE_DURATION = 1.5;

/** The CSS custom properties that set a stream's animation: its duration, and paused while it stands still. */
function speedProperties(stream: 'supply' | 'exhaust', speed: number): Record<string, string> {
  const duration = speed > 0 ? rounded(BASE_DURATION / speed, 3) : BASE_DURATION;
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

/** A ring's dash: its paths have pathLength 100, so a dash of the figure's length is the figure in %. */
const dash = (figure: number | undefined): string => `${String(rounded(figure ?? 0, 2))} 100`;

/** The moisture ring, clipped to the rim; its colour is the `.ring.moisture` rule of the card. */
function moistureRing(rim: string, figure: number | undefined): SVGTemplateResult {
  return svg`<path class="ring moisture" d=${MOISTURE_RING.d} fill="none" stroke-width=${MOISTURE_RING.width}
    pathLength="100" stroke-dasharray=${dash(figure)} clip-path="url(#${rim})"></path>`;
}

/** The total ring on the inner outline and the faint full-length track under it. */
function totalRing(color: string, figure: number | undefined): SVGTemplateResult {
  const { d, width } = TOTAL_RING;
  // The mode's colour towards the theme's text colour: darker on a light theme, lighter on a dark one.
  const ringColor = `color-mix(in srgb, ${color} ${String(TOTAL_RING_SHARE)}%, var(--primary-text-color))`;
  return svg`<path class="ring-track total" d=${d} fill="none" stroke-width=${width}
      style=${styleMap({ stroke: `color-mix(in srgb, ${ringColor} 25%, var(--secondary-background-color))` })}></path>
    <path class="ring total" d=${d} fill="none" stroke-width=${width} pathLength="100" stroke-dasharray=${dash(figure)}
      style=${styleMap({ stroke: ringColor })}></path>`;
}

/** Percent of the glow colour at a level: from 30 % at the lowest level to 100 %, so a partial level visibly glows. */
export const glowShare = (level: number): number => 30 + 70 * level;

/** The centreline's width: a third of the wire's, so it stays inside the wire. */
const CORE_WIDTH = 1;

/**
 * The centreline's lightness as a factor of its base colour's (OKLCH relative colour, same hue and chroma): the wire's
 * glow colour before the white lightening while lit, the secondary text colour while off. 0.9 keeps a warm amber
 * instead of a brown, and stays darker than the lit wire, which is that colour lightened towards white.
 */
export const CORE_LIGHTNESS = 0.9;

/** A darker shade of a colour: lower lightness, same chroma and hue (no mixing with black, which greys it). */
export const darker = (color: string): string => `oklch(from ${color} calc(l * ${String(CORE_LIGHTNESS)}) c h)`;

/** Percent of the base colour in the centreline's fallback, for browsers without relative colour syntax (the rest is black). */
const CORE_FALLBACK_SHARE = 80;

/** The centreline's fallback: the card's existing colour mixing, used where `darker` is not understood. */
export const darkerFallback = (color: string): string =>
  `color-mix(in srgb, ${color} ${String(CORE_FALLBACK_SHARE)}%, black)`;

/**
 * The pre-heater coil: dim in the secondary text colour while off, else the glow colour over a blurred glow. Either way
 * a thin centreline (`coil-core`) in a darker shade of the wire's colour before the whitening follows the wire's path; its colour while off
 * is in the card's CSS (see `darker`), with the off group's opacity.
 */
function coilWire({ level, color }: Coil, blur: string): SVGTemplateResult {
  if (level <= 0) {
    return svg`<g class="coil off">
      <path class="coil" d=${COIL} fill="none" stroke-width=${COIL_WIDTH} stroke-linejoin="round"></path>
      <path class="coil-core" d=${COIL} fill="none" stroke-width=${CORE_WIDTH} stroke-linejoin="round"></path>
    </g>`;
  }
  const share = glowShare(level);
  // A filament: the wire is the glow colour towards the text colour, then lightened towards white as the level rises
  // (up to 45 % at full), so the core reads hotter and lighter than the halo of the pure glow colour behind it.
  const heated = `color-mix(in srgb, ${color} ${String(rounded(share, 1))}%, var(--secondary-text-color))`;
  const stroke = `color-mix(in srgb, ${heated} ${String(rounded(100 - CORE_WHITE * level, 1))}%, white)`;
  const glow = String(rounded(share / 100, 3));
  return svg`<path class="coil-glow" d=${COIL} fill="none" stroke-width=${GLOW_WIDTH} stroke-linejoin="round"
      filter="url(#${blur})" opacity=${glow}
      style=${styleMap({ stroke: color, '--glow-opacity': glow })}></path>
    <path class="coil on" d=${COIL} fill="none" stroke-width=${COIL_WIDTH} stroke-linejoin="round"
      style=${styleMap({ stroke })}></path>
    <path class="coil-core" d=${COIL} fill="none" stroke-width=${CORE_WIDTH} stroke-linejoin="round"
      stroke=${darkerFallback(heated)} style=${styleMap({ stroke: darker(heated) })}></path>`;
}

/** The blur of the coil's glow, over the coil's area (the default filter region is too small for a thin wave). */
function blurFilter(id: string): SVGTemplateResult {
  const { x, y, width, height } = coilArea();
  return svg`<filter id=${id} filterUnits="userSpaceOnUse" x=${x} y=${y} width=${width} height=${height}>
    <feGaussianBlur stdDeviation=${GLOW_BLUR}></feGaussianBlur>
  </filter>`;
}

/** The drawing for the current colours and bypass strength. A path at strength 0 is left out. */
export function drawing({ ids, exchanger, colors, bypass, speeds, rings, coil }: DrawingInput): SVGTemplateResult {
  const [around, through] = [rounded(bypass, 3), rounded(1 - bypass, 3)];
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
      <clipPath id=${ids.rim}><path d=${RIM} clip-rule="evenodd"></path></clipPath>
      ${coil ? blurFilter(ids.blur) : null}
    </defs>
    ${symbol(36, colors.outdoor, CLOUD)}
    ${symbol(364, colors.extract, HOUSE)}
    <polygon class="exchanger ${exchanger}" points=${EXCHANGER}></polygon>
    ${rings?.moisture ? moistureRing(ids.rim, rings.moisture.figure) : null}
    <polygon class="outline" points=${EXCHANGER}></polygon>
    <polygon class="exchanger-inner" points=${EXCHANGER_INNER}></polygon>
    ${rings ? totalRing(rings.color, rings.total) : null}
    ${streamPath('bypass', supplyStroke, around)}
    ${streamPath('supply', supplyStroke, through)}
    ${coil ? coilWire(coil, ids.blur) : null}
    <polygon class="head" points=${HEADS.supply} style=${styleMap({ fill: colors.supply })}></polygon>
    ${streamPath('exhaust', exhaustStroke, 1)}
    <polygon class="head" points=${HEADS.exhaust} style=${styleMap({ fill: colors.exhaust })}></polygon>
  </svg>`;
}
