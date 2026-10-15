/** A text as the cards write it: a no-break space between each number and its unit (W, g/h, g/m³, %). */
export const nb = (text: string): string => text.replace(/(\d|n\/a) (W|g\/h|g\/m³|%)/g, '$1\u00a0$2');
