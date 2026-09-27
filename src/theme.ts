/**
 * Single source of truth for colour (Material 3–style roles).
 *
 *  - Neutral surfaces carry the UI; text and lines use on-surface / outline.
 *  - Primary marks what the player can operate; primary-container marks "selected".
 *  - Success / Error are reserved for outcomes (good part / any defect).
 *  - Resin (accent) is the one vivid exception: it is the star of the game,
 *    so it is used for the molten plastic only — never for UI chrome.
 *
 * `applyTheme()` exposes every role as a CSS variable (--c-*), and SVG
 * illustrations import the same values from here.
 */
export const palette = {
  // Primary (calm indigo) tonal steps
  primary: '#3f5a99',
  primaryStrong: '#27427f',
  onPrimary: '#ffffff',
  primaryContainer: '#dce2fb',
  onPrimaryContainer: '#0f2250',
  primarySoft: '#eef1fd',
  primaryTint: '#a9baea',

  // Secondary (neutral-blue, supporting UI)
  secondary: '#5b6072',
  secondaryContainer: '#e1e3ef',
  onSecondaryContainer: '#191c2a',

  // Neutral surfaces (low → high emphasis)
  background: '#f6f6f9',
  surface: '#ffffff',
  surfaceLow: '#f1f2f6',
  surfaceMid: '#ebecf1',
  surfaceHigh: '#e2e4eb',
  surfaceHighest: '#d7d9e1',
  onSurface: '#1b1d24',
  onSurfaceVariant: '#4a4d5a',
  outline: '#7a7d8a',
  outlineVariant: '#cfd1da',

  // Outcomes
  success: '#2f6b46',
  successContainer: '#d3ecdb',
  onSuccessContainer: '#0c2a17',
  error: '#b3372f',
  errorContainer: '#f8dedb',
  onErrorContainer: '#410e0b',

  // Resin (the one vivid accent — plastic only)
  resin: '#f07a2e',
  resinGlow: '#ffd7b3',

  // Illustration neutrals
  ink: '#2c303c',
  metalLight: '#eceef3',
  metal: '#d3d7e1',
  metalMid: '#bfc4d1',
  metalDark: '#4a4f5e',
  water: '#8fb0f0',
  glass: 'rgba(169,186,234,.28)',
  shadow: 'rgba(44,48,60,.09)',
} as const;

export type Palette = typeof palette;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

export function applyTheme(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(`--c-${kebab(k)}`, v);
}
