/**
 * Single source of truth for colour — Material 3 colour roles.
 *
 * Generated with Google's Material Color Utilities (Scheme.light, the M3 baseline
 * scheme) from the game's key colour #3f5a99, so the UI keeps its calm indigo.
 * Success is an M3 custom colour (source #2f6b46, not blended).
 *
 *  - Surfaces use the M3 surface-container ladder; text/lines use on-surface / outline.
 *  - Primary marks what the player can operate; secondary-container marks "selected".
 *  - Success / Error are reserved for outcomes (good part / any defect).
 *  - Resin is the one vivid exception: the molten plastic only, never UI chrome.
 *
 * `applyTheme()` exposes every role as a CSS variable (--c-*), and SVG
 * illustrations import the same values from here.
 */
const m3 = {
  primary: '#385ba9',
  onPrimary: '#ffffff',
  primaryContainer: '#dae2ff',
  onPrimaryContainer: '#001946',
  inversePrimary: '#b1c5ff',

  secondary: '#585e71',
  onSecondary: '#ffffff',
  secondaryContainer: '#dce2f9',
  onSecondaryContainer: '#151b2c',

  tertiary: '#725572',
  onTertiary: '#ffffff',
  tertiaryContainer: '#fdd7fa',
  onTertiaryContainer: '#2a122c',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  success: '#006d3d',
  onSuccess: '#ffffff',
  successContainer: '#97f7b6',
  onSuccessContainer: '#00210f',

  surface: '#fbf8fd',
  surfaceDim: '#dbd9dd',
  surfaceBright: '#fbf8fd',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f7',
  surfaceContainer: '#efedf1',
  surfaceContainerHigh: '#e9e7ec',
  surfaceContainerHighest: '#e4e2e6',
  onSurface: '#1b1b1f',
  onSurfaceVariant: '#44464f',
  outline: '#757780',
  outlineVariant: '#c5c6d0',
  inverseSurface: '#303034',
  inverseOnSurface: '#f2f0f4',
  scrim: '#000000',
  shadow: '#000000',
} as const;

export const palette = {
  ...m3,

  // Tonal steps of the primary palette (illustrations, hover tints)
  primaryStrong: '#1b438f', // P30
  primaryTint: '#b1c5ff', // P80
  primarySoft: '#eef0ff', // P95

  // Short aliases the illustrations use for the surface ladder
  background: m3.surface,
  surfaceLow: m3.surfaceContainerLow,
  surfaceMid: m3.surfaceContainer,
  surfaceHigh: m3.surfaceContainerHigh,
  surfaceHighest: m3.surfaceContainerHighest,

  // Resin (the one vivid accent — plastic only)
  resin: '#f07a2e',
  resinGlow: '#ffd7b3',

  // Illustration neutrals (machine drawing — unchanged toy style)
  ink: '#2c303c',
  metalLight: '#eceef3',
  metal: '#d3d7e1',
  metalMid: '#bfc4d1',
  metalDark: '#4a4f5e',
  water: '#8fb0f0',
  glass: 'rgba(169,186,234,.28)',
} as const;

export type Palette = typeof palette;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

export function applyTheme(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(`--c-${kebab(k)}`, v);
}
