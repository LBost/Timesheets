import {
  CLIENT_ACCENT_PRESETS,
  normalizeClientAccentHex,
  resolveClientAccentHex,
} from './client-accent.util';

describe('client-accent.util', () => {
  it('normalizeClientAccentHex accepts valid lowercase hex', () => {
    expect(normalizeClientAccentHex('#aabbcc')).toBe('#aabbcc');
    expect(normalizeClientAccentHex('  #AA00FF ')).toBe('#aa00ff');
  });

  it('normalizeClientAccentHex rejects invalid values', () => {
    expect(normalizeClientAccentHex('')).toBeNull();
    expect(normalizeClientAccentHex('#fff')).toBeNull();
    expect(normalizeClientAccentHex('red')).toBeNull();
  });

  it('resolveClientAccentHex falls back deterministically', () => {
    const fb = resolveClientAccentHex(null, 7);
    expect(CLIENT_ACCENT_PRESETS).toContain(fb);
    expect(resolveClientAccentHex('#22c55e', 999)).toBe('#22c55e');
  });
});
