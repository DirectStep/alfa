import type { ChatPassport, ChatTeamMember } from "@/lib/chatApi";

export type BusinessPassport = Required<ChatPassport>;
export type AgentStatus = "idle" | "waiting" | "working" | "ready";

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  quickTasks: string[];
  accent: "red" | "blue" | "purple" | "lime";
  initials: string;
};

export const EMPTY_BUSINESS_PASSPORT: BusinessPassport = {
  projectType: "",
  direction: "",
  product: "",
  audience: "",
  stage: "",
  prepared: "",
  goal: "",
  problems: "",
  resources: "",
  budget: "",
  delegationTasks: "",
};

export const AGENT_REGISTRY: AgentDefinition[] = [
  { id: "marketer", name: "Маркетолог", description: "Аудитория, спрос и продвижение", quickTasks: ["Проверить спрос", "Определить аудиторию", "Подготовить план продвижения"], accent: "blue", initials: "М" },
  { id: "product", name: "Продуктовый специалист", description: "Продукт, гипотезы и план MVP", quickTasks: ["Сформулировать ценность", "Собрать план MVP", "Выбрать гипотезу для теста"], accent: "purple", initials: "П" },
  { id: "finance", name: "Финансовый аналитик", description: "Бюджет, цена и базовая экономика", quickTasks: ["Посчитать бюджет запуска", "Определить цену", "Посчитать точку безубыточности"], accent: "lime", initials: "Ф" },
  { id: "copywriter", name: "Копирайтер", description: "Оффер и тексты для коммуникации", quickTasks: ["Сформулировать оффер", "Написать текст объявления", "Подготовить описание продукта"], accent: "red", initials: "К" },
  { id: "designer", name: "Дизайнер", description: "Визуальное направление и дизайн-бриф", quickTasks: ["Собрать дизайн-бриф", "Выбрать визуальное направление", "Продумать структуру макета"], accent: "purple", initials: "Д" },
  { id: "legal", name: "Юрист", description: "Риски, документы и вопросы к юристу", quickTasks: ["Проверить основные риски", "Собрать список документов", "Подготовить вопросы юристу"], accent: "blue", initials: "Ю" },
  { id: "hr", name: "HR-специалист", description: "Роли, найм и ответственность", quickTasks: ["Определить первую роль", "Подготовить описание вакансии", "Распределить ответственность"], accent: "red", initials: "HR" },
  { id: "customer-manager", name: "Клиентский менеджер", description: "Продажи, возражения и клиентский сервис", quickTasks: ["Подготовить сценарий продажи", "Разобрать возражения", "Настроить коммуникацию после заявки"], accent: "lime", initials: "КМ" },
];

export const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Не было задач",
  waiting: "Ждёт ответа",
  working: "Работает над задачей",
  ready: "Результат готов",
};

export function getAgentDefinition(id: string) {
  return AGENT_REGISTRY.find((agent) => agent.id === id);
}

export function normalizePassport(passport?: Partial<ChatPassport>): BusinessPassport {
  return Object.fromEntries(
    Object.keys(EMPTY_BUSINESS_PASSPORT).map((key) => [key, typeof passport?.[key as keyof ChatPassport] === "string" ? passport[key as keyof ChatPassport] : ""]),
  ) as BusinessPassport;
}

function defaultTeamEntry(id: string, passport: BusinessPassport): ChatTeamMember {
  const agent = getAgentDefinition(id)!;
  const product = passport.product || passport.direction || "ваш проект";
  const content: Record<string, [string, string]> = {
    marketer: ["Нужно определить первый сегмент и проверить спрос", `Подготовить план проверки спроса на «${product}»`],
    product: ["Нужно превратить идею в проверяемое предложение", "Сформулировать ценностное предложение и первый тест"],
    finance: ["Нужно связать запуск с доступным бюджетом", "Посчитать базовую экономику и безопасный бюджет"],
    copywriter: ["Для теста нужен ясный оффер", "Подготовить три варианта предложения"],
    designer: ["Проекту нужно понятное визуальное направление", "Собрать короткий дизайн-бриф"],
    legal: ["Важно заранее увидеть юридические риски", "Подготовить чек-лист вопросов перед консультацией"],
    hr: ["Нужно определить роли и ответственность", "Определить первую необходимую роль"],
    "customer-manager": ["Нужен понятный сценарий общения с клиентом", "Подготовить сценарий первой продажи"],
  };
  const [reason, firstTask] = content[id];
  return { id, name: agent.name, description: agent.description, reason, firstTask };
}

export function buildFallbackTeam(passport: BusinessPassport): ChatTeamMember[] {
  const context = Object.values(passport).join(" ").toLowerCase();
  const ids = ["marketer", "product"];
  if (/бюджет|цен|эконом|маржин|затрат/.test(context) || !passport.budget) ids.push("finance");
  if (/дизайн|визуал|макет|эскиз|бренд/.test(context)) ids.push("designer");
  else ids.push("copywriter");
  if (/продаж|клиент|заявк|заказ|возраж/.test(context) && ids.length < 5) ids.push("customer-manager");
  return [...new Set(ids)].slice(0, 5).map((id) => defaultTeamEntry(id, passport));
}

export function addTeamMember(team: ChatTeamMember[], id: string, passport: BusinessPassport) {
  if (team.some((member) => member.id === id) || team.length >= 5 || !getAgentDefinition(id)) return team;
  return [...team, defaultTeamEntry(id, passport)];
}

export function fallbackQuestion(passport: BusinessPassport) {
  if (!passport.projectType) return "Для начала уточню главное: у вас уже есть продажи или пока только идея? Можно ответить: «уже продаём», «готовимся к запуску» или «пока только идея».";
  if (!passport.direction && !passport.product) return "Что именно вы хотите продавать или какую услугу оказывать? Например: худи для студентов, украшения ручной работы или доставка еды.";
  if (!passport.audience) return "Кто, скорее всего, будет это покупать? Опишите людей простыми словами: кто они, сколько им примерно лет и зачем им ваш продукт.";
  if (!passport.stage || (!passport.prepared && !passport.resources)) return "Что вы уже успели сделать? Например: только придумали идею, посмотрели похожие проекты, сделали эскизы или образец, нашли поставщика либо уже начали продавать.";
  if (!passport.goal || !passport.delegationTasks) return "Какой первый результат вам сейчас нужнее всего? Например: понять, будут ли покупать, собрать первые заявки, посчитать расходы или подготовить запуск.";
  if (!passport.problems) return "Что сейчас больше всего мешает двигаться дальше? Например: непонятно, кому продавать, какую цену поставить, где искать клиентов или с чего начать.";
  if (!passport.budget) return "Сколько вы готовы потратить на ближайшую проверку идеи? Можно назвать примерную сумму или ответить «пока не знаю».";
  return "Какую одну задачу поручим команде первой? Например: проверить спрос, посчитать расходы, написать текст или продумать продукт.";
}

export function fallbackSpecialistResult(agentId: string, task: string, passport: BusinessPassport) {
  const product = passport.product || passport.direction || "ваш продукт";
  const audience = passport.audience || "первый клиентский сегмент";
  const outputs: Record<string, string> = {
    marketer: `Для задачи «${task}» начните с короткого теста: покажите предложение «${product}» пяти представителям сегмента «${audience}», зафиксируйте выбор и готовность оставить контакт. Результат — минимум три подтверждения интереса.`,
    product: `Сформулируйте ${product} через одну связку: проблема аудитории → обещанный результат → причина поверить. Затем проверьте формулировку на пяти людях и оставьте только понятный им вариант.`,
    finance: `Для задачи «${task}» соберите три числа: себестоимость единицы, постоянные расходы запуска и минимально приемлемую цену. Без этих данных расчёт будет предположением; банковские операции я не выполняю.`,
    copywriter: `Черновик оффера: «${product} для сегмента “${audience}”, который помогает получить нужный результат без лишнего риска». Уточните конкретный результат — и я соберу три варианта текста для теста.`,
    designer: `Начните с дизайн-брифа: аудитория «${audience}», ключевое впечатление, два визуальных референса и один основной сценарий. Это требования к макету; файл дизайна в прототипе не создаётся.`,
    legal: `Проверьте форму работы, правила продажи, возвраты и использование персональных данных. Это общий чек-лист и не замена профессиональной юридической консультации.`,
    hr: `Опишите один результат, за который новая роль отвечает через 30 дней, и три регулярные задачи. По ним можно выбрать формат участия и подготовить вопросы для интервью.`,
    "customer-manager": `Сценарий первого контакта: уточнить задачу клиента, подтвердить потребность, предложить один следующий шаг и договориться о сроке ответа. Отдельно зафиксируйте главное возражение.`,
  };
  return outputs[agentId] || "Опишите задачу чуть конкретнее, чтобы я подготовил полезный результат в рамках своей роли.";
}
