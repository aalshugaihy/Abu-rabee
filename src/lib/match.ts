/**
 * Match a free-form text label (Arabic or English) against a list of allowed
 * codes by comparing it with each code's translated label. Returns the matched
 * code, or undefined if no match.
 *
 * This lets us re-import what we exported, where exported CSV cells contain
 * localized labels (e.g. "قائم" or "Active") rather than raw enum codes.
 */
export function matchLabel<Code extends string>(
  value: string | undefined,
  codes: readonly Code[],
  label: (code: Code) => string
): Code | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  // Exact code match first.
  for (const c of codes) if (c.toLowerCase() === v) return c;
  // Localized label match.
  for (const c of codes) if (label(c).trim().toLowerCase() === v) return c;
  return undefined;
}
