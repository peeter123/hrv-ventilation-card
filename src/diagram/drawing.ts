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

// The supply path's cubic (x0 y0 x1 y1 x2 y2 x3 y3), which the pre-heater coil follows.
const SUPPLY_CUBIC = [86, 62, 160, 62, 240, 138, 306, 138] as const;

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

// The pre-heater coil: a smooth wave wire along the outdoor stream (the supply path's start), right of the outdoor
// stack (x 70 at most) and left of the bypass path's first bend. Its centreline is the stream's own, its amplitude the
// stream's half-width, so the first and last points (round caps) sit on the stream's borders. Three crests on each
// side: from the upper border, down, up, down, up, down to the lower border.
const COIL_X = { from: 102.8, to: 125.2 } as const;
const COIL_HALF_WAVES = 5;
const COIL_SAMPLES = 48;

/** A point of the supply stream's cubic centreline and its unit normal (pointing down, to the lower border). */
function streamPoint(t: number): { x: number; y: number; nx: number; ny: number } {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = SUPPLY_CUBIC;
  const u = 1 - t;
  const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
  const d = [3 * u * u, 6 * u * t, 3 * t * t] as const;
  const x = b[0] * x0 + b[1] * x1 + b[2] * x2 + b[3] * x3;
  const y = b[0] * y0 + b[1] * y1 + b[2] * y2 + b[3] * y3;
  const dx = d[0] * (x1 - x0) + d[1] * (x2 - x1) + d[2] * (x3 - x2);
  const dy = d[0] * (y1 - y0) + d[1] * (y2 - y1) + d[2] * (y3 - y2);
  const length = Math.hypot(dx, dy);
  return { x, y, nx: -dy / length, ny: dx / length };
}

/** The parameter of the supply cubic at an x (x grows monotonically along it). */
function parameterAt(x: number): number {
  let [low, high] = [0, 1];
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (streamPoint(mid).x < x) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** The coil's wire as points: the stream's centreline moved along its normal by the half-width times a cosine. */
export function coilPoints(): { x: number; y: number }[] {
  const [t0, t1] = [parameterAt(COIL_X.from), parameterAt(COIL_X.to)];
  return Array.from({ length: COIL_SAMPLES + 1 }, (_, i) => {
    const s = i / COIL_SAMPLES;
    const p = streamPoint(t0 + (t1 - t0) * s);
    const offset = (STROKE / 2) * -Math.cos(COIL_HALF_WAVES * Math.PI * s);
    return { x: rounded(p.x + p.nx * offset, 2), y: rounded(p.y + p.ny * offset, 2) };
  });
}

const COIL = coilPoints()
  .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${String(x)} ${String(y)}`)
  .join(' ');
const COIL_WIDTH = 3;

/** Percent of white in the wire at full level; it falls linearly to 0 at level 0. */
const CORE_WHITE = 45;

// A cloud and a house, drawn in a 24 by 24 box like an icon.
const CLOUD = 'M 6.5 18 A 4.5 4.5 0 0 1 6 9.05 A 6 6 0 0 1 17.5 10 A 4 4 0 0 1 17.5 18 Z';
const HOUSE = 'M 12 4 L 21 12 L 18 12 L 18 20 L 14 20 L 14 15 L 10 15 L 10 20 L 6 20 L 6 12 L 3 12 Z';

/** The IDs one card instance gives its gradients and clip path: unique per instance, as several cards share a page's IDs. */
export interface DrawingIds {
  supply: string;
  exhaust: string;
  /** The clip path of the exchanger's rim, which the moisture ring is clipped to. */
  rim: string;
}

let instances = 0;

/** New gradient and clip IDs for a card instance. */
export function drawingIds(): DrawingIds {
  instances += 1;
  const suffix = String(instances);
  return { supply: `hrv-supply-${suffix}`, exhaust: `hrv-exhaust-${suffix}`, rim: `hrv-rim-${suffix}` };
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

/** The pre-heater coil: dim in the secondary text colour while off, else the glow colour over a blurred glow. */
function coilWire({ level, color }: Coil): SVGTemplateResult {
  if (level <= 0) {
    return svg`<path class="coil off" d=${COIL} fill="none" stroke-width=${COIL_WIDTH} stroke-linejoin="round"></path>`;
  }
  // A filament: the wire is the glow colour towards the text colour, then lightened towards white as the level rises
  // (up to 45 % at full), so the core reads hotter and lighter than the halo of the pure glow colour behind it.
  const heated = `color-mix(in srgb, ${color} ${String(rounded(glowShare(level), 1))}%, var(--secondary-text-color))`;
  const stroke = `color-mix(in srgb, ${heated} ${String(rounded(100 - CORE_WHITE * level, 1))}%, white)`;
  return svg`<path class="coil-glow" d=${COIL} fill="none" stroke-width=${COIL_WIDTH * 1.5} stroke-linejoin="round"
      opacity=${rounded(glowShare(level) / 100, 3)}
      style=${styleMap({ stroke: color, '--glow-opacity': String(rounded(glowShare(level) / 100, 3)) })}></path>
    <path class="coil on" d=${COIL} fill="none" stroke-width=${COIL_WIDTH} stroke-linejoin="round"
      style=${styleMap({ stroke })}></path>`;
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
    ${coil ? coilWire(coil) : null}
    <polygon class="head" points=${HEADS.supply} style=${styleMap({ fill: colors.supply })}></polygon>
    ${streamPath('exhaust', exhaustStroke, 1)}
    <polygon class="head" points=${HEADS.exhaust} style=${styleMap({ fill: colors.exhaust })}></polygon>
  </svg>`;
}
