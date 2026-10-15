// The part of gifenc (no published types) that scripts/capture.mjs uses. gifenc is CommonJS, so it is imported as
// its default export.
declare module 'gifenc' {
  type Palette = number[][];
  interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options: { palette: Palette; delay: number }): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  const gifenc: {
    GIFEncoder(): Encoder;
    quantize(rgba: Uint8Array, maxColors: number): Palette;
    applyPalette(rgba: Uint8Array, palette: Palette): Uint8Array;
  };
  export default gifenc;
}
