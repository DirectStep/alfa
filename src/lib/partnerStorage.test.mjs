import assert from "node:assert/strict";
import test from "node:test";
import { sanitizePartnerState, serializePartnerState } from "./partnerStorage.mjs";

test("network fallback state is never persisted", () => {
  const state = {
    version: 1,
    phase: "collecting",
    aiMode: "fallback",
    connectionStatus: "demo",
    systemNotice: "temporary",
    lastFailedRequest: { message: "test" },
    passport: { product: "Худи" },
    partnerHistory: [{ id: "1", role: "user", text: "Привет" }],
  };

  const parsed = JSON.parse(serializePartnerState(state));
  assert.equal(parsed.aiMode, undefined);
  assert.equal(parsed.connectionStatus, undefined);
  assert.equal(parsed.systemNotice, undefined);
  assert.equal(parsed.lastFailedRequest, undefined);
  assert.equal(parsed.passport.product, "Худи");
  assert.equal(parsed.partnerHistory.length, 1);
});

test("legacy fallback marker is removed during hydration", () => {
  const hydrated = sanitizePartnerState({ version: 1, aiMode: "fallback", team: [] });
  assert.deepEqual(hydrated, { version: 1, team: [] });
});
