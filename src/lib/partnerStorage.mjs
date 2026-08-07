const TRANSIENT_KEYS = new Set([
  "aiMode",
  "connectionStatus",
  "systemNotice",
  "lastFailedRequest",
]);

export function sanitizePartnerState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return state;
  return Object.fromEntries(
    Object.entries(state).filter(([key]) => !TRANSIENT_KEYS.has(key)),
  );
}

export function serializePartnerState(state) {
  return JSON.stringify(sanitizePartnerState(state));
}

export function clearPartnerStorage(storage, keys) {
  for (const key of keys) storage.removeItem(key);
}
