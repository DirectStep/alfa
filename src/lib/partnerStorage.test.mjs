import assert from "node:assert/strict";
import test from "node:test";
import { clearPartnerStorage, sanitizePartnerState, serializePartnerState } from "./partnerStorage.mjs";

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

test("full reset removes chat, legacy and Alfa-Business storage", () => {
  const values = new Map([
    ["alfa-delo-alpha-partner-v1", "chat"],
    ["alfa-delo-ai-agent-v2", "legacy"],
    ["alfaBusinessConnected", "true"],
    ["alfaPartnerOnboardingSeen", "true"],
  ]);
  clearPartnerStorage({ removeItem: (key) => values.delete(key) }, [
    "alfa-delo-alpha-partner-v1",
    "alfa-delo-ai-agent-v2",
    "alfaBusinessConnected",
  ]);
  assert.equal(values.has("alfa-delo-alpha-partner-v1"), false);
  assert.equal(values.has("alfa-delo-ai-agent-v2"), false);
  assert.equal(values.has("alfaBusinessConnected"), false);
  assert.equal(values.get("alfaPartnerOnboardingSeen"), "true");
});
