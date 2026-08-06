import test from "node:test";
import assert from "node:assert/strict";
import { appendAgentMessage, ensureAgentThread } from "./agentThreads.mjs";

test("keeps messages isolated by agent id", () => {
  const initial = {};
  const withMarketer = appendAgentMessage(initial, "marketer", { role: "user", text: "Проверь спрос" });
  const withFinance = appendAgentMessage(withMarketer, "finance", { role: "user", text: "Посчитай бюджет" });

  assert.deepEqual(withFinance.marketer.map((message) => message.text), ["Проверь спрос"]);
  assert.deepEqual(withFinance.finance.map((message) => message.text), ["Посчитай бюджет"]);
  assert.equal(withFinance.finance.some((message) => message.text.includes("спрос")), false);
  assert.deepEqual(initial, {});
});

test("initializes a specialist greeting once without replacing its history", () => {
  const first = ensureAgentThread({}, "copywriter", { role: "agent", text: "Первое приветствие" });
  const second = ensureAgentThread(first, "copywriter", { role: "agent", text: "Другое приветствие" });
  assert.equal(second, first);
  assert.deepEqual(second.copywriter.map((message) => message.text), ["Первое приветствие"]);
});
