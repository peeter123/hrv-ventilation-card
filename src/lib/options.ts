// The non-entity options of a card (smoothing, colours, scales, layout): each card lists them in a table, and
// setConfig rejects a config with an invalid value instead of falling back to the default silently. A missing
// option uses its default.
import { OPTIONS } from '../strings';
import { valueAt, type CardConfig } from './config';

interface BaseOption<T> {
  /** Dotted config path, e.g. "smoothing" or "heating.color". */
  path: string;
  default: T;
}

/** A number; an optional one (such as a nominal flow) has no default and is undefined while left out. */
export interface NumberOption extends BaseOption<number | undefined> {
  kind: 'number';
  min: number;
  max: number;
}

export interface ColorOption extends BaseOption<string> {
  kind: 'color';
}

export interface BooleanOption extends BaseOption<boolean> {
  kind: 'boolean';
}

export interface ChoiceOption extends BaseOption<string> {
  kind: 'choice';
  choices: readonly string[];
}

/** A list of texts (such as the states that count as stopped); an empty list or a non-list value uses the default. */
export interface ListOption extends BaseOption<readonly string[]> {
  kind: 'list';
}

export type OptionSpec = NumberOption | ColorOption | BooleanOption | ChoiceOption | ListOption;

/** The type of an option's value: a number (or undefined without a default), a string, a boolean, a choice or a list. */
export type OptionValue<T extends OptionSpec> = T extends NumberOption
  ? number | Extract<T['default'], undefined>
  : T extends BooleanOption
    ? boolean
    : T extends ChoiceOption
      ? T['choices'][number]
      : T extends ListOption
        ? readonly string[]
        : string;

// One CSS colour as configs write it: a hex value (3, 4, 6 or 8 digits), a colour name, a colour function such as
// rgb(), hsl() or oklch() (units, `none` and var() inside are fine, e.g. Home Assistant's rgb(var(--rgb-primary-color)))
// or var(--name) with an optional fallback. A single colour, because it is also placed inside gradients; nothing that
// could end the CSS declaration it is placed in; and no CSS-wide keywords such as inherit or none.
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|var)\((.*)\)$/i;
const SAFE = /^[#a-zA-Z0-9(),.%\s/+-]+$/;
const COLOR_NAMES: ReadonlySet<string> = new Set([
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
  'transparent',
  'currentcolor',
]);

/** True when the brackets of the text are balanced and the whole text is one bracketed call. */
function oneCall(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') {
      depth--;
      // The outer call closes only at the very end.
      if (depth < 0 || (depth === 0 && i !== text.length - 1)) return false;
    }
  }
  return depth === 0;
}

function isColor(value: string): boolean {
  const text = value.trim();
  if (text.length === 0 || text.length > 100 || !SAFE.test(text)) return false;
  if (HEX.test(text) || COLOR_NAMES.has(text.toLowerCase())) return true;
  const call = COLOR_FUNCTION.exec(text);
  if (call === null || !oneCall(text)) return false;
  // var() must name a custom property; a fallback after a comma is checked as a colour itself.
  if (call[1]?.toLowerCase() !== 'var') return true;
  const [name, ...fallback] = (call[2] ?? '').split(',');
  return /^\s*--[a-zA-Z0-9-]+\s*$/.test(name ?? '') && (fallback.length === 0 || isColor(fallback.join(',')));
}

/** A key written without a value in YAML (`smoothing:`) is null; it counts as left out, like a missing key. */
const isLeftOut = (value: unknown): value is undefined | null => value === undefined || value === null;

/** What the option accepts, for the error message. */
function accepts(option: OptionSpec): string {
  switch (option.kind) {
    case 'number':
      return OPTIONS.number(String(option.min), String(option.max));
    case 'color':
      return OPTIONS.color;
    case 'boolean':
      return OPTIONS.boolean;
    case 'choice':
      return OPTIONS.choice(option.choices);
    case 'list':
      return OPTIONS.list;
  }
}

function isValid(option: OptionSpec, value: unknown): boolean {
  switch (option.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) && value >= option.min && value <= option.max;
    case 'color':
      return typeof value === 'string' && isColor(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'choice':
      return typeof value === 'string' && option.choices.includes(value);
    case 'list':
      return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}

/** The first parent of a nested option (e.g. "heating" of "heating.color") that is set but is not an object. */
function invalidParent(config: CardConfig, path: string): string | undefined {
  const keys = path.split('.').slice(0, -1);
  for (let i = 1; i <= keys.length; i++) {
    const parent = keys.slice(0, i).join('.');
    const value = valueAt(config, parent);
    if (!isLeftOut(value) && (typeof value !== 'object' || Array.isArray(value))) return parent;
  }
  return undefined;
}

/** The messages for every option with an invalid value; empty when all options are valid or left out. */
export function invalidOptions(config: CardConfig, options: readonly OptionSpec[]): string[] {
  const messages = options.flatMap((option) => {
    const parent = invalidParent(config, option.path);
    if (parent !== undefined) return [OPTIONS.invalid(parent, OPTIONS.object)];
    const value = valueAt(config, option.path);
    return isLeftOut(value) || isValid(option, value) ? [] : [OPTIONS.invalid(option.path, accepts(option))];
  });
  return [...new Set(messages)];
}

/**
 * The option's value, or its default when it is left out (or, for a list, empty or only blank texts). Blank texts of
 * a list are dropped: the editor's text list can hold an empty row. Call after invalidOptions found no problem.
 */
export function optionValue<T extends OptionSpec>(config: CardConfig, option: T): OptionValue<T> {
  const value = valueAt(config, option.path);
  if (option.kind === 'list' && Array.isArray(value) && isValid(option, value)) {
    const texts = (value as string[]).filter((text) => text.trim() !== '');
    return (texts.length > 0 ? texts : option.default) as OptionValue<T>;
  }
  return (isLeftOut(value) || !isValid(option, value) ? option.default : value) as OptionValue<T>;
}
