/** Linear blend of two #rrggbb colors. k=0 -> a, k=1 -> b. */
export function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * k);
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
