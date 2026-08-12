export type DemoResultKind = "product" | "finance" | "marketing";

export type DemoAction =
  | { type: "reset" }
  | { type: "typeInput"; text: string; charMs?: number; fillMs?: number }
  | { type: "sendUser"; text: string; agentId?: string }
  | { type: "setLoading"; value: boolean; label?: string }
  | { type: "agentMessage"; text: string; agentId?: string }
  | { type: "showPassport" }
  | { type: "showTeamProposal" }
  | { type: "confirmTeam" }
  | { type: "showTeam" }
  | { type: "openAgent"; agentId: string }
  | { type: "showResult"; kind: DemoResultKind }
  | { type: "showProgress" }
  | { type: "showNextStep" }
  | { type: "showProductPrompt" }
  | { type: "showPaymentOptions" };

export type DemoStep = DemoAction & { hold?: number };

export const DEMO_PASSPORT = {
  projectType: "Бизнес-идея",
  direction: "Локальный бренд одежды",
  product: "Первая небольшая коллекция одежды",
  audience: "18–25 лет, покупатели локальных брендов",
  stage: "Идея / подготовка запуска",
  prepared: "Сформирована идея первой небольшой коллекции",
  goal: "Проверить спрос до производства большой партии",
  problems: "Нет собственной команды специалистов",
  resources: "50 000 ₽ на первый тест",
  budget: "50 000 ₽ на первый тест",
  delegationTasks: "Проверить спрос, рассчитать цену и найти первый канал привлечения",
} as const;

export const DEMO_TEAM = [
  {
    id: "marketer",
    name: "Маркетолог",
    description: "Спрос, каналы привлечения и первые клиенты",
    reason: "Нужно проверить спрос и первый канал привлечения",
    firstTask: "Подготовить первый маркетинговый тест",
  },
  {
    id: "product",
    name: "Продуктовый специалист",
    description: "Продукт, гипотезы и критерии успеха",
    reason: "Нужно сформировать тест продукта и критерий успеха",
    firstTask: "Собрать тест спроса до производства партии",
  },
  {
    id: "finance",
    name: "Финансовый аналитик",
    description: "Цена, маржа и экономика запуска",
    reason: "Нужно рассчитать экономику и цену запуска",
    firstTask: "Рассчитать цену первой коллекции",
  },
  {
    id: "customer-manager",
    name: "Клиентский менеджер",
    description: "Первые заявки и клиентский сервис",
    reason: "Нужно структурировать работу с первыми заявками",
    firstTask: "Подготовить работу с первыми предзаказами",
  },
] as const;

export const DEMO_STEPS: DemoStep[] = [
  { type: "reset", hold: 800 },
  { type: "typeInput", text: "Хочу запустить свой бизнес. Есть идея, но не понимаю, что делать первым.", charMs: 27 },
  { type: "sendUser", text: "Хочу запустить свой бизнес. Есть идея, но не понимаю, что делать первым.", hold: 900 },
  { type: "setLoading", value: true, label: "Думаю над ответом…", hold: 900 },
  { type: "setLoading", value: false },
  { type: "agentMessage", text: "Давай разберёмся. Для начала уточню несколько вещей о бизнесе.", hold: 900 },
  { type: "agentMessage", text: "Что именно ты хочешь запустить?", hold: 850 },
  { type: "typeInput", text: "Небольшой бренд одежды. Хочу начать с первой коллекции.", fillMs: 500 },
  { type: "sendUser", text: "Небольшой бренд одежды. Хочу начать с первой коллекции.", hold: 700 },
  { type: "agentMessage", text: "Кто твой первый покупатель?", hold: 850 },
  { type: "typeInput", text: "Парни и девушки 18–25 лет, которые покупают локальные бренды онлайн.", fillMs: 500 },
  { type: "sendUser", text: "Парни и девушки 18–25 лет, которые покупают локальные бренды онлайн.", hold: 700 },
  { type: "agentMessage", text: "Что сейчас важнее всего проверить?", hold: 850 },
  { type: "typeInput", text: "Хочу понять, будет ли спрос до того, как вкладываться в большую партию.", fillMs: 500 },
  { type: "sendUser", text: "Хочу понять, будет ли спрос до того, как вкладываться в большую партию.", hold: 700 },
  { type: "setLoading", value: true, label: "Собираю контекст бизнеса…", hold: 1000 },
  { type: "setLoading", value: false },
  { type: "showPassport", hold: 2700 },
  { type: "agentMessage", text: "Контекст собран ✓", hold: 800 },
  { type: "setLoading", value: true, label: "Подбираю AI-команду под текущую ситуацию…", hold: 1200 },
  { type: "setLoading", value: false },
  { type: "showTeamProposal", hold: 1800 },
  { type: "confirmTeam", hold: 800 },
  { type: "agentMessage", text: "Команда собрана ✓", hold: 1200 },
  { type: "showTeam", hold: 2700 },
  { type: "openAgent", agentId: "product", hold: 800 },
  { type: "sendUser", agentId: "product", text: "Как проверить, нужен ли продукт до запуска?", hold: 500 },
  { type: "setLoading", value: true, label: "Готовлю тест спроса…", hold: 800 },
  { type: "setLoading", value: false },
  { type: "showResult", kind: "product", hold: 2700 },
  { type: "showTeam", hold: 900 },
  { type: "openAgent", agentId: "finance", hold: 800 },
  { type: "sendUser", agentId: "finance", text: "По какой цене запускаться?", hold: 500 },
  { type: "setLoading", value: true, label: "Считаю экономику запуска…", hold: 800 },
  { type: "setLoading", value: false },
  { type: "showResult", kind: "finance", hold: 2700 },
  { type: "showTeam", hold: 900 },
  { type: "openAgent", agentId: "marketer", hold: 800 },
  { type: "sendUser", agentId: "marketer", text: "Где искать первых клиентов?", hold: 500 },
  { type: "setLoading", value: true, label: "Готовлю первый маркетинговый тест…", hold: 800 },
  { type: "setLoading", value: false },
  { type: "showResult", kind: "marketing", hold: 2700 },
  { type: "openAgent", agentId: "alpha-partner", hold: 700 },
  { type: "setLoading", value: true, label: "Обновляю контекст бизнеса…", hold: 1000 },
  { type: "setLoading", value: false },
  { type: "showProgress", hold: 2000 },
  { type: "showNextStep", hold: 2500 },
  { type: "showProductPrompt", hold: 1000 },
  { type: "showPaymentOptions", hold: 3000 },
];
