/** Preset hex swatches for client calendar accent (Tailwind-friendly hues). */
export const CLIENT_ACCENT_PRESETS = [
  '#6366f1',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#a855f7',
  '#0ea5e9',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#64748b',
] as const;

export function normalizeClientAccentHex(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  if (!t) {
    return null;
  }
  const match = /^#([0-9A-Fa-f]{6})$/.exec(t);
  return match ? `#${match[1].toLowerCase()}` : null;
}

/** Use stored hex when valid; otherwise a stable hue from `clientId`. */
export function resolveClientAccentHex(
  stored: string | null | undefined,
  clientId: number,
): string {
  const normalized = normalizeClientAccentHex(stored);
  if (normalized) {
    return normalized;
  }
  const palette = CLIENT_ACCENT_PRESETS;
  return palette[clientId % palette.length] ?? '#64748b';
}
