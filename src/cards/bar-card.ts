// The base of the two bar cards: the shared card base with the bar styles and the bar cards' sizing.
import type { CSSResultGroup } from 'lit';
import { barStyles } from './bar';
import { HrvCard, sampleStyles } from './base-card';

export abstract class BarCard extends HrvCard {
  static override styles: CSSResultGroup = [barStyles, sampleStyles];

  /** Height in masonry views (rows of 50 px): header, bar and a legend of one or two lines. */
  getCardSize(): number {
    return 3;
  }

  /** Sections view: full width, height from the content (no rows). */
  getGridOptions(): { columns: number; min_columns: number } {
    return { columns: 12, min_columns: 6 };
  }
}
