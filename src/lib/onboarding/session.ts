// Scoped to the account and tab. Explicit login resets this; cookie refresh does not.
const fallback = new Map<string, string>();
function key(userId: number, kind: string) {
  return `mev_onboarding_${userId}_${kind}`;
}

export function readSession(userId: number, kind: string): string | null {
  const name = key(userId, kind);
  try {
    return sessionStorage.getItem(name);
  } catch {
    return fallback.get(name) ?? null;
  }
}

export function writeSession(
  userId: number,
  kind: string,
  value: string | null,
) {
  const name = key(userId, kind);
  if (value === null) fallback.delete(name);
  else fallback.set(name, value);
  try {
    if (value === null) sessionStorage.removeItem(name);
    else sessionStorage.setItem(name, value);
  } catch {
    /* Storage restrictions must not block learning. */
  }
}

export function dismissOnboarding(userId: number) {
  writeSession(userId, "checked", "true");
  writeSession(userId, "draft", null);
}

export function restartOnboarding(userId: number) {
  // Keep the automatic gate dismissed and clear only the unfinished answers.
  // The explicit /onboarding route can then start from goal selection without
  // forcing the user back into onboarding after they leave it.
  writeSession(userId, "draft", null);
}

export function resetOnboardingSession(userId: number) {
  writeSession(userId, "checked", null);
  writeSession(userId, "draft", null);
}
