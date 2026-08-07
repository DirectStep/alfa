/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { handler, __test } = require("./index");

const PASSPORT = {
  projectType: "Бизнес-идея",
  direction: "Бренд одежды / e-commerce",
  product: "Худи",
  audience: "Студенты",
  stage: "Идея",
  prepared: "Есть эскизы",
  goal: "Проверить спрос",
  problems: "Неясно, будут ли покупать",
  resources: "Есть эскизы",
  budget: "Пока не определён",
  delegationTasks: "Проверка спроса и оффер",
};

function apiEvent(body, origin = "http://localhost:3010") {
  return { httpMethod: "POST", headers: { origin }, body: JSON.stringify(body) };
}

function modelResponse(payload) {
  return { choices: [{ message: { content: JSON.stringify(payload) } }] };
}

function parseContext(overrides = {}) {
  return {
    passport: { ...PASSPORT },
    team: [],
    role: "partner",
    agentId: "alpha-partner",
    history: [],
    paymentSignal: false,
    paymentConfirmed: false,
    teamConfirmed: false,
    alfaBusiness: { connected: false, demo: false },
    ...overrides,
  };
}

test("returns deterministic Alpha Partner fallback without credentials", async () => {
  const previous = process.env.GIGACHAT_CREDENTIALS;
  delete process.env.GIGACHAT_CREDENTIALS;
  const response = await handler(apiEvent({
    message: "Хочу запустить бренд худи для студентов",
    history: [],
    passport: {},
    role: "partner",
    agentId: "alpha-partner",
    team: [],
    teamSummaries: [],
  }));
  if (previous) process.env.GIGACHAT_CREDENTIALS = previous;
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.status, "error");
  assert.equal(body.reply, "Сейчас работаем в демо-режиме. Ваши ответы и прогресс сохраняются.");
  assert.ok(body.team.length >= 3 && body.team.length <= 5);
  assert.equal(response.headers["Access-Control-Allow-Origin"], "http://localhost:3010");
});

test("rejects an unknown browser origin", async () => {
  const response = await handler(apiEvent({ message: "Привет" }, "https://example.com"));
  assert.equal(response.statusCode, 403);
  assert.equal(response.headers["Access-Control-Allow-Origin"], undefined);
});

test("answers CORS preflight only for an allowed origin", async () => {
  const response = await handler({ httpMethod: "OPTIONS", headers: { origin: "https://directstep.github.io" }, body: "" });
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["Access-Control-Allow-Origin"], "https://directstep.github.io");
});

test("healthcheck reports a safe configuration error without credentials", async () => {
  const previous = process.env.GIGACHAT_CREDENTIALS;
  delete process.env.GIGACHAT_CREDENTIALS;
  const response = await handler({
    httpMethod: "GET",
    path: "/api/health",
    headers: { origin: "http://localhost:3010" },
    body: "",
  });
  if (previous) process.env.GIGACHAT_CREDENTIALS = previous;
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 503);
  assert.equal(body.status, "error");
  assert.equal(body.provider, "gigachat");
  assert.equal(body.configured, false);
  assert.equal(body.oauthAvailable, false);
  assert.equal(body.modelAvailable, false);
  assert.equal("accessToken" in body, false);
  assert.equal("credentials" in body, false);
});

test("healthcheck works on a direct cloud function URL without an api path", async () => {
  const previous = process.env.GIGACHAT_CREDENTIALS;
  delete process.env.GIGACHAT_CREDENTIALS;
  const response = await handler({
    httpMethod: "GET",
    path: "/",
    headers: { origin: "https://directstep.github.io" },
    body: "",
  });
  if (previous) process.env.GIGACHAT_CREDENTIALS = previous;
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 503);
  assert.equal(body.provider, "gigachat");
  assert.equal(body.configured, false);
  assert.equal(response.headers["Access-Control-Allow-Origin"], "https://directstep.github.io");
});

test("normalizes Basic prefix, whitespace and outer quotes in credentials", () => {
  const previous = process.env.GIGACHAT_CREDENTIALS;
  process.env.GIGACHAT_CREDENTIALS = '  Basic "safe-test-value"  ';
  assert.equal(__test.normalizedCredentials(), "safe-test-value");
  if (previous === undefined) delete process.env.GIGACHAT_CREDENTIALS;
  else process.env.GIGACHAT_CREDENTIALS = previous;
});

test("returns a validation error for an empty message", async () => {
  const response = await handler(apiEvent({ message: "   ", history: [], passport: {} }));
  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).status, "error");
});

test("rejects specialist ids outside the fixed registry", async () => {
  const response = await handler(apiEvent({
    message: "Сделай задачу",
    history: [],
    passport: PASSPORT,
    role: "specialist",
    agentId: "hacker",
    team: [],
    teamSummaries: [],
  }));
  assert.equal(response.statusCode, 400);
});

test("extracts extended business context from free Russian text", () => {
  const passport = __test.extractKnownFacts(
    "У меня есть бизнес-идея: хочу запустить бренд худи для студентов. Есть эскизы, бюджет пока не определён. Хочу проверить спрос.",
    {},
  );
  assert.equal(passport.projectType, "Бизнес-идея");
  assert.equal(passport.direction, "Бренд одежды / e-commerce");
  assert.equal(passport.product, "Худи");
  assert.equal(passport.audience, "Студенты");
  assert.equal(passport.prepared, "Есть эскизы");
  assert.equal(passport.budget, "Пока не определён");
  assert.equal(passport.goal, "Проверить спрос");
});

test("understands the short answer examples offered by the partner", () => {
  let passport = __test.extractKnownFacts("Готовимся к запуску", {});
  assert.equal(passport.projectType, "Бизнес-идея");
  assert.equal(passport.product, "");

  passport = __test.extractKnownFacts("Доставка еды", passport);
  assert.equal(passport.product, "Доставка еды");

  passport = __test.extractKnownFacts("Семьи с детьми 25–40 лет", passport);
  assert.equal(passport.audience, "Семьи с детьми 25–40 лет");

  passport = __test.extractKnownFacts("Нашли поставщика", passport);
  assert.equal(passport.prepared, "Найден поставщик");
  assert.equal(passport.stage, "Подготовка к запуску");

  passport = __test.extractKnownFacts("Понять, будут ли покупать", passport);
  assert.equal(passport.goal, "Понять, будут ли покупать");
  assert.equal(passport.delegationTasks, "Понять, будут ли покупать");

  passport = __test.extractKnownFacts("Непонятно, кому продавать", passport);
  assert.equal(passport.problems, "Кому продавать");

  passport = __test.extractKnownFacts("Пока не знаю", passport);
  assert.equal(passport.budget, "Пока не определён");
});

test("does not mistake a project-type answer for the audience", () => {
  const passport = __test.extractKnownFacts("Готовимся к запуску", { product: "Худи" });
  assert.equal(passport.projectType, "Бизнес-идея");
  assert.equal(passport.audience, "");
});

test("recommended team contains 3-5 unique allowed roles", () => {
  const team = __test.buildRecommendedTeam(PASSPORT);
  const ids = team.map((member) => member.id);
  assert.ok(team.length >= 3 && team.length <= 5);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => Boolean(__test.AGENT_REGISTRY[id])));
  assert.ok(ids.includes("marketer"));
});

test("team validation removes unknown and duplicate roles", () => {
  const team = __test.sanitizeTeam([
    { id: "marketer", reason: "Нужен спрос", firstTask: "Проверить спрос" },
    { id: "marketer", reason: "Дубликат" },
    { id: "unknown" },
    { id: "finance" },
  ], PASSPORT, { fill: true });
  assert.ok(team.length >= 3);
  assert.equal(team.filter((member) => member.id === "marketer").length, 1);
  assert.equal(team.some((member) => member.id === "unknown"), false);
  assert.equal(team.find((member) => member.id === "finance").name, "Финансовый аналитик");
});

test("partner response builds a valid team after context collection", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "Контекст собран.",
    passport: PASSPORT,
    status: "team_ready",
    team: [
      { id: "marketer", reason: "Проверить спрос", firstTask: "План теста" },
      { id: "finance", reason: "Нет бюджета", firstTask: "Расчёт бюджета" },
      { id: "copywriter", reason: "Нужен оффер", firstTask: "Три оффера" },
      { id: "fake", reason: "Нельзя", firstTask: "Нельзя" },
    ],
    nextAction: "review_team",
    sharedSummary: null,
  }), parseContext());
  assert.equal(result.status, "team_ready");
  assert.equal(result.team.length, 3);
  assert.equal(result.team.some((member) => member.id === "fake"), false);
});

test("partner asks only one compact question while collecting", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "Спасибо. Давайте очень подробно поговорим обо всём вашем проекте и разных возможных направлениях, а затем попробуем решить, кто может быть клиентом. Кто ваш клиент? И что он покупает?",
    passport: { projectType: "Бизнес-идея", product: "Худи" },
    status: "collecting",
    team: [],
    nextAction: null,
    sharedSummary: null,
  }), parseContext({ passport: { ...Object.fromEntries(Object.keys(PASSPORT).map((key) => [key, ""])), projectType: "Бизнес-идея", product: "Худи" } }));
  assert.equal(result.status, "collecting");
  assert.equal((result.reply.match(/\?/g) || []).length, 1);
  assert.match(result.reply, /кто/i);
  assert.match(result.reply, /простыми словами/i);
  assert.doesNotMatch(result.reply, /стади|сегмент|гипотез|валидац|MVP|ресурс|делегир/i);
});

test("partner replaces unclear model wording with a plain question and answer examples", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "На какой стадии сейчас ваша идея: исследование рынка, прототип, первые продажи или другая стадия?",
    passport: { projectType: "Бизнес-идея", product: "Украшения", audience: "Молодые женщины" },
    status: "collecting",
    team: [],
    nextAction: null,
    sharedSummary: null,
  }), parseContext({
    passport: { ...Object.fromEntries(Object.keys(PASSPORT).map((key) => [key, ""])), projectType: "Бизнес-идея", product: "Украшения", audience: "Молодые женщины" },
  }));
  assert.equal((result.reply.match(/\?/g) || []).length, 1);
  assert.match(result.reply, /Что вы уже успели сделать/i);
  assert.match(result.reply, /только придумали идею/i);
  assert.doesNotMatch(result.reply, /стади|материал|исследован/i);
});

test("partner does not build a team before learning the user's goal", () => {
  const passportWithoutGoal = { ...PASSPORT, goal: "", delegationTasks: "", problems: "" };
  const result = __test.parseCompletion(modelResponse({
    reply: "Контекста достаточно.",
    passport: passportWithoutGoal,
    status: "team_ready",
    team: [
      { id: "marketer", reason: "Нужен спрос", firstTask: "Проверить спрос" },
      { id: "product", reason: "Нужен продукт", firstTask: "Уточнить продукт" },
      { id: "finance", reason: "Нужен бюджет", firstTask: "Посчитать расходы" },
    ],
  }), parseContext({
    passport: passportWithoutGoal,
    history: [
      { role: "user", content: "У меня есть идея" },
      { role: "assistant", content: "Что хотите продавать?" },
      { role: "user", content: "Худи" },
      { role: "assistant", content: "Кто будет покупать?" },
      { role: "user", content: "Студенты" },
      { role: "assistant", content: "Что уже сделали?" },
      { role: "user", content: "Есть эскизы" },
    ],
  }));
  assert.equal(result.status, "collecting");
  assert.match(result.reply, /Какой первый результат/i);
  assert.equal(result.team.length, 0);
});

test("partner still requires a goal after six unclear answers", () => {
  const passportWithoutGoal = { ...PASSPORT, goal: "", delegationTasks: "", problems: "" };
  const history = Array.from({ length: 6 }, (_, index) => ({ role: "user", content: `Неясный ответ ${index + 1}` }));
  const result = __test.parseCompletion(modelResponse({
    reply: "Команда готова.",
    passport: passportWithoutGoal,
    status: "team_ready",
    team: [{ id: "marketer" }, { id: "product" }, { id: "finance" }],
  }), parseContext({ passport: passportWithoutGoal, history }));
  assert.equal(result.status, "collecting");
  assert.match(result.reply, /Какой первый результат/i);
  assert.equal(result.team.length, 0);
});

test("technical open action is converted to a user-facing recommendation", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "open:product",
    passport: PASSPORT,
    status: "working",
    team: [],
    nextAction: null,
    sharedSummary: null,
  }), parseContext({ team: __test.buildRecommendedTeam(PASSPORT), teamConfirmed: true }));
  assert.equal(result.nextAction, "open:product");
  assert.match(result.reply, /Продуктовый специалист/);
  assert.doesNotMatch(result.reply, /open:/);
});

test("unstructured partner text is replaced by a clear collecting question", () => {
  const result = __test.parseCompletion({ choices: [{ message: { content: "Рекомендую начать с короткого теста спроса." } }] }, parseContext());
  assert.equal(result.status, "collecting");
  assert.match(result.reply, /Какую одну задачу/i);
  assert.equal((result.reply.match(/\?/g) || []).length, 1);
});

test("specialist returns a result and a transferable short summary", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "Проведите пять интервью и покажите два варианта худи.",
    passport: PASSPORT,
    status: "result_ready",
    team: [],
    nextAction: null,
    sharedSummary: "Маркетолог подготовил план из пяти интервью для проверки двух вариантов худи.",
  }), parseContext({ role: "specialist", agentId: "marketer" }));
  assert.equal(result.status, "result_ready");
  assert.match(result.sharedSummary, /Маркетолог/);
});

test("sanitized specialist histories stay separated", () => {
  const marketerHistory = __test.sanitizeHistory([{ role: "user", content: "Проверь спрос" }, { role: "assistant", content: "План готов" }]);
  const financeHistory = __test.sanitizeHistory([{ role: "user", content: "Посчитай бюджет" }]);
  assert.deepEqual(marketerHistory.map((item) => item.content), ["Проверь спрос", "План готов"]);
  assert.deepEqual(financeHistory.map((item) => item.content), ["Посчитай бюджет"]);
  assert.equal(financeHistory.some((item) => item.content.includes("спрос")), false);
});

test("payment need is confirmed before any product action", () => {
  const result = __test.parseCompletion(modelResponse({ reply: "Любой ответ", passport: PASSPORT }), parseContext({ paymentSignal: true }));
  assert.equal(result.status, "payment_confirmation");
  assert.equal(result.nextAction, "confirm_payment_need");
  assert.equal(result.reply, "Правильно понял, у вас уже есть реальный заказ или предзаказ и нужно принять оплату?");
});

test("confirmed payment keeps the existing explicit branch action", () => {
  const result = __test.parseCompletion(modelResponse({ reply: "Любой ответ", passport: PASSPORT }), parseContext({ paymentConfirmed: true }));
  assert.equal(result.status, "result_ready");
  assert.equal(result.nextAction, "payment_confirmed");
  assert.equal(result.bankRecommendation.productId, "internet_acquiring");
});

test("bank recommendations accept only one product from the fixed registry", () => {
  const result = __test.parseCompletion(modelResponse({
    reply: "Для регулярных онлайн-заказов можно автоматизировать оплату.",
    passport: PASSPORT,
    status: "result_ready",
    team: [],
    nextAction: null,
    sharedSummary: "Пора автоматизировать онлайн-оплату.",
    bankRecommendation: {
      productId: "internet_acquiring",
      reason: "Онлайн-заказы стали регулярными",
      message: "Для этой задачи может пригодиться интернет-эквайринг Альфа-Бизнес.",
      cta: "Посмотреть вариант",
    },
  }), parseContext({ role: "specialist", agentId: "finance" }));
  assert.equal(result.bankRecommendation.productId, "internet_acquiring");
  assert.equal(Object.keys(result.bankRecommendation).length, 4);
});

test("unknown banking products and premature payment recommendations are rejected", () => {
  assert.equal(__test.sanitizeBankRecommendation({ productId: "credit", reason: "Причина", message: "Текст" }), null);
  const result = __test.parseCompletion(modelResponse({
    reply: "Сначала подтвердим заказ.",
    passport: PASSPORT,
    status: "working",
    team: [],
    nextAction: null,
    sharedSummary: null,
    bankRecommendation: { productId: "internet_acquiring", reason: "Возможный заказ", message: "Интернет-эквайринг", cta: "Подключить" },
  }), parseContext({ teamConfirmed: true, paymentSignal: true }));
  assert.equal(result.bankRecommendation, null);
});

test("bank registry contains exactly the eight payment business products", () => {
  assert.deepEqual(Object.keys(__test.BANK_PRODUCT_REGISTRY).sort(), [
    "alfa_kassa",
    "alfa_pay",
    "alfa_softpos",
    "cloud_kassa",
    "internet_acquiring",
    "merchant_acquiring",
    "mpos",
    "sbp",
  ]);
});

test("sanitizes demo Alfa-Business metrics without accepting arbitrary fields", () => {
  const value = __test.sanitizeAlfaBusiness({ connected: true, demo: false, metrics: { period: "30 дней", revenue: 184000, transactions: 47, averageCheck: 3915, revenueTrend: 12, repeatCustomers: 8, secret: "no" } });
  assert.equal(value.connected, true);
  assert.equal(value.demo, true);
  assert.equal(value.metrics.revenue, 184000);
  assert.equal("secret" in value.metrics, false);
});

test("registry exposes exactly the eight allowed specialist roles", () => {
  assert.deepEqual(Object.keys(__test.AGENT_REGISTRY).sort(), [
    "copywriter",
    "customer-manager",
    "designer",
    "finance",
    "hr",
    "legal",
    "marketer",
    "product",
  ]);
});
