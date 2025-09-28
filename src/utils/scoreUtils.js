/**
 * scoreUtils — shared score comparison helpers
 * Small, robust helper to compare two score entries across the app.
 * @module src/utils/scoreUtils
 * @author Sabata79
 * @since 2025-09-28
 * @updated 2025-09-28
 */

export const isBetterScore = (a, b) => {
  // Defensive guards
  if (!a && !b) return false;
  if (!a) return false;
  if (!b) return true;

  const ap = Number(a.points || 0);
  const bp = Number(b.points || 0);
  if (ap > bp) return true;
  if (ap < bp) return false;

  const ad = Number(a.duration || 0);
  const bd = Number(b.duration || 0);
  if (ad < bd) return true;
  if (ad > bd) return false;

  const parseDate = (d) => {
    if (typeof d === 'number') return d;
    if (!d) return Date.now();
    if (typeof d === 'string') {
      // Try dd.mm.yyyy style first
      const parts = d.trim().split(' ')[0].split('.');
      if (parts.length === 3 && parts[0].length <= 2) {
        const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const t = Date.parse(iso);
        if (!Number.isNaN(t)) return t;
      }
      const t2 = Date.parse(d);
      if (!Number.isNaN(t2)) return t2;
    }
    return Date.now();
  };

  const at = parseDate(a.date);
  const bt = parseDate(b.date);
  return at < bt;
};
