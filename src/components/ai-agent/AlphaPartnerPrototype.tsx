"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Database,
  Download,
  Info,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  AGENT_REGISTRY,
  EMPTY_BUSINESS_PASSPORT,
  STATUS_LABELS,
  addTeamMember,
  buildFallbackTeam,
  fallbackQuestion,
  fallbackSpecialistResult,
  getAgentDefinition,
  normalizePassport,
  type AgentStatus,
  type BusinessPassport,
} from "@/lib/alphaPartner";
import { assetPath } from "@/lib/assetPath";
import { appendAgentMessage, ensureAgentThread } from "@/lib/agentThreads.mjs";
import { clearPartnerStorage, sanitizePartnerState, serializePartnerState } from "@/lib/partnerStorage.mjs";
import {
  checkChatHealth,
  sendChatMessage,
  type ChatHistoryMessage,
  type BankRecommendation,
  type ChatTeamMember,
  type ChatTeamSummary,
} from "@/lib/chatApi";
import { ALFA_BUSINESS_STORAGE_KEY, DEMO_ALFA_BUSINESS_DATA, SUBSCRIPTION_PLAN } from "@/lib/alfaBusinessDemo";
import { getBankProduct } from "@/lib/bankProducts";
import { downloadTeamPrototypeKit } from "@/lib/teamPrototypeKit";
import { DEMO_PASSPORT, DEMO_STEPS, DEMO_TEAM, type DemoResultKind, type DemoStep } from "@/lib/demoScenario";
import { useDemoRunner } from "@/components/ai-agent/useDemoRunner";

type Message = { id: string; role: "agent" | "user"; text: string; source?: "ai" | "demo"; bankRecommendation?: BankRecommendation | null };
type Phase = "collecting" | "context_ready" | "team_review" | "active";
type PaymentState = "idle" | "confirming" | "unlocked";
type ConnectionStatus = "checking" | "connected" | "demo" | "error";
type PartnerState = {
  version: 1;
  phase: Phase;
  passport: BusinessPassport;
  partnerHistory: Message[];
  team: ChatTeamMember[];
  teamConfirmed: boolean;
  activeAgentId: string;
  agentThreads: Record<string, Message[]>;
  agentStatuses: Record<string, AgentStatus>;
  agentTasks: Record<string, string>;
  pendingSummaries: Record<string, string>;
  teamSummaries: ChatTeamSummary[];
  suggestedAgentId: string;
  paymentState: PaymentState;
};

type FailedRequest = {
  value: string;
  agentId: string;
  history: ChatHistoryMessage[];
  passport: BusinessPassport;
  team: ChatTeamMember[];
  teamSummaries: ChatTeamSummary[];
  teamConfirmed: boolean;
  alfaBusinessConnected: boolean;
};

const STORAGE_KEY = "alfa-delo-alpha-partner-v1";
const LEGACY_STORAGE_KEY = "alfa-delo-ai-agent-v2";
const ONBOARDING_STORAGE_KEY = "alfaPartnerOnboardingSeen";
const MAX_INPUT_LENGTH = 800;
const FALLBACK_NOTICE = "Сейчас работаем в демо-режиме. Ваши ответы и прогресс сохраняются.";
const PAYMENT_CONFIRMATION = "Правильно понял, у вас уже есть реальный заказ или предзаказ и нужно принять оплату?";
const FIRST_PAYMENT_RECOMMENDATION: BankRecommendation = {
  productId: "internet_acquiring",
  reason: "У вас появился заказ или предзаказ, и покупателю нужно удобно заплатить онлайн.",
  message: "Для этого подойдёт интернет-эквайринг Альфа-Бизнеса — приём оплаты банковской картой через интернет.",
  cta: "Посмотреть вариант",
};
const LEGACY_START_MESSAGE = "Расскажите, с чем вы пришли. У вас уже есть работающий бизнес или пока только идея?";
const PREVIOUS_START_MESSAGE = "Привет! Я ваш Альфа-Партнёр. Помогу развивать действующий бизнес или запустить новый: разберусь в ситуации, соберу AI-команду и предложу следующий шаг. Если появится конкретная финансовая задача, подскажу подходящий продукт Альфа-Банка. С чем вы пришли — у вас уже есть бизнес или пока идея?";
const START_MESSAGE = "Привет! Я Альфа-Партнёр. Сначала разберусь, что у вас за бизнес и чего вы хотите добиться. Затем подберу 3–5 AI-специалистов и объясню, какую задачу дать каждому. У вас уже есть продажи или пока только идея?";
const START_REPLIES = ["У меня уже есть бизнес", "У меня есть бизнес-идея", "Хочу запустить новый продукт"];
const PROCESS_STEPS = ["Расскажите о бизнесе", "Получите AI-команду", "Делегируйте задачи", "Соберите результат"];
const TEAM_VISUALS: Record<string, string> = {
  marketer: "/assets/ai/target.png",
  finance: "/assets/ai/growth.png",
  product: "/assets/ai/idea.png",
  copywriter: "/assets/ai/rocket.png",
};
const AGENT_AVATARS: Record<string, string> = {
  marketer: "/assets/ai/avatars/cat.png",
  product: "/assets/ai/avatars/duck.png",
  finance: "/assets/ai/avatars/bear.png",
  "customer-manager": "/assets/ai/avatars/owl.png",
  copywriter: "/assets/ai/avatars/cat.png",
  designer: "/assets/ai/avatars/duck.png",
  legal: "/assets/ai/avatars/owl.png",
  hr: "/assets/ai/avatars/bear.png",
};

const ONBOARDING_SLIDES = [
  {
    number: "1",
    title: "Собирает контекст",
    text: "Альфа-Партнёр узнаёт, что за бизнес или идея у вас сейчас, какие цели и какие задачи стоят первыми.",
    note: "Расскажите всё своими словами — без длинной анкеты.",
    color: "bg-alfa-red text-white",
    image: "/assets/ai/onboarding/business-context.webp",
  },
  {
    number: "2",
    title: "Подбирает AI-команду",
    text: "На основе контекста он выбирает 3–5 специалистов, которые нужны именно вашему проекту.",
    note: "Маркетолог · Финансовый аналитик · Копирайтер · Дизайнер",
    color: "bg-future-blue text-white",
    image: "/assets/ai/onboarding/team.webp",
  },
  {
    number: "3",
    title: "Помогает делегировать задачи",
    text: "Откройте отдельный чат с нужным специалистом и поставьте ему одну конкретную задачу.",
    note: "Вы сами выбираете, кому поставить следующую задачу.",
    color: "bg-future-purple text-white",
    image: "/assets/ai/onboarding/delegated-task.webp",
  },
  {
    number: "4",
    title: "Объединяет результат",
    text: "Когда специалисты отработали, Альфа-Партнёр собирает их ответы и предлагает следующий шаг.",
    note: "Продукт Альфы появится только при конкретной финансовой задаче.",
    color: "bg-future-green text-black",
    image: "/assets/ai/onboarding/result.webp",
  },
] as const;

function makeMessage(role: Message["role"], text: string, source: Message["source"] = "ai", bankRecommendation: BankRecommendation | null = null): Message {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text, source, bankRecommendation };
}

function createInitialState(): PartnerState {
  return {
    version: 1,
    phase: "collecting",
    passport: { ...EMPTY_BUSINESS_PASSPORT },
    partnerHistory: [makeMessage("agent", START_MESSAGE)],
    team: [],
    teamConfirmed: false,
    activeAgentId: "alpha-partner",
    agentThreads: {},
    agentStatuses: {},
    agentTasks: {},
    pendingSummaries: {},
    teamSummaries: [],
    suggestedAgentId: "",
    paymentState: "idle",
  };
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<Message>;
  return typeof message.id === "string" && (message.role === "agent" || message.role === "user") && typeof message.text === "string";
}

function isStoredState(value: unknown): value is PartnerState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PartnerState>;
  return state.version === 1
    && ["collecting", "context_ready", "team_review", "active"].includes(state.phase ?? "")
    && Boolean(state.passport && typeof state.passport === "object")
    && Array.isArray(state.partnerHistory)
    && state.partnerHistory.every(isMessage)
    && Array.isArray(state.team)
    && typeof state.activeAgentId === "string"
    && Boolean(state.agentThreads && typeof state.agentThreads === "object")
    && Object.values(state.agentThreads ?? {}).every((thread) => Array.isArray(thread) && thread.every(isMessage))
    && Boolean(state.agentStatuses && typeof state.agentStatuses === "object")
    && Array.isArray(state.teamSummaries);
}

function migrateLegacyState(value: unknown): PartnerState | null {
  if (!value || typeof value !== "object") return null;
  const legacy = value as {
    messages?: unknown[];
    answers?: Record<string, unknown>;
    aiPassport?: Record<string, unknown>;
    pendingPaymentConfirmation?: boolean;
    step?: string;
  };
  const answers = legacy.answers ?? {};
  const aiPassport = legacy.aiPassport ?? {};
  const passport = normalizePassport({
    projectType: "Бизнес-идея",
    direction: "",
    product: String(aiPassport.product || answers.product || ""),
    audience: String(aiPassport.audience || answers.audience || ""),
    stage: String(aiPassport.stage || answers.stage || ""),
    prepared: String(aiPassport.prepared || answers.prototype || ""),
    budget: String(aiPassport.budget || answers.budget || ""),
    goal: String(aiPassport.goal || answers.goal || ""),
    problems: "",
    resources: String(aiPassport.prepared || answers.prototype || ""),
    delegationTasks: String(aiPassport.goal || answers.goal || ""),
  });
  const messages = Array.isArray(legacy.messages) ? legacy.messages.filter(isMessage) : [];
  const hasContext = Boolean(passport.product || passport.goal || messages.length);
  const team = hasContext ? buildFallbackTeam(passport) : [];
  return {
    ...createInitialState(),
    passport,
    partnerHistory: messages.length ? messages : [makeMessage("agent", START_MESSAGE)],
    team,
    phase: hasContext ? "context_ready" : "collecting",
    paymentState: legacy.step === "payment" ? "unlocked" : legacy.pendingPaymentConfirmation ? "confirming" : "idle",
  };
}

function toHistory(messages: Message[]): ChatHistoryMessage[] {
  return messages.slice(-16).map((message) => ({ role: message.role === "user" ? "user" : "assistant", content: message.text }));
}

function countUserMessages(messages: Message[]) {
  return messages.filter((message) => message.role === "user").length;
}

function normalizeBrandText(text: string) {
  return text
    .replaceAll("Альфа-партнёру", "Альфа-Партнёру")
    .replaceAll("Альфа-партнёра", "Альфа-Партнёра")
    .replaceAll("Альфа-партнёр", "Альфа-Партнёр");
}

function normalizeMessagesBranding(messages: Message[]) {
  return messages.map((message) => ({ ...message, text: normalizeBrandText(message.text) }));
}

function normalizeInitialGreeting(messages: Message[]) {
  const normalized = normalizeMessagesBranding(messages);
  if (normalized[0]?.role !== "agent" || ![LEGACY_START_MESSAGE, PREVIOUS_START_MESSAGE].includes(normalized[0].text)) return normalized;
  return [{ ...normalized[0], text: START_MESSAGE }, ...normalized.slice(1)];
}

function withoutTrailingDemo(messages: Message[], replaceDemo: boolean) {
  if (!replaceDemo || messages.at(-1)?.source !== "demo") return messages;
  return messages.slice(0, -1);
}

function hasFallbackContext(passport: BusinessPassport) {
  const core = [passport.projectType, passport.direction || passport.product, passport.audience, passport.stage, passport.goal];
  return core.every(Boolean) && Boolean(passport.problems || passport.delegationTasks || passport.prepared || passport.resources);
}

function hasOrderSignal(value: string) {
  return /(есть|получил|появил|реальн|готов)[^.!?]{0,45}(заказ|предзаказ)|(?:заказ|предзаказ)[^.!?]{0,40}(есть|получ|реальн|готов)/i.test(value);
}

function isAffirmative(value: string) {
  const normalized = value.trim().toLowerCase();
  return !/(^|\s)(нет|неа|не нужно|не надо)(\s|[,.!?]|$)/.test(normalized)
    && /(^|\s)(да|верно|правильно|нужно|хочу|готов)(\s|[,.!?]|$)/.test(normalized);
}

function isNegativePaymentAnswer(value: string) {
  return /(^|\s)(нет|неа|не нужно|не надо|пока нет|без оплаты)(\s|[,.!?]|$)/i.test(value.trim());
}

function extractFallbackPassport(value: string, current: BusinessPassport): BusinessPassport {
  const text = value.trim();
  const normalized = text.toLowerCase().replace(/ё/g, "е");
  const next = { ...current };
  const projectTypeWasKnown = Boolean(next.projectType);
  const productWasKnown = Boolean(next.product || next.direction);
  if (!next.projectType) {
    if (/иде[яю]|хочу запустить|новый продукт/.test(normalized)) next.projectType = "Бизнес-идея";
    else if (/у меня (уже )?есть бизнес|работающ|уже прода|есть продаж|есть клиент/.test(normalized)) next.projectType = "Существующий бизнес";
    else if (/готовим(?:ся)? к запуску|готовлю(?:сь)? к запуску/.test(normalized)) next.projectType = "Бизнес-идея";
  }
  if (!next.product) {
    if (/худи/.test(normalized)) next.product = "Худи";
    else if (/украшен/.test(normalized)) next.product = "Украшения";
    else if (/футболк/.test(normalized)) next.product = "Футболки";
    else {
      const product = text.match(/(?:продаю|запустить|продукт|услуга)\s+([^,.!?]{2,80})/i)?.[1];
      const shortProductAnswer = projectTypeWasKnown && /^[а-яa-z0-9ё -]{3,80}$/i.test(text) && !/^(не знаю|пока не знаю|ничего)$/i.test(text) ? text : "";
      if (product || shortProductAnswer) next.product = (product || shortProductAnswer).trim();
    }
  }
  if (!next.direction) {
    if (/одежд|худи|футбол|свитшот|бренд/.test(normalized)) next.direction = "Бренд одежды / e-commerce";
    else if (/украшен|браслет|кольц|серег/.test(normalized)) next.direction = "Украшения / e-commerce";
  }
  if (!next.audience) {
    if (/студент/.test(normalized)) next.audience = "Студенты";
    else {
      const audience = text.match(/для\s+([^,.!?]{2,70})/i)?.[1];
      const shortAudienceAnswer = projectTypeWasKnown && productWasKnown && /^[а-яa-z0-9ё ,–—-]{3,120}$/i.test(text) && !/^(не знаю|пока не знаю|все|для всех)$/i.test(text) ? text : "";
      if ((audience || shortAudienceAnswer) && !/теста|запуска|проверки|производства/i.test(audience || "")) next.audience = (audience || shortAudienceAnswer).trim();
    }
  }
  if (!next.prepared) {
    if (/эскиз/.test(normalized)) next.prepared = "Есть эскизы";
    else if (/образец|прототип/.test(normalized)) next.prepared = "Есть образец";
    else if (/нашл[иаи]? поставщик|есть поставщик/.test(normalized)) next.prepared = "Найден поставщик";
    else if (/посмотрел[иаи]? похож|изучил[иаи]? похож/.test(normalized)) next.prepared = "Изучены похожие проекты";
    else if (/уже прода|начал[иаи]? прода|есть продаж/.test(normalized)) next.prepared = "Начались продажи";
    else if (/только идея/.test(normalized)) next.prepared = "Пока только идея";
  }
  if (!next.resources && next.prepared) next.resources = next.prepared;
  if (!next.stage) {
    if (/заказ|предзаказ/.test(normalized)) next.stage = "Есть первые заказы";
    else if (/работающ|уже прода|начал[иаи]? прода|есть продаж|есть клиенты/.test(normalized)) next.stage = "Работающий бизнес";
    else if (/нашл[иаи]? поставщик|посмотрел[иаи]? похож|изучил[иаи]? похож/.test(normalized)) next.stage = "Подготовка к запуску";
    else if (/иде[яю]|запустить/.test(normalized)) next.stage = "Идея";
  }
  if (!next.goal) {
    if (/проверить спрос/.test(normalized)) next.goal = "Проверить спрос";
    else if (/понять[^.!?]{0,35}(будут ли )?покуп|будут ли покуп/.test(normalized)) next.goal = "Понять, будут ли покупать";
    else if (/первые заявки|первых заявок/.test(normalized)) next.goal = "Получить первые заявки";
    else if (/посчитать (расход|затрат|бюджет)/.test(normalized)) next.goal = "Посчитать расходы";
    else if (/подготовить запуск|подготовиться к запуску/.test(normalized)) next.goal = "Подготовить запуск";
    else if (/запустить/.test(normalized)) next.goal = "Запустить продукт";
    else if (/^(пока )?не знаю|не понимаю,? что (выбрать|делать)/.test(normalized)) next.goal = "Определить следующий шаг";
  }
  if (!next.budget) {
    if (/бюджет[^.!?]{0,30}(не определ|не знаю|пока нет)|^(пока )?не знаю$/.test(normalized)) next.budget = "Пока не определён";
    else {
      const budget = text.match(/\d[\d\s]*(?:₽|руб(?:лей|ля|ль)?)/i)?.[0];
      if (budget) next.budget = budget.trim();
    }
  }
  if (!next.problems) {
    const problem = text.match(/(?:проблема|не понимаю|непонятно|мешает|сложно)\s*[,：:—-]?\s*([^.!?]{3,160})/i)?.[1];
    if (problem || /^непонятно/i.test(text)) next.problems = (problem || text).trim();
  }
  if (!next.delegationTasks && /делегир|поручить|помоги|нужна помощь/i.test(normalized)) next.delegationTasks = text;
  if (!next.delegationTasks && next.goal) next.delegationTasks = next.goal;
  return next;
}

function agentGreeting(agentId: string, passport: BusinessPassport) {
  const agent = getAgentDefinition(agentId);
  if (!agent) return "Я изучил контекст проекта. Какую задачу делегируем первой?";
  const project = passport.product || passport.direction || "вашего проекта";
  const greetings: Record<string, string> = {
    marketer: `Я изучил контекст «${project}». Могу помочь проверить спрос, определить аудиторию или подготовить план продвижения. Какую задачу делегируем первой?`,
    product: `Я изучил контекст «${project}». Помогу сформулировать ценность, выбрать гипотезу или собрать план MVP. С чего начнём?`,
    finance: `Я вижу контекст «${project}». Могу посчитать бюджет, цену или точку безубыточности без банковских операций. Какую задачу берём?`,
    copywriter: `Я изучил продукт и аудиторию. Могу подготовить оффер, объявление или описание продукта. Какой текст нужен первым?`,
    designer: `Я изучил контекст проекта. Помогу выбрать визуальное направление, структуру макета или собрать дизайн-бриф. Что прорабатываем?`,
    legal: `Я вижу контекст проекта. Помогу собрать риски, вопросы и чек-лист документов. Ответ не заменяет консультацию профессионального юриста. Что проверим?`,
    hr: `Я изучил задачи бизнеса. Помогу определить роли, ответственность или подготовить вакансию. Что нужно команде сейчас?`,
    "customer-manager": `Я изучил клиентов и текущую цель. Могу подготовить сценарий продажи, работу с возражениями или коммуникацию после заявки. Что делегируем?`,
  };
  return greetings[agentId] || `Я изучил контекст ${project}. Какую задачу делегируем первой?`;
}

function accentClasses(accent: string) {
  return ({
    red: "bg-alfa-red text-white",
    blue: "bg-future-blue text-white",
    purple: "bg-future-purple text-white",
    lime: "bg-future-green text-black",
  } as Record<string, string>)[accent] || "bg-black text-white";
}

function RoleAvatar({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  if (id === "alpha-partner") {
    return (
      <span className={`${dimensions} relative block shrink-0 overflow-hidden rounded-[16px] bg-future-blue`}>
        <Image src={assetPath("/assets/ai/alfa-agent.png")} alt="Аватар Альфа-Партнёра" fill sizes="64px" className="object-cover object-top" />
      </span>
    );
  }
  const agent = getAgentDefinition(id);
  const avatar = AGENT_AVATARS[id];
  if (avatar) {
    return (
      <span className={`${dimensions} relative block shrink-0 overflow-hidden rounded-[16px] bg-white`}>
        <Image src={assetPath(avatar)} alt={`Аватар: ${agent?.name || "AI-специалист"}`} fill sizes="64px" className="object-cover" />
      </span>
    );
  }
  return <span className={`${dimensions} ${accentClasses(agent?.accent ?? "blue")} grid shrink-0 place-items-center rounded-[16px] text-[13px] font-bold`}>{agent?.initials ?? "AI"}</span>;
}

function StatusDot({ status }: { status: AgentStatus }) {
  const color = status === "ready" ? "bg-future-green" : status === "working" ? "bg-alfa-red" : status === "waiting" ? "bg-future-blue" : "bg-black/20";
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />;
}

function useDialogFocus<T extends HTMLElement>(onClose: () => void) {
  const dialogRef = useRef<T>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    if (!dialog) {
      document.body.style.overflow = previousBodyOverflow;
      return;
    }
    const activeDialog = dialog;
    const selector = "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    activeDialog.querySelector<HTMLElement>(selector)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>(selector));
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    activeDialog.addEventListener("keydown", onKeyDown);
    return () => {
      activeDialog.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return dialogRef;
}

export function AlphaPartnerPrototype() {
  const [state, setState] = useState<PartnerState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [productModal, setProductModal] = useState<BankRecommendation | null>(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  const [alfaBusinessOpen, setAlfaBusinessOpen] = useState(false);
  const [businessDataInfoOpen, setBusinessDataInfoOpen] = useState(false);
  const [alfaBusinessConnected, setAlfaBusinessConnected] = useState(false);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [systemNotice, setSystemNotice] = useState("");
  const [lastFailedRequest, setLastFailedRequest] = useState<FailedRequest | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [demoView, setDemoView] = useState<"none" | "product" | "finance" | "marketing" | "progress" | "next" | "prompt" | "payments">("none");
  const [demoThinkingText, setDemoThinkingText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const howItWorksRef = useRef<HTMLButtonElement>(null);
  const requestSequence = useRef(0);
  const clearStorageAfterReset = useRef(false);
  const demoSnapshot = useRef<PartnerState | null>(null);
  const demoUiSnapshot = useRef<{ connectionStatus: ConnectionStatus; alfaBusinessConnected: boolean; onboardingOpen: boolean } | null>(null);
  const demoMessageSequence = useRef(0);

  const activeIsPartner = state.activeAgentId === "alpha-partner";
  const activeDefinition = activeIsPartner ? null : getAgentDefinition(state.activeAgentId);
  const activeMember = state.team.find((member) => member.id === state.activeAgentId);
  const activeMessages = activeIsPartner ? state.partnerHistory : state.agentThreads[state.activeAgentId] ?? [];
  const partnerAnswerCount = countUserMessages(state.partnerHistory);
  const showPartnerWelcome = activeIsPartner && partnerAnswerCount === 0;
  const setupComplete = state.phase !== "collecting" || state.teamConfirmed;
  const setupStep = Math.min(5, partnerAnswerCount + 1);
  const thinkingMessages = activeIsPartner
    ? state.teamConfirmed
      ? ["Думаю над следующим шагом…", "Собираю результаты команды…", "Выбираю подходящего специалиста…"]
      : ["Думаю над ответом…", "Сверяю ответ с паспортом бизнеса…", "Выбираю, что уточнить дальше…"]
    : ["Изучаю задачу…", "Сверяюсь с контекстом бизнеса…", "Готовлю полезный результат…"];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          const clean = sanitizePartnerState(parsed);
          if (isStoredState(clean)) {
            const agentThreads = Object.fromEntries(
              Object.entries(clean.agentThreads).map(([agentId, messages]) => [agentId, normalizeMessagesBranding(messages)]),
            );
            setState({
              ...clean,
              passport: normalizePassport(clean.passport),
              partnerHistory: normalizeInitialGreeting(clean.partnerHistory),
              agentThreads,
            });
          }
        } else {
          const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            const migrated = migrateLegacyState(JSON.parse(legacy));
            if (migrated) setState(migrated);
          }
        }
        if (window.localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "true") setOnboardingOpen(true);
        setAlfaBusinessConnected(window.localStorage.getItem(ALFA_BUSINESS_STORAGE_KEY) === "true");
      } catch {
        setState(createInitialState());
        setOnboardingOpen(true);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (demoSnapshot.current) return;
    try {
      if (clearStorageAfterReset.current) {
        clearStorageAfterReset.current = false;
        clearPartnerStorage(window.localStorage, [STORAGE_KEY, LEGACY_STORAGE_KEY, ALFA_BUSINESS_STORAGE_KEY]);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, serializePartnerState(state));
    } catch {
      // Прототип продолжает работать, даже если браузер запретил локальное хранилище.
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void checkChatHealth().then((health) => {
      if (cancelled || demoSnapshot.current) return;
      if (health.status === "ok" && health.configured && health.oauthAvailable && health.modelAvailable) {
        setConnectionStatus("connected");
        setSystemNotice("");
      } else {
        setConnectionStatus("error");
        setSystemNotice("Не удалось подключиться к AI. Можно продолжить в демо-режиме.");
      }
    });
    return () => { cancelled = true; };
  }, [hydrated]);

  useEffect(() => {
    const element = chatRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, state.phase, loading, state.paymentState, demoView]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setThinkingIndex((current) => (current + 1) % thinkingMessages.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [loading, state.activeAgentId, state.phase, state.teamConfirmed, thinkingMessages.length]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 104)}px`;
  }, [input]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const passportFields = useMemo(() => [
    ["Тип", state.passport.projectType],
    ["Проект", state.passport.product || state.passport.direction],
    ["Стадия", state.passport.stage],
    ["Цель", state.passport.goal],
  ], [state.passport]);
  const currentProcessStep = state.teamSummaries.length > 0
    ? 3
    : state.teamConfirmed
      ? 2
      : state.phase === "context_ready" || state.phase === "team_review"
        ? 1
        : 0;

  function demoMessage(role: Message["role"], text: string): Message {
    demoMessageSequence.current += 1;
    return { id: `demo-${demoMessageSequence.current}`, role, text, source: "demo" };
  }

  function applyDemoStep(step: DemoStep) {
    if (step.type === "reset") {
      demoMessageSequence.current = 0;
      setState({ ...createInitialState(), partnerHistory: [] });
      setInput("");
      setInputError("");
      setLoading(false);
      setDemoView("none");
      setTeamPanelOpen(false);
      setEditingTeam(false);
      setOnboardingOpen(false);
      setSystemNotice("");
      setConnectionStatus("demo");
      return;
    }
    if (step.type === "setLoading") {
      setLoading(step.value);
      setDemoThinkingText(step.label ?? "");
      if (step.value) setDemoView("none");
      return;
    }
    if (step.type === "sendUser") {
      setInput("");
      setState((current) => {
        const agentId = step.agentId ?? current.activeAgentId;
        const message = demoMessage("user", step.text);
        if (agentId === "alpha-partner") return { ...current, partnerHistory: [...current.partnerHistory, message] };
        return {
          ...current,
          agentThreads: appendAgentMessage(current.agentThreads, agentId, message),
          agentStatuses: { ...current.agentStatuses, [agentId]: "working" },
          agentTasks: { ...current.agentTasks, [agentId]: step.text },
        };
      });
      return;
    }
    if (step.type === "agentMessage") {
      setState((current) => {
        const agentId = step.agentId ?? current.activeAgentId;
        const message = demoMessage("agent", step.text);
        return agentId === "alpha-partner"
          ? { ...current, partnerHistory: [...current.partnerHistory, message] }
          : { ...current, agentThreads: appendAgentMessage(current.agentThreads, agentId, message) };
      });
      return;
    }
    if (step.type === "showPassport") {
      setState((current) => ({ ...current, passport: { ...DEMO_PASSPORT }, phase: "context_ready" }));
      setDemoView("none");
      return;
    }
    if (step.type === "showTeamProposal") {
      setState((current) => ({ ...current, passport: { ...DEMO_PASSPORT }, team: DEMO_TEAM.map((member) => ({ ...member })), phase: "team_review" }));
      return;
    }
    if (step.type === "confirmTeam") {
      const statuses = Object.fromEntries(DEMO_TEAM.map((member) => [member.id, "idle"])) as Record<string, AgentStatus>;
      setState((current) => ({ ...current, phase: "active", teamConfirmed: true, agentStatuses: statuses }));
      return;
    }
    if (step.type === "showTeam") {
      setLoading(false);
      setDemoView("none");
      setTeamPanelOpen(true);
      return;
    }
    if (step.type === "openAgent") {
      setTeamPanelOpen(false);
      setLoading(false);
      setDemoView("none");
      setState((current) => ({
        ...current,
        activeAgentId: step.agentId,
        agentThreads: step.agentId === "alpha-partner" || current.agentThreads[step.agentId]
          ? current.agentThreads
          : { ...current.agentThreads, [step.agentId]: [] },
      }));
      return;
    }
    if (step.type === "showResult") {
      const summaries: Record<DemoResultKind, ChatTeamSummary> = {
        product: { agentId: "product", agentName: "Продуктовый специалист", summary: "Собран тест спроса: лендинг, форма предзаказа и критерий 10+ заявок за 3 дня." },
        finance: { agentId: "finance", agentName: "Финансовый аналитик", summary: "Рассчитана цена запуска 3 490 ₽ при себестоимости 1 850 ₽." },
        marketing: { agentId: "marketer", agentName: "Маркетолог", summary: "Выбран первый канал: три коротких видео с целью получить 10 заявок за 3 дня." },
      };
      const summary = summaries[step.kind];
      setState((current) => ({
        ...current,
        agentStatuses: { ...current.agentStatuses, [summary.agentId]: "ready" },
        teamSummaries: [...current.teamSummaries.filter((item) => item.agentId !== summary.agentId), summary],
      }));
      setDemoView(step.kind);
      return;
    }
    if (step.type === "showProgress") setDemoView("progress");
    if (step.type === "showNextStep") setDemoView("next");
    if (step.type === "showProductPrompt") {
      setState((current) => ({ ...current, partnerHistory: [...current.partnerHistory, demoMessage("agent", "Показать подходящий способ принимать первые оплаты?")] }));
      setDemoView("prompt");
    }
    if (step.type === "showPaymentOptions") setDemoView("payments");
  }

  const demo = useDemoRunner({
    steps: DEMO_STEPS,
    onStep: applyDemoStep,
    onType: setInput,
  });
  const demoRunning = demo.status === "running" || demo.status === "paused";
  const demoFinished = demo.status === "finished";
  const demoActive = demoRunning || demoFinished;

  function startDemoScenario() {
    if (demoRunning) return;
    if (!demoSnapshot.current) {
      demoSnapshot.current = state;
      demoUiSnapshot.current = { connectionStatus, alfaBusinessConnected, onboardingOpen };
    }
    requestSequence.current += 1;
    setProductModal(null);
    setAlfaBusinessOpen(false);
    setBusinessDataInfoOpen(false);
    setResetOpen(false);
    setAlfaBusinessConnected(false);
    demo.start();
  }

  function closeDemoScenario(message?: string) {
    demo.stop();
    requestSequence.current += 1;
    const snapshot = demoSnapshot.current;
    const uiSnapshot = demoUiSnapshot.current;
    demoSnapshot.current = null;
    demoUiSnapshot.current = null;
    setLoading(false);
    setDemoView("none");
    setTeamPanelOpen(false);
    setInput("");
    setDemoThinkingText("");
    if (snapshot) setState(snapshot);
    if (uiSnapshot) {
      setConnectionStatus(uiSnapshot.connectionStatus);
      setAlfaBusinessConnected(uiSnapshot.alfaBusinessConnected);
      setOnboardingOpen(uiSnapshot.onboardingOpen);
    }
    if (message) setToast(message);
  }

  function stopDemoScenario() {
    closeDemoScenario("Демонстрация остановлена — прежнее состояние восстановлено");
  }

  function openAgent(agentId: string) {
    if (loading) return;
    if (agentId === "alpha-partner") {
      setState((current) => ({ ...current, activeAgentId: "alpha-partner" }));
      setTeamPanelOpen(false);
      return;
    }
    const member = state.team.find((item) => item.id === agentId);
    if (!member) return;
    setState((current) => {
      const thread = current.agentThreads[agentId];
      return {
        ...current,
        activeAgentId: agentId,
        agentThreads: thread?.length ? current.agentThreads : ensureAgentThread(current.agentThreads, agentId, makeMessage("agent", agentGreeting(agentId, current.passport))),
        agentStatuses: { ...current.agentStatuses, [agentId]: current.agentStatuses[agentId] ?? "idle" },
      };
    });
    setTeamPanelOpen(false);
  }

  function confirmTeam() {
    if (state.team.length < 3 || state.team.length > 5) return;
    setState((current) => {
      const statuses = { ...current.agentStatuses };
      for (const member of current.team) statuses[member.id] ??= "idle";
      return {
        ...current,
        teamConfirmed: true,
        phase: "active",
        activeAgentId: "alpha-partner",
        agentStatuses: statuses,
        partnerHistory: [...current.partnerHistory, makeMessage("agent", "Команда готова. Откройте «Моя команда», выберите специалиста и напишите, что ему нужно сделать. Там же можно скачать ZIP-комплект для компьютера или телефона. В архиве будут описание бизнеса, состав команды и задачи каждого специалиста. Это демонстрационный комплект: агенты из архива пока не запускаются и не управляют устройством.")],
      };
    });
    setEditingTeam(false);
  }

  function removeMember(id: string) {
    setState((current) => ({ ...current, team: current.team.filter((member) => member.id !== id) }));
  }

  function addMember(id: string) {
    setState((current) => ({ ...current, team: addTeamMember(current.team, id, current.passport) }));
  }

  function applyFallback(answer: string, passport: BusinessPassport, apiTeam: ChatTeamMember[], agentId: string) {
    setState((current) => {
      if (current.paymentState === "confirming" && isAffirmative(answer)) {
        return {
          ...current,
          passport,
          paymentState: "unlocked",
          activeAgentId: "alpha-partner",
          partnerHistory: [...current.partnerHistory, makeMessage("agent", "Понял: покупатель уже готов сделать заказ, поэтому теперь нужно выбрать удобный способ принять оплату. Показываю подходящий вариант Альфа-Бизнеса.", "demo", FIRST_PAYMENT_RECOMMENDATION)],
        };
      }
      if (current.paymentState === "confirming" && isNegativePaymentAnswer(answer)) {
        const histories = agentId === "alpha-partner"
          ? { partnerHistory: [...current.partnerHistory, makeMessage("agent", "Понял, принимать оплату пока не нужно. Продолжаем работу с командой.", "demo")] }
          : { partnerHistory: current.partnerHistory };
        return { ...current, ...histories, passport, paymentState: "idle" };
      }
      if (hasOrderSignal(answer)) {
        const partnerHistory = agentId === "alpha-partner"
          ? [...current.partnerHistory, makeMessage("agent", PAYMENT_CONFIRMATION, "demo")]
          : [...current.partnerHistory, makeMessage("agent", PAYMENT_CONFIRMATION, "demo")];
        return { ...current, passport, activeAgentId: "alpha-partner", partnerHistory, paymentState: "confirming" };
      }
      if (agentId !== "alpha-partner") {
        const id = agentId;
        const result = fallbackSpecialistResult(id, answer, passport);
        const summary = `${getAgentDefinition(id)?.name}: ${result}`.slice(0, 800);
        return {
          ...current,
          passport,
          agentThreads: appendAgentMessage(current.agentThreads, id, makeMessage("agent", result, "demo")),
          agentStatuses: { ...current.agentStatuses, [id]: "ready" },
          pendingSummaries: { ...current.pendingSummaries, [id]: summary },
        };
      }
      if (current.teamConfirmed) {
        return {
          ...current,
          passport,
          phase: "active",
          partnerHistory: [
            ...current.partnerHistory,
            makeMessage("agent", "Я сохранил информацию о бизнесе и ответы специалистов. Теперь откройте «Моя команда» и выберите, кому поручить следующую задачу. Если не знаете кого выбрать — просто напишите, что нужно сделать.", "demo"),
          ],
        };
      }
      if (hasFallbackContext(passport)) {
        const team = apiTeam.length >= 3 ? apiTeam : buildFallbackTeam(passport);
        return {
          ...current,
          passport,
          team,
          phase: "context_ready",
          partnerHistory: [...current.partnerHistory, makeMessage("agent", "Готово: я понял, что у вас за бизнес, чего вы хотите добиться и что уже сделано. Теперь покажу специалистов, которые помогут решить ближайшие задачи.", "demo")],
        };
      }
      return {
        ...current,
        passport,
        partnerHistory: [...current.partnerHistory, makeMessage("agent", fallbackQuestion(passport), "demo")],
      };
    });
  }

  async function submitAnswer(answer: string, retryRequest?: FailedRequest) {
    const value = answer.trim();
    if (!value) {
      setInputError("Напишите сообщение или выберите быстрый ответ.");
      inputRef.current?.focus();
      return;
    }
    if (value.length > MAX_INPUT_LENGTH) {
      setInputError(`Сократите сообщение до ${MAX_INPUT_LENGTH} символов.`);
      return;
    }
    const request: FailedRequest = retryRequest ?? {
      value,
      agentId: state.activeAgentId,
      history: toHistory(activeMessages),
      passport: state.passport,
      team: state.team,
      teamSummaries: state.teamSummaries,
      teamConfirmed: state.teamConfirmed,
      alfaBusinessConnected,
    };
    const currentAgentId = request.agentId;
    const userMessage = makeMessage("user", value);
    const sequence = ++requestSequence.current;
    setInput("");
    setInputError("");
    setThinkingIndex(0);
    setLoading(true);
    if (!retryRequest) {
      setState((current) => {
        if (currentAgentId === "alpha-partner") return { ...current, partnerHistory: [...current.partnerHistory, userMessage], suggestedAgentId: "" };
        return {
          ...current,
          agentThreads: appendAgentMessage(current.agentThreads, currentAgentId, userMessage),
          agentStatuses: { ...current.agentStatuses, [currentAgentId]: "working" },
          agentTasks: { ...current.agentTasks, [currentAgentId]: value },
        };
      });
    }

    try {
      const response = await sendChatMessage({
        message: value,
        history: request.history,
        passport: request.passport,
        role: currentAgentId === "alpha-partner" ? "partner" : "specialist",
        agentId: currentAgentId,
        team: request.team,
        teamSummaries: request.teamSummaries,
        teamConfirmed: request.teamConfirmed,
        alfaBusiness: request.alfaBusinessConnected ? { connected: true, demo: true, metrics: DEMO_ALFA_BUSINESS_DATA } : { connected: false, demo: false },
      });
      if (sequence !== requestSequence.current) return;
      const passport = normalizePassport(response.passport);
      if (response.status === "error") {
        setConnectionStatus("demo");
        setSystemNotice(FALLBACK_NOTICE);
        setLastFailedRequest(request);
        if (!retryRequest) applyFallback(value, passport, response.team, currentAgentId);
        return;
      }
      const recovered = connectionStatus !== "connected";
      setConnectionStatus("connected");
      setSystemNotice("");
      setLastFailedRequest(null);
      if (recovered) setToast("AI снова подключён");
      if (response.status === "payment_confirmation") {
        setState((current) => {
          const partnerHistory = withoutTrailingDemo(current.partnerHistory, Boolean(retryRequest));
          const agentThreads = currentAgentId === "alpha-partner" ? current.agentThreads : {
            ...current.agentThreads,
            [currentAgentId]: [
              ...withoutTrailingDemo(current.agentThreads[currentAgentId] ?? [], Boolean(retryRequest)),
              makeMessage("agent", "Похоже, вам уже нужно принимать оплату. Переключаю на Альфа-Партнёра: он сначала уточнит, есть ли реальный заказ или предзаказ."),
            ],
          };
          return {
            ...current,
            passport,
            activeAgentId: "alpha-partner",
            paymentState: "confirming",
            agentThreads,
            partnerHistory: [...partnerHistory, makeMessage("agent", PAYMENT_CONFIRMATION)],
          };
        });
        return;
      }
      setState((current) => {
        const suggestedAgentId = response.nextAction?.startsWith("open:") ? response.nextAction.slice(5) : "";
        if (currentAgentId === "alpha-partner") {
          const partnerHistory = withoutTrailingDemo(current.partnerHistory, Boolean(retryRequest));
          return {
            ...current,
            passport,
            team: current.teamConfirmed ? current.team : response.team.length ? response.team : current.team,
            phase: current.teamConfirmed ? "active" : response.status === "team_ready" ? "context_ready" : current.phase,
            partnerHistory: [...partnerHistory, makeMessage("agent", response.reply, "ai", current.teamConfirmed ? response.bankRecommendation : null)],
            suggestedAgentId,
            paymentState: response.nextAction === "payment_confirmed" ? "unlocked" : current.paymentState === "confirming" && isNegativePaymentAnswer(value) ? "idle" : current.paymentState,
          };
        }
        const status: AgentStatus = response.status === "result_ready" ? "ready" : "waiting";
        const currentThread = withoutTrailingDemo(current.agentThreads[currentAgentId] ?? [], Boolean(retryRequest));
        return {
          ...current,
          passport,
          agentThreads: { ...current.agentThreads, [currentAgentId]: [...currentThread, makeMessage("agent", response.reply, "ai", response.bankRecommendation)] },
          agentStatuses: { ...current.agentStatuses, [currentAgentId]: status },
          pendingSummaries: response.sharedSummary ? { ...current.pendingSummaries, [currentAgentId]: response.sharedSummary } : current.pendingSummaries,
          suggestedAgentId,
        };
      });
    } catch {
      if (sequence !== requestSequence.current) return;
      setConnectionStatus("demo");
      setSystemNotice(FALLBACK_NOTICE);
      setLastFailedRequest(request);
      if (!retryRequest) {
        const fallbackPassport = extractFallbackPassport(value, request.passport);
        applyFallback(value, fallbackPassport, buildFallbackTeam(fallbackPassport), currentAgentId);
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }

  async function retryConnection() {
    if (loading) return;
    const sequenceAtStart = requestSequence.current;
    const failedRequestAtStart = lastFailedRequest;
    setConnectionStatus("checking");
    const health = await checkChatHealth();
    if (sequenceAtStart !== requestSequence.current) return;
    if (health.status !== "ok" || !health.configured || !health.oauthAvailable || !health.modelAvailable) {
      setConnectionStatus("error");
      setSystemNotice("Подключение пока не восстановлено. Можно продолжить в демо-режиме.");
      return;
    }
    if (!failedRequestAtStart) {
      setConnectionStatus("connected");
      setSystemNotice("");
      setToast("AI снова подключён");
      return;
    }
    await submitAnswer(failedRequestAtStart.value, failedRequestAtStart);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (demoActive) return;
    void submitAnswer(input);
  }

  function transferResult() {
    const id = state.activeAgentId;
    const summary = state.pendingSummaries[id];
    const agent = getAgentDefinition(id);
    if (!summary || !agent) return;
    setState((current) => {
      const pendingSummaries = { ...current.pendingSummaries };
      delete pendingSummaries[id];
      return {
        ...current,
        pendingSummaries,
        teamSummaries: [...current.teamSummaries.filter((item) => item.agentId !== id), { agentId: id, agentName: agent.name, summary }],
        partnerHistory: [...current.partnerHistory, makeMessage("agent", `Я получил результат от специалиста «${agent.name}» и сохранил главное. Когда вы спросите, что делать дальше, я учту этот результат вместе с остальной информацией о бизнесе.`)],
      };
    });
    setToast("Результат передан Альфа-Партнёру");
  }

  function focusChat() {
    document.getElementById("alpha-partner-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function closeOnboarding() {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Приветствие всё равно можно закрыть, даже если localStorage недоступен.
    }
    setOnboardingOpen(false);
  }

  function connectAlfaBusiness() {
    try {
      window.localStorage.setItem(ALFA_BUSINESS_STORAGE_KEY, "true");
    } catch {
      // Демо остаётся доступным в текущей сессии, даже если localStorage заблокирован.
    }
    setAlfaBusinessConnected(true);
    setAlfaBusinessOpen(false);
    setToast("Демо Альфа-Бизнес подключено");
  }

  function openPlans() {
    setTeamPanelOpen(false);
    window.setTimeout(() => document.getElementById("alpha-partner-plans")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function downloadTeamKit() {
    try {
      downloadTeamPrototypeKit({ passport: state.passport, team: state.team, agentTasks: state.agentTasks });
      setToast("Скачивание ZIP-комплекта начато");
    } catch {
      setToast("Не удалось собрать ZIP. Попробуйте ещё раз");
    }
  }

  function restart() {
    demo.stop();
    demoSnapshot.current = null;
    demoUiSnapshot.current = null;
    requestSequence.current += 1;
    clearStorageAfterReset.current = true;
    try {
      clearPartnerStorage(window.localStorage, [STORAGE_KEY, LEGACY_STORAGE_KEY, ALFA_BUSINESS_STORAGE_KEY]);
    } catch {
      // Состояние интерфейса всё равно сбрасывается, если localStorage недоступен.
    }
    setLoading(false);
    setDemoView("none");
    setState(createInitialState());
    setAlfaBusinessConnected(false);
    setDismissedRecommendations([]);
    setProductModal(null);
    setProductDetailsOpen(false);
    setAlfaBusinessOpen(false);
    setBusinessDataInfoOpen(false);
    setEditingTeam(false);
    setResetOpen(false);
    setTeamPanelOpen(false);
    setLastFailedRequest(null);
    setSystemNotice("");
    setToast("");
    setInput("");
    setInputError("");
  }

  if (!hydrated) {
    return <section className="min-h-[560px] bg-surface" aria-label="Загрузка Альфа-Партнёра" />;
  }

  return (
    <section className="ai-agent-shell overflow-hidden bg-white text-black">
      <div className="relative overflow-hidden bg-alfa-red text-white">
        <div className="relative mx-auto h-[850px] max-w-[1920px] overflow-hidden sm:h-[900px] xl:h-[660px]">
          <Image
            src={assetPath("/assets/ai/hero-partner.png")}
            alt="Предпринимательница с ноутбуком"
            width={1672}
            height={940}
            priority
            sizes="(max-width: 767px) 820px, (max-width: 1199px) 1180px, 1420px"
            className="pointer-events-none absolute bottom-[-150px] left-[calc(60%+10px)] z-10 h-auto w-[820px] max-w-none -translate-x-1/2 object-contain sm:bottom-[-120px] sm:left-[calc(58%+10px)] sm:w-[1180px] xl:bottom-[-118px] xl:left-[calc(68%+10px)] xl:w-[1420px]"
          />

          <div className="relative z-20 mx-auto h-full max-w-[1180px] px-5 pt-[128px] sm:px-8 sm:pt-[146px] xl:max-w-[1400px] xl:px-0 xl:pt-[178px]">
            <div className="relative w-full max-w-[600px] xl:ml-0 xl:w-[48%] xl:max-w-[640px]">
              <h1 className="max-w-[760px] text-[clamp(3.25rem,14vw,5.25rem)] font-bold leading-[.9] tracking-[-.055em] text-white sm:text-[clamp(4.9rem,10vw,7rem)] xl:max-w-[640px] xl:text-[74px]">
                Соберите AI-команду
                <br />
                под свой бизнес
              </h1>
              <p className="mt-6 max-w-[560px] text-[16px] font-normal leading-[1.45] text-white sm:text-[18px] xl:mt-7 xl:text-[19px]">
                Расскажите о бизнесе или идее. Альфа-Партнёр изучит задачу и соберёт подходящую AI-команду.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[480px]:flex-row xl:mt-8">
                <button type="button" onClick={focusChat} className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[12px] bg-future-green px-7 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  Собрать команду <ArrowRight size={18} />
                </button>
                <button ref={howItWorksRef} type="button" onClick={() => document.getElementById("how-ai-agent-works")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[12px] bg-white px-7 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
                  Как это работает <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-30 flex h-[76px] items-center overflow-hidden"
          style={{ background: "linear-gradient(90deg, rgba(202,24,20,.98) 0%, rgba(225,15,10,.96) 42%, rgba(255,255,255,.52) 76%, rgba(190,25,20,.98) 100%)" }}
          aria-label="Альфа-Партнёр — ваша AI-команда для бизнеса"
        >
          <div className="alpha-partner-marquee-track flex w-max shrink-0 items-center whitespace-nowrap text-[20px] font-bold leading-none text-white sm:text-[24px]">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} className="px-4 sm:px-6">Альфа-Партнёр → ваша AI-команда для бизнеса →</span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes alpha-partner-marquee {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes alpha-thinking-dot {
            0%, 70%, 100% { opacity: .28; transform: translateY(0); }
            35% { opacity: 1; transform: translateY(-3px); }
          }
          .alpha-partner-marquee-track {
            animation: alpha-partner-marquee 30s linear infinite;
            will-change: transform;
          }
          .alpha-thinking-dot { animation: alpha-thinking-dot 1.1s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .alpha-partner-marquee-track, .alpha-thinking-dot { animation: none; }
          }
        `}</style>
      </div>

      <div className="bg-[#f7f7f8]">
       <Container className="ai-agent-container">
        <div className="mx-auto max-w-[1180px] py-16 sm:py-20 laptop:py-24">
          <div id="alpha-partner-chat" className="ai-agent-chat scroll-mt-5 flex h-[clamp(620px,82dvh,900px)] min-h-[620px] max-h-[900px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_50px_rgba(0,0,0,.07)] sm:min-h-[720px]">
            <div className="h-2 shrink-0 bg-alfa-red" aria-hidden="true" />
            <header className="flex min-h-[76px] items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <RoleAvatar id={state.activeAgentId} />
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-x-2">
                    <p className="whitespace-nowrap text-[12px] font-bold sm:text-[16px]">{activeIsPartner ? <>AI-агент <span className="text-alfa-red">Альфа-Партнёр</span></> : activeMember?.name || activeDefinition?.name}</p>
                    <ConnectionBadge status={connectionStatus} />
                  </div>
                  <p className="truncate text-[10px] text-black/45 sm:text-[12px]">{activeIsPartner ? "Изучает бизнес и координирует команду" : activeDefinition?.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!activeIsPartner && <button type="button" disabled={loading} onClick={() => openAgent("alpha-partner")} className="hidden min-h-11 items-center gap-2 rounded-full bg-muted px-4 text-[11px] font-bold hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue sm:inline-flex"><ArrowLeft size={14} />К Альфа-Партнёру</button>}
                {!activeIsPartner && <button type="button" disabled={loading} onClick={() => openAgent("alpha-partner")} className="grid h-11 w-11 place-items-center rounded-full bg-muted text-black disabled:cursor-not-allowed disabled:opacity-40 sm:hidden" aria-label="Вернуться к Альфа-Партнёру"><ArrowLeft size={17} /></button>}
                {state.teamConfirmed && <button type="button" disabled={loading} onClick={() => setTeamPanelOpen(true)} aria-label={`Моя команда · ${state.team.length}`} className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-black px-3.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue"><Users size={15} /><span className="hidden sm:inline">Моя команда · </span>{state.team.length}</button>}
                <button type="button" onClick={() => setResetOpen(true)} title="Начать заново" className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-muted px-3 text-[11px] font-bold text-black/55 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue" aria-label="Начать заново"><RotateCcw size={17} /><span className="hidden laptop:inline">Начать заново</span></button>
              </div>
            </header>

            {activeIsPartner && !demoActive && (
              <div className="shrink-0 border-t border-black/5 px-4 py-2.5 sm:px-6">
                <div className="mx-auto flex max-w-[920px] flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
                  <p className="min-w-0 flex-1 truncate text-[10px] font-bold text-black/55 sm:flex-none sm:text-[11px]">
                    {demoRunning && !activeIsPartner ? `Демонстрация · ${activeMember?.name || "специалист"}` : state.teamConfirmed ? "Контекст собран · команда готова" : setupComplete ? "Контекст собран · подбираю команду" : `Знакомство с бизнесом · шаг ${setupStep} из 5`}
                  </p>
                  <div className="order-3 h-1.5 basis-full overflow-hidden rounded-full bg-black/8 sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto" aria-hidden="true">
                    <div className="h-full rounded-full bg-alfa-red transition-[width] duration-300" style={{ width: `${setupComplete ? 100 : setupStep * 20}%` }} />
                  </div>
                   {demoActive && <span className="rounded-full bg-alfa-red px-2.5 py-1.5 text-[8px] font-black tracking-[.12em] text-white">DEMO</span>}
                   {demoRunning && <div className="flex items-center gap-1 rounded-[11px] bg-black/5 p-1">{[0.75, 1, 1.25].map((value) => <button key={value} type="button" onClick={() => demo.setSpeed(value)} className={`min-h-7 rounded-[8px] px-2 text-[9px] font-bold ${demo.speed === value ? "bg-white text-black shadow-sm" : "text-black/42"}`}>{value}x</button>)}</div>}
                   {demoRunning && <button type="button" onClick={demo.togglePause} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-[11px] bg-black/5 px-3 text-[10px] font-bold text-black">{demo.status === "paused" ? <Play size={12} fill="currentColor" /> : <Pause size={12} />}{demo.status === "paused" ? "Продолжить" : "Пауза"}</button>}
                   {demoRunning && <button type="button" onClick={stopDemoScenario} className="min-h-9 shrink-0 rounded-[11px] bg-black px-3 text-[10px] font-bold text-white">Остановить</button>}
                </div>
              </div>
            )}

            {state.teamConfirmed && (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-black/5 px-4 py-2 laptop:hidden" aria-label="Быстрое переключение между агентами">
                {["alpha-partner", ...state.team.map((member) => member.id)].map((agentId) => {
                  const agent = agentId === "alpha-partner" ? null : state.team.find((member) => member.id === agentId);
                  const label = agentId === "alpha-partner" ? "Альфа-Партнёр" : agent?.name || "Специалист";
                  const active = state.activeAgentId === agentId;
                  return (
                    <button key={agentId} type="button" disabled={loading} onClick={() => openAgent(agentId)} aria-label={`Открыть чат: ${label}`} aria-current={active ? "page" : undefined} className={`relative shrink-0 rounded-[14px] p-1 transition-transform disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${active ? "bg-alfa-red" : "bg-black/5"}`}>
                      <RoleAvatar id={agentId} size="sm" />
                      {agentId !== "alpha-partner" && <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"><StatusDot status={state.agentStatuses[agentId] ?? "idle"} /></span>}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">

            <div ref={chatRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f5f5f5] px-4 py-5 sm:px-6 sm:py-6" aria-live="polite">
              <div className="mx-auto flex w-full max-w-[920px] flex-col gap-3">
                {activeMessages.map((message, index) => activeIsPartner && index === 0 && message.role === "agent" && message.text === START_MESSAGE ? (
                  <PartnerWelcomeCard key={message.id} showActions={showPartnerWelcome} onSelect={(reply) => void submitAnswer(reply)} onDemo={startDemoScenario} />
                ) : (
                  <div key={message.id} className="space-y-2">
                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] whitespace-pre-line rounded-[20px] px-4 py-3.5 text-[13px] font-normal leading-5 sm:max-w-[76%] sm:px-5 sm:py-4 sm:text-[14px] sm:leading-6 ${message.role === "user" ? "rounded-br-[6px] bg-black text-white" : "rounded-bl-[6px] bg-white text-black shadow-[0_4px_14px_rgba(0,0,0,.04)]"}`}>{message.text}</div>
                    </div>
                    {message.role === "agent" && message.bankRecommendation && !dismissedRecommendations.includes(message.id) && (
                      <BankRecommendationCard recommendation={message.bankRecommendation} onConnect={() => setProductModal(message.bankRecommendation ?? null)} onDismiss={() => setDismissedRecommendations((current) => [...current, message.id])} />
                    )}
                  </div>
                ))}

                {systemNotice && <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-black/[0.045] px-4 py-3 text-[11px] text-black/60" role="status"><span>{systemNotice}</span><button type="button" onClick={() => void retryConnection()} disabled={loading || connectionStatus === "checking"} className="min-h-9 rounded-full bg-white px-4 font-bold text-black ring-1 ring-black/10 disabled:opacity-45">Повторить подключение</button></div>}

                {loading && (
                  <div className="flex justify-start" role="status">
                    <span className="sr-only">{activeIsPartner ? "Альфа-Партнёр готовит ответ" : `${activeMember?.name || "Агент"} готовит ответ`}</span>
                    <div aria-hidden="true" className="flex items-center gap-3 rounded-[18px] rounded-bl-[6px] bg-white px-4 py-3 text-[12px] font-medium text-black/58 shadow-[0_4px_14px_rgba(0,0,0,.04)]">
                      <span className="flex gap-1" aria-hidden="true">
                        {[0, 1, 2].map((dot) => <span key={dot} className="alpha-thinking-dot h-1.5 w-1.5 rounded-full bg-alfa-red" style={{ animationDelay: `${dot * 140}ms` }} />)}
                      </span>
                      <span>{demoRunning && demoThinkingText ? demoThinkingText : thinkingMessages[thinkingIndex]}</span>
                    </div>
                  </div>
                )}

                {activeIsPartner && state.phase === "context_ready" && !loading && (
                  <ContextCard passport={state.passport} onBuild={() => setState((current) => ({ ...current, phase: "team_review" }))} />
                )}

                {activeIsPartner && state.phase === "team_review" && !loading && (
                  <TeamProposal
                    team={state.team}
                    editing={editingTeam}
                    passport={state.passport}
                    onEdit={() => setEditingTeam(true)}
                    onCancelEdit={() => setEditingTeam(false)}
                    onRemove={removeMember}
                    onAdd={addMember}
                    onConfirm={confirmTeam}
                    onOpen={openAgent}
                  />
                )}

                {activeIsPartner && state.suggestedAgentId && state.team.some((member) => member.id === state.suggestedAgentId) && (
                  <button type="button" onClick={() => openAgent(state.suggestedAgentId)} className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-future-blue px-5 text-[12px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue">Перейти к {getAgentDefinition(state.suggestedAgentId)?.name.toLowerCase()} <ArrowRight size={15} /></button>
                )}

                {!activeIsPartner && state.pendingSummaries[state.activeAgentId] && (
                  <div className="ml-auto w-full max-w-[560px] rounded-[22px] bg-future-green p-4 text-black sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em]">Результат готов</p>
                    <p className="mt-2 text-[13px] leading-5">Передайте короткий итог главному партнёру — он учтёт его в общем маршруте.</p>
                    <button type="button" onClick={transferResult} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-[12px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">Передать результат Альфа-Партнёру <ArrowRight size={14} /></button>
                  </div>
                )}

                {activeIsPartner && state.teamConfirmed && countUserMessages(state.partnerHistory) >= 4 && !alfaBusinessConnected && /существующ|работающ|продаж|заказ|выруч|финанс/i.test(Object.values(state.passport).join(" ")) && (
                  <div className="rounded-[20px] bg-black p-4 text-white sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-future-green">Точнее по фактическим данным</p>
                    <p className="mt-2 max-w-[680px] text-[12px] font-medium leading-5 text-white/72">Хотите подключить Альфа-Бизнес? Тогда я смогу учитывать операции бизнеса и давать рекомендации не только по сообщениям, но и по фактическим данным.</p>
                    <button type="button" onClick={() => setAlfaBusinessOpen(true)} className="mt-3 min-h-11 rounded-full bg-future-green px-5 text-[12px] font-bold text-black">Подключить демо</button>
                  </div>
                )}

                {!loading && !activeIsPartner && activeDefinition && activeMessages.filter((message) => message.role === "user").length === 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeDefinition.quickTasks.map((task) => <button key={task} type="button" onClick={() => void submitAnswer(task)} className="min-h-11 rounded-full bg-white px-4 text-[12px] font-bold ring-1 ring-black/10 hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue">{task}</button>)}
                  </div>
                )}

                {demoActive && demoView !== "none" && <DemoSceneCard view={demoView} finished={demoFinished} onShowPayments={() => setDemoView("payments")} onRepeat={startDemoScenario} onClose={() => closeDemoScenario()} />}
              </div>
            </div>

            <form onSubmit={onSubmit} className="border-t border-black/5 bg-white p-3 sm:p-4">
              <div className="mx-auto max-w-[920px]">
                <div className="flex items-end gap-2 rounded-[17px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,.06)] ring-1 ring-black/12 transition-shadow focus-within:shadow-[0_0_0_2px_var(--future-blue)] focus-within:ring-transparent">
                  <textarea ref={inputRef} value={input} disabled={loading} readOnly={demoActive} onChange={(event) => { setInput(event.target.value); if (inputError) setInputError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (!demoActive) void submitAnswer(input); } }} rows={1} maxLength={MAX_INPUT_LENGTH + 1} placeholder={activeIsPartner ? "Расскажите о бизнесе или задаче…" : "Опишите задачу специалисту…"} className="min-h-12 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-3 py-3 text-[13px] font-medium leading-6 outline-none placeholder:text-black/42 disabled:opacity-60" aria-label={activeIsPartner ? "Сообщение Альфа-Партнёру" : `Задача для ${activeDefinition?.name || "специалиста"}`} aria-describedby={inputError ? "alpha-input-error" : "alpha-input-hint"} />
                  <button type="submit" disabled={loading} className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-alfa-red text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red" aria-label="Отправить сообщение"><Send size={17} /></button>
                </div>
                <div className="mt-2 flex min-h-4 items-center justify-between px-2 text-[9px]">
                  <p id={inputError ? "alpha-input-error" : "alpha-input-hint"} className={inputError ? "font-bold text-alfa-red" : "font-medium text-black/38"}>{inputError || "Можно отвечать своими словами"}</p>
                  {input.length >= 600 && <span className="ml-auto text-black/35">{input.length}/{MAX_INPUT_LENGTH}</span>}
                </div>
              </div>
            </form>
              </div>

              {state.teamConfirmed && (
                <aside className="hidden w-[84px] shrink-0 flex-col items-center gap-3 border-l border-black/6 bg-white px-3 py-4 laptop:flex" aria-label="Быстрое переключение между агентами">
                  {["alpha-partner", ...state.team.map((member) => member.id)].map((agentId) => {
                    const agent = agentId === "alpha-partner" ? null : state.team.find((member) => member.id === agentId);
                    const label = agentId === "alpha-partner" ? "Альфа-Партнёр" : agent?.name || "Специалист";
                    const active = state.activeAgentId === agentId;
                    return (
                      <button key={agentId} type="button" disabled={loading} onClick={() => openAgent(agentId)} title={label} aria-label={`Открыть чат: ${label}`} aria-current={active ? "page" : undefined} className={`group relative rounded-[17px] p-1.5 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${active ? "bg-alfa-red" : "bg-black/5"}`}>
                        <RoleAvatar id={agentId} size={agentId === "alpha-partner" ? "md" : "sm"} />
                        {agentId !== "alpha-partner" && <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"><StatusDot status={state.agentStatuses[agentId] ?? "idle"} /></span>}
                        <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-[9px] bg-black px-2.5 py-2 text-[9px] font-bold text-white shadow-lg group-hover:block group-focus-visible:block">{label}</span>
                      </button>
                    );
                  })}
                  <button type="button" disabled={loading} onClick={() => setTeamPanelOpen(true)} title="Открыть всю команду" className="mt-auto grid h-11 w-11 place-items-center rounded-[14px] bg-black text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red" aria-label="Открыть всю команду"><Users size={17} /></button>
                </aside>
              )}
            </div>
          </div>

          <div className="mt-8 grid items-stretch gap-4 laptop:grid-cols-[1.1fr_.9fr]">
            <div className="overflow-hidden rounded-[24px] bg-black p-5 text-white sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="future-caption text-white/45">Маршрут работы</p>
                  <h2 className="future-card-title mt-2">От контекста к результату</h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold text-white/70">Шаг {currentProcessStep + 1} из 4</span>
              </div>
              <ol className="mt-6 grid gap-2 sm:grid-cols-4">
                {PROCESS_STEPS.map((label, index) => {
                  const completed = index < currentProcessStep;
                  const active = index === currentProcessStep;
                  return (
                    <li key={label} className={`min-h-[96px] rounded-[16px] p-3.5 transition-colors ${active ? "bg-alfa-red text-white" : completed ? "bg-future-green text-black" : "bg-white/8 text-white/42"}`}>
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-white text-alfa-red" : completed ? "bg-black text-white" : "bg-white/10 text-white/55"}`}>{completed ? <Check size={14} /> : index + 1}</span>
                      <p className="mt-3 text-[11px] font-bold leading-4">{label}</p>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-white p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="future-caption text-alfa-red">Паспорт бизнеса</p>
                <p className="text-[10px] font-normal text-black/38">Общий контекст команды</p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {passportFields.map(([label, value]) => (
                  <div key={label} className="min-w-0"><dt className="future-caption text-black/38">{label}</dt><dd className="mt-1.5 truncate text-[14px] font-bold leading-tight">{value || "Уточняется"}</dd></div>
                ))}
              </dl>
              {alfaBusinessConnected && <BusinessDataCard onExplain={() => setBusinessDataInfoOpen(true)} />}
            </div>
          </div>

        </div>
       </Container>
      </div>

      {state.teamConfirmed && <div className="bg-white"><Container className="ai-agent-container"><div className="mx-auto max-w-[1180px]"><TeamShowcase team={state.team} statuses={state.agentStatuses} busy={loading} onOpen={openAgent} onOpenAll={() => setTeamPanelOpen(true)} /></div></Container></div>}
      <AlfaBusinessSection connected={alfaBusinessConnected} onConnect={() => setAlfaBusinessOpen(true)} onExplain={() => setBusinessDataInfoOpen(true)} />

      {teamPanelOpen && <><TeamPanel state={state} onClose={() => setTeamPanelOpen(false)} onOpen={openAgent} onOpenPlans={openPlans} />{!demoActive && <TeamKitDownloadDock onDownload={downloadTeamKit} />}</>}
      {onboardingOpen && <OnboardingCarousel onClose={closeOnboarding} onStart={closeOnboarding} />}
      {resetOpen && <ConfirmModal title="Начать заново?" text="Будут удалены чат, паспорт бизнеса, команда, результаты специалистов и подключённые демо-данные Альфа-Бизнеса. Онбординг повторно не появится." confirmLabel="Удалить всё и начать" onConfirm={restart} onClose={() => setResetOpen(false)} />}
      {productModal && <ProductConnectModal recommendation={productModal} detailsOpen={productDetailsOpen} onShowDetails={() => setProductDetailsOpen(true)} onClose={() => { setProductModal(null); setProductDetailsOpen(false); }} />}
      {alfaBusinessOpen && <AlfaBusinessModal onConfirm={connectAlfaBusiness} onClose={() => setAlfaBusinessOpen(false)} />}
      {businessDataInfoOpen && <BusinessDataInfoModal onClose={() => setBusinessDataInfoOpen(false)} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 py-3 text-[12px] font-bold text-white shadow-lg" role="status"><Check size={15} className="text-future-green" />{toast}</div>}
    </section>
  );
}

function PartnerWelcomeCard({ showActions, onSelect, onDemo }: { showActions: boolean; onSelect: (reply: string) => void; onDemo: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-future-blue px-5 py-6 text-white sm:px-7 sm:py-7" aria-labelledby="partner-welcome-title">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-future-purple" aria-hidden="true" />
      <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-future-green" aria-hidden="true" />
      <div className="relative z-10 max-w-[700px]">
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-future-green">Начнём с вашего бизнеса</p>
        <h2 id="partner-welcome-title" className="mt-2 text-[25px] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[32px]">Привет, я ваш Альфа-Партнёр</h2>
        <p className="mt-3 max-w-[620px] text-[12px] font-normal leading-5 text-white/78 sm:text-[13px] sm:leading-6">Расскажите, с чем вы пришли. Я уточню только недостающие детали, соберу паспорт бизнеса и подберу 3–5 специалистов под ваши задачи.</p>
        {showActions && (
          <div className="mt-5 space-y-2.5">
            <button type="button" onClick={onDemo} className="flex min-h-14 w-full items-center justify-between gap-4 rounded-[13px] bg-alfa-red px-4 py-3 text-left text-[12px] font-bold leading-4 text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 sm:text-[13px]">
              <span><span className="block text-[8px] uppercase tracking-[0.1em] text-white/60 sm:text-[9px]">Посмотреть всё автоматически</span><span className="mt-1 block">Демонстрационный сценарий: запуск бренда одежды</span></span>
              <span className="shrink-0 text-[10px] text-white/65">≈ 50 сек →</span>
            </button>
            <div className="grid gap-2 sm:grid-cols-3">
              {START_REPLIES.map((reply, index) => (
                <button key={reply} type="button" onClick={() => onSelect(reply)} className={`min-h-12 rounded-[13px] px-4 text-left text-[12px] font-bold leading-4 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${index === 0 ? "bg-future-green text-black" : "bg-white text-black"}`}>{reply}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DemoSceneCard({
  view,
  finished,
  onShowPayments,
  onRepeat,
  onClose,
}: {
  view: "product" | "finance" | "marketing" | "progress" | "next" | "prompt" | "payments";
  finished: boolean;
  onShowPayments: () => void;
  onRepeat: () => void;
  onClose: () => void;
}) {
  const resultContent = {
    product: {
      eyebrow: "Практический результат",
      title: "Тест спроса",
      tone: "bg-future-green text-black",
      rows: [
        ["Оффер", "Первая коллекция локального бренда. Предзаказ без полной оплаты."],
        ["Что проверяем", "Интерес к продукту до производства партии"],
        ["Тест", "Лендинг + короткий оффер + форма предзаказа"],
        ["Критерий успеха", "10+ заявок за 3 дня"],
        ["Результат", "Готовый тест, который можно запустить сегодня"],
      ],
    },
    finance: {
      eyebrow: "Практический результат",
      title: "Экономика запуска",
      tone: "bg-future-purple text-white",
      rows: [
        ["Себестоимость", "1 850 ₽"],
        ["Цена запуска", "3 490 ₽"],
        ["Маржа до доп. расходов", "1 640 ₽"],
        ["Рекомендация", "Не снижать цену ниже 3 290 ₽ на первом тесте"],
      ],
    },
    marketing: {
      eyebrow: "Практический результат",
      title: "Первый маркетинговый тест",
      tone: "bg-future-blue text-white",
      rows: [
        ["Канал", "Короткие видео"],
        ["Аудитория", "18–25 лет"],
        ["Оффер", "Предзаказ первой ограниченной коллекции"],
        ["Цель", "10 заявок за 3 дня"],
        ["Следующее действие", "Снять и опубликовать 3 коротких видео"],
      ],
    },
  } as const;

  if (view === "product" || view === "finance" || view === "marketing") {
    const content = resultContent[view];
    return <section className={`mr-auto w-full max-w-[680px] rounded-[24px] p-5 shadow-sm sm:p-6 ${content.tone}`}><p className="text-[9px] font-bold uppercase tracking-[.1em] opacity-55">{content.eyebrow}</p><div className="mt-2 flex items-end justify-between gap-4"><h2 className="text-[25px] font-black tracking-[-.04em]">{content.title}</h2>{view === "finance" && <strong className="text-[32px] font-black leading-none text-future-green">3 490 ₽</strong>}</div><dl className="mt-5 grid gap-px overflow-hidden rounded-[16px] bg-white/20 sm:grid-cols-2">{content.rows.map(([label, value], index) => <div key={label} className={`bg-white/10 px-4 py-3 ${content.rows.length % 2 === 1 && index === content.rows.length - 1 ? "sm:col-span-2" : ""}`}><dt className="text-[8px] font-black uppercase tracking-[.09em] opacity-55">{label}</dt><dd className="mt-1 text-[12px] font-bold leading-5">{value}</dd></div>)}</dl></section>;
  }

  if (view === "progress") return <section className="mr-auto w-full max-w-[620px] rounded-[24px] bg-black p-5 text-white sm:p-6"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-future-green">Общий контекст обновлён</p><h2 className="mt-2 text-[25px] font-black tracking-[-.04em]">Что уже сделано</h2><ul className="mt-5 grid gap-2 text-[13px] font-bold">{["Спрос проверен", "Цена рассчитана", "Первый канал протестирован"].map((item) => <li key={item} className="flex items-center gap-3 rounded-[13px] bg-white/8 px-4 py-3"><Check size={15} className="text-future-green" />{item}</li>)}</ul><div className="mt-4 flex items-center justify-between rounded-[16px] bg-future-green px-4 py-4 text-black"><strong className="text-[13px]">Появились первые предзаказы</strong><span className="text-[20px] font-black">3</span></div></section>;

  if (view === "next") return <section className="mr-auto w-full max-w-[660px] overflow-hidden rounded-[24px] bg-alfa-red text-white shadow-[0_12px_34px_rgba(239,49,36,.2)]"><div className="p-6 sm:p-7"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/60">Следующий шаг</p><h2 className="mt-2 text-[30px] font-black leading-tight tracking-[-.045em]">Настроить приём оплаты</h2><p className="mt-4 max-w-[560px] text-[13px] font-medium leading-6 text-white/78">У бизнеса появились первые предзаказы — теперь нужно дать клиентам способ оплатить заказ.</p></div></section>;

  if (view === "prompt") return <button type="button" onClick={onShowPayments} className="mr-auto inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white shadow-sm">Показать варианты <ArrowRight size={15} /></button>;

  return <section className="mr-auto w-full max-w-[700px] overflow-hidden rounded-[26px] bg-white shadow-[0_12px_38px_rgba(0,0,0,.09)] ring-1 ring-black/8"><div className="h-2 bg-alfa-red" /><div className="p-5 sm:p-6"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-alfa-red">Приём оплаты</p><h2 className="mt-2 text-[27px] font-black tracking-[-.045em]">Подходящие варианты</h2><div className="mt-5 grid gap-2 sm:grid-cols-3"><div className="rounded-[18px] bg-alfa-red p-4 text-white ring-4 ring-alfa-red/12"><p className="text-[9px] font-black uppercase tracking-[.08em] text-white/60">Рекомендуем</p><h3 className="mt-2 text-[15px] font-bold">Платёжная ссылка</h3><p className="mt-2 text-[10px] leading-4 text-white/72">Подходит для первых предзаказов</p></div><div className="rounded-[18px] bg-muted p-4"><p className="text-[9px] font-black uppercase tracking-[.08em] text-black/38">Вариант 2</p><h3 className="mt-2 text-[15px] font-bold">СБП</h3><p className="mt-2 text-[10px] leading-4 text-black/52">Оплата по QR / ссылке</p></div><div className="rounded-[18px] bg-muted p-4"><p className="text-[9px] font-black uppercase tracking-[.08em] text-black/38">Вариант 3</p><h3 className="mt-2 text-[15px] font-bold">Эквайринг</h3><p className="mt-2 text-[10px] leading-4 text-black/52">Когда появится стабильный поток продаж</p></div></div><button type="button" className="mt-5 min-h-12 w-full rounded-[14px] bg-black px-5 text-[12px] font-bold text-white" onClick={() => undefined}>Перейти в Альфа-Бизнес</button><p className="mt-2 text-center text-[9px] text-black/38">Подключение — только после подтверждения пользователя</p>{finished && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/8 pt-4"><strong className="mr-auto text-[11px]">Демо завершено</strong><button type="button" onClick={onRepeat} className="min-h-9 rounded-[11px] bg-alfa-red px-4 text-[10px] font-bold text-white">Повторить</button><button type="button" onClick={onClose} className="min-h-9 rounded-[11px] bg-muted px-4 text-[10px] font-bold">Закрыть</button></div>}</div></section>;
}

function TeamShowcase({ team, statuses, busy, onOpen, onOpenAll }: { team: ChatTeamMember[]; statuses: Record<string, AgentStatus>; busy: boolean; onOpen: (id: string) => void; onOpenAll: () => void }) {
  return (
    <section className="py-20 sm:py-24 laptop:py-28" aria-labelledby="team-showcase-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="future-caption text-alfa-red">Персональная AI-команда</p>
          <h2 id="team-showcase-title" className="future-section-title mt-3 max-w-[760px]">Специалисты уже знают ваш бизнес</h2>
          <p className="future-body-large mt-5 max-w-[720px] text-black/55">Откройте нужного агента, поставьте задачу и передайте готовый результат Альфа-Партнёру.</p>
        </div>
        <button type="button" disabled={busy} onClick={onOpenAll} className="future-button inline-flex shrink-0 items-center justify-center gap-3 self-start bg-black text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto">Открыть мою команду <Users size={17} /></button>
      </div>

      <div className="team-showcase-grid mt-10 grid gap-4 sm:grid-cols-2 xl:!grid-cols-3">
        {team.map((member, index) => {
          const status = statuses[member.id] ?? "idle";
          const tones: Record<string, string> = {
            marketer: "bg-future-blue text-white",
            finance: "bg-future-purple text-white",
            product: "bg-future-green text-black",
          };
          const tone = tones[member.id] || ["bg-alfa-red text-white", "bg-black text-white", "bg-future-purple text-white"][index % 3];
          const visual = TEAM_VISUALS[member.id];
          return (
            <article key={member.id} className={`relative flex min-h-[390px] flex-col overflow-hidden rounded-[24px] p-6 sm:p-7 ${tone}`}>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <RoleAvatar id={member.id} />
                <span className="rounded-full bg-white/18 px-3 py-2 text-[9px] font-bold backdrop-blur-sm">{STATUS_LABELS[status]}</span>
              </div>
              <h3 className="future-card-title relative z-10 mt-7 max-w-[280px]">{member.name}</h3>
              <p className="relative z-10 mt-3 max-w-[290px] text-[12px] font-normal leading-5 opacity-75">{member.reason}</p>
              <p className="relative z-10 mt-4 max-w-[260px] text-[11px] font-bold leading-5"><span className="mb-1 block text-[9px] uppercase tracking-[.08em] opacity-50">Первая задача</span>{member.firstTask}</p>
              {visual && <Image src={assetPath(visual)} alt="" width={220} height={220} className="pointer-events-none absolute -bottom-5 -right-5 h-[190px] w-[190px] object-contain opacity-95 sm:h-[210px] sm:w-[210px]" aria-hidden="true" />}
              <button type="button" disabled={busy} onClick={() => onOpen(member.id)} className="relative z-10 mt-auto inline-flex min-h-11 w-fit min-w-[145px] items-center justify-between gap-3 rounded-[12px] bg-white px-4 text-[12px] font-bold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">Открыть чат <ArrowRight size={15} /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BankRecommendationCard({ recommendation, onConnect, onDismiss }: { recommendation: BankRecommendation; onConnect: () => void; onDismiss: () => void }) {
  const product = getBankProduct(recommendation.productId);
  if (!product) return null;
  return (
    <article className="mr-auto w-full max-w-[620px] overflow-hidden rounded-[22px] bg-alfa-red text-white shadow-[0_10px_30px_rgba(239,49,36,.18)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-alfa-red"><WalletCards size={20} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.09em] text-white/68">Подходит для текущей задачи</p>
            <h3 className="mt-1 text-[18px] font-bold leading-tight">{product.name}</h3>
          </div>
        </div>
        <p className="mt-4 text-[12px] font-medium leading-5 text-white/78">{recommendation.reason}</p>
        <p className="mt-2 text-[11px] leading-5 text-white/65">{recommendation.message}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onConnect} className="min-h-11 rounded-[13px] bg-white px-5 text-[12px] font-bold text-black">{recommendation.cta || product.cta}</button>
          <button type="button" onClick={onDismiss} className="min-h-11 rounded-[13px] bg-black/16 px-5 text-[12px] font-bold text-white">Не сейчас</button>
        </div>
      </div>
    </article>
  );
}

function BusinessDataCard({ onExplain }: { onExplain: () => void }) {
  const metrics = [
    ["Оборот", `${DEMO_ALFA_BUSINESS_DATA.revenue.toLocaleString("ru-RU")} ₽`],
    ["Операции", String(DEMO_ALFA_BUSINESS_DATA.transactions)],
    ["Средний чек", `${DEMO_ALFA_BUSINESS_DATA.averageCheck.toLocaleString("ru-RU")} ₽`],
    ["Динамика", `+${DEMO_ALFA_BUSINESS_DATA.revenueTrend}%`],
  ];
  return (
    <div className="mt-5 rounded-[20px] bg-black p-4 text-white">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.09em] text-future-green">Данные бизнеса</p><p className="mt-1 text-[11px] font-medium text-white/48">Демо-данные Альфа-Бизнеса</p></div><Database size={19} className="text-future-green" /></div>
      <dl className="mt-4 grid grid-cols-2 gap-3">{metrics.map(([label, value]) => <div key={label}><dt className="text-[9px] text-white/45">{label}</dt><dd className="mt-1 text-[14px] font-bold">{value}</dd></div>)}</dl>
      <button type="button" onClick={onExplain} className="mt-4 min-h-11 text-left text-[10px] font-bold text-future-green underline decoration-future-green/40 underline-offset-4">Как AI использует эти данные</button>
    </div>
  );
}

function AlfaBusinessSection({ connected, onConnect, onExplain }: { connected: boolean; onConnect: () => void; onExplain: () => void }) {
  return (
    <section className="overflow-hidden bg-[#111] text-white" aria-labelledby="alfa-business-title">
      <Container className="ai-agent-container"><div className="mx-auto max-w-[1180px] py-20">
      <div className="grid gap-12 laptop:min-h-[390px] laptop:grid-cols-[.9fr_1.1fr] laptop:items-center">
        <div className="relative z-10">
          <p className="future-caption text-future-green">Третий источник контекста</p>
          <h2 id="alfa-business-title" className="mt-4 max-w-[560px] text-[clamp(2.4rem,3.7vw,3.25rem)] font-bold leading-[.98] tracking-[-.03em]">AI, который знает не только переписку</h2>
          <p className="future-body-large mt-6 max-w-[500px] text-white/62">Подключите Альфа-Бизнес, чтобы учитывать операции, оборот и динамику при выборе следующего действия.</p>
          {connected
            ? <button type="button" onClick={onExplain} className="future-button mt-8 bg-future-green text-black">✓ Альфа-Бизнес подключён</button>
            : <button type="button" onClick={onConnect} className="future-button mt-8 bg-alfa-red text-white">Подключить демо Альфа-Бизнеса</button>}
        </div>
        <div className="relative min-h-[560px] laptop:min-h-[390px]">
          <div className="relative z-10 max-w-[390px]">
            {["Видит динамику", "Учитывает реальные операции", "Не совершает действия без подтверждения"].map((item) => <div key={item} className="border-b border-white/22 py-5 text-[18px] font-bold leading-tight first:border-t">{item}</div>)}
          </div>
          <Image src={assetPath("/assets/ai/decor/context-signals.webp")} alt="" width={900} height={900} className="pointer-events-none absolute -bottom-16 left-1/2 h-[280px] w-[280px] -translate-x-1/2 object-contain opacity-95 sm:h-[330px] sm:w-[330px] laptop:-bottom-20 laptop:-right-20 laptop:left-auto laptop:h-[390px] laptop:w-[390px] laptop:translate-x-0" aria-hidden="true" />
        </div>
      </div>
      </div></Container>
    </section>
  );
}

export function AlphaPartnerPricing() {
  return (
    <section id="alpha-partner-plans" data-plan={SUBSCRIPTION_PLAN} className="relative scroll-mt-6 overflow-hidden bg-future-blue text-white" aria-labelledby="plans-title">
      <Container className="ai-agent-container"><div className="relative mx-auto max-w-[1180px] py-16 sm:py-20">
      <div className="relative z-10 max-w-[780px]">
        <p className="future-caption text-future-green">Альфа-Партнёр Pro</p>
        <h2 id="plans-title" className="mt-4 max-w-[720px] text-[clamp(2.25rem,3.5vw,3rem)] font-bold leading-[.98] tracking-[-.03em]">Больше возможностей для вашего бизнеса</h2>
        <p className="future-body-large mt-4 max-w-[650px] text-white/68">Расширенные возможности уже включены в демонстрации.</p>
      </div>
      <Image src={assetPath("/assets/ai/decor/pro-student.png")} alt="" width={1024} height={1450} className="pointer-events-none absolute right-20 top-16 hidden h-[330px] w-[260px] object-contain object-bottom opacity-95 laptop:block" aria-hidden="true" />
      <div className="relative z-10 mt-8 grid gap-4 laptop:grid-cols-2">
        <PlanCard title="Альфа-Партнёр" eyebrow="Бесплатно" features={["До 3 AI-специалистов", "Базовый паспорт бизнеса", "Отдельные рабочие чаты", "Базовые рекомендации", "Ограниченная история"]} action="Базовый доступ" />
        <PlanCard title="Альфа-Партнёр Pro" eyebrow="Расширенный доступ" active features={["До 6 AI-специалистов", "Длинная история бизнеса", "Совместная работа специалистов", "Анализ данных Альфа-Бизнеса", "Расширенные рекомендации"]} action="Ваш текущий тариф" />
      </div>
      </div></Container>
    </section>
  );
}

function PlanCard({ title, eyebrow, features, action, active = false }: { title: string; eyebrow: string; features: string[]; action: string; active?: boolean }) {
  return <article className={`flex min-h-[335px] flex-col rounded-[24px] p-6 sm:p-7 ${active ? "bg-future-green text-black" : "bg-white text-black"}`}><div className="flex items-start justify-between gap-3"><div><p className={`future-caption ${active ? "text-black/52" : "text-alfa-red"}`}>{eyebrow}</p><h3 className="mt-3 text-[26px] font-bold leading-tight tracking-[-.025em]">{title}</h3></div>{active && <span className="rounded-full bg-black px-3 py-2 text-[9px] font-bold text-white">Активировано</span>}</div><ul className="mt-6 grid gap-2.5 text-[12px] font-normal leading-5">{features.map((feature) => <li key={feature} className="flex gap-3"><Check size={15} className="mt-0.5 shrink-0 text-alfa-red" />{feature}</li>)}</ul><button type="button" disabled={active} className={`mt-auto min-h-11 rounded-[12px] px-5 text-[11px] font-bold ${active ? "cursor-default bg-black/10 text-black/52" : "bg-black text-white"}`}>{action}</button></article>;
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const content = {
    checking: { label: "Проверяем AI", dot: "bg-black/30", text: "text-black/45" },
    connected: { label: "AI подключён", dot: "bg-[#21a653]", text: "text-[#18783d]" },
    demo: { label: "Демо-режим", dot: "bg-black/35", text: "text-black/45" },
    error: { label: "Демо-режим", dot: "bg-black/35", text: "text-black/45" },
  }[status];
  const hint = status === "error" || status === "demo" ? "AI сейчас недоступен. Можно пройти подготовленный сценарий." : undefined;
  return <span title={hint} className={`inline-flex items-center gap-1.5 rounded-full bg-black/[.04] px-2.5 py-1.5 text-[9px] font-bold ${content.text}`}><span className={`h-2 w-2 rounded-full ${content.dot}`} aria-hidden="true" />{content.label}</span>;
}

function OnboardingCarousel({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const slide = ONBOARDING_SLIDES[index];

  function previous() {
    setIndex((current) => Math.max(0, current - 1));
  }

  function next() {
    setIndex((current) => Math.min(ONBOARDING_SLIDES.length - 1, current + 1));
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
    }
    dialog.addEventListener("keydown", onKeyDown);
    return () => dialog.removeEventListener("keydown", onKeyDown);
  }, [dialogRef]);

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-black/65 p-3 backdrop-blur-[5px] sm:p-5" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div
        ref={dialogRef}
        className="my-auto w-full max-w-[560px]"
        onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (Math.abs(delta) > 45) {
            if (delta > 0) previous();
            else next();
          }
          touchStartX.current = null;
        }}
      >
        <div className={`relative h-[min(780px,calc(100dvh-24px))] min-h-[640px] overflow-hidden rounded-[28px] shadow-[0_34px_100px_rgba(0,0,0,.34)] sm:h-[min(760px,calc(100dvh-40px))] sm:rounded-[36px] ${slide.color}`}>
          <div className="absolute left-7 right-7 top-7 z-30 grid grid-cols-4 gap-2 sm:left-10 sm:right-10" aria-hidden="true">
            {ONBOARDING_SLIDES.map((_, progressIndex) => <span key={progressIndex} className={`h-1 rounded-full transition-colors duration-300 ${progressIndex <= index ? index === 3 ? "bg-black/60" : "bg-white/80" : index === 3 ? "bg-black/14" : "bg-white/20"}`} />)}
          </div>

          <div className="absolute left-7 right-7 top-[58px] z-30 flex items-center justify-between gap-4 sm:left-10 sm:right-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">Как работает · {index + 1}/4</span>
            <button type="button" onClick={onClose} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[11px] font-bold transition-colors ${index === 3 ? "hover:bg-black/10" : "hover:bg-white/12"}`} aria-label="Пропустить приветствие">Пропустить <X size={18} /></button>
          </div>

          <div key={index} className="onboarding-slide absolute inset-x-0 top-[122px] z-20 px-7 sm:px-10">
            <span className={`text-[74px] font-black leading-none tracking-[-0.08em] sm:text-[86px] ${index === 3 ? "text-black/18" : "text-white/22"}`}>{slide.number}</span>
            <h2 id="onboarding-title" className="mt-1 max-w-[470px] text-[31px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[38px]">{slide.title}</h2>
            <p className={`mt-4 max-w-[450px] text-[14px] font-medium leading-[1.55] sm:text-[16px] ${index === 3 ? "text-black/68" : "text-white/82"}`}>{slide.text}</p>
            <p className={`mt-3 max-w-[440px] text-[11px] font-bold leading-5 sm:text-[12px] ${index === 3 ? "text-black" : "text-white"}`}>{slide.note}</p>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 h-[42%] sm:h-[44%]" aria-hidden="true">
            <Image src={assetPath(slide.image)} alt="" fill sizes="(max-width: 640px) 94vw, 560px" className={`object-contain object-bottom drop-shadow-[0_18px_22px_rgba(0,0,0,.16)] ${index === 1 || index === 3 ? "scale-[1.06]" : "scale-[1.14]"}`} />
          </div>

          <div className="absolute bottom-7 left-7 right-7 z-30 flex items-end justify-between gap-3 sm:bottom-9 sm:left-10 sm:right-10">
            <button type="button" onClick={previous} disabled={index === 0} aria-label="Предыдущая карточка" className={`inline-flex min-h-12 items-center gap-2 rounded-[13px] px-4 text-[11px] font-bold disabled:opacity-35 ${index === 3 ? "bg-white/60 text-black" : "bg-white/25 text-white backdrop-blur-sm"}`}><ArrowLeft size={18} />Назад</button>
            <div className="sr-only" aria-live="polite">Карточка {index + 1} из {ONBOARDING_SLIDES.length}</div>
            {index < ONBOARDING_SLIDES.length - 1
              ? <button type="button" onClick={next} aria-label="Следующая карточка" className="inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-black px-5 text-[11px] font-bold text-white">Дальше <ArrowRight size={18} /></button>
              : <button type="button" onClick={onStart} className="inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-black px-5 text-[11px] font-bold text-white">Начать работу <ArrowRight size={17} /></button>}
          </div>

        </div>
      </div>
    </div>
  );
}

function ContextCard({ passport, onBuild }: { passport: BusinessPassport; onBuild: () => void }) {
  const rows = [
    ["Проект", passport.direction || passport.product || "Пока не определено"],
    ["Продукт", passport.product || "Пока не определено"],
    ["Аудитория", passport.audience || "Пока не определено"],
    ["Стадия", passport.stage || "Пока не определено"],
    ["Цель", passport.goal || "Пока не определено"],
    ["Бюджет", passport.budget || passport.resources || "Пока не определено"],
    ["Ограничение", passport.problems || "Уточняется по контексту"],
  ];
  return <div className="rounded-[24px] bg-future-blue p-5 text-white sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-future-green text-black"><Check size={20} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Этап завершён</p><h2 className="mt-1 text-[21px] font-bold">Паспорт бизнеса</h2></div></div><dl className="mt-5 grid gap-px overflow-hidden rounded-[16px] bg-white/15 sm:grid-cols-2">{rows.map(([label, value], index) => <div key={label} className={`bg-white/8 px-4 py-3 ${index === rows.length - 1 ? "sm:col-span-2" : ""}`}><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/50">{label}</dt><dd className="mt-1 text-[12px] font-bold">{value}</dd></div>)}</dl><button type="button" onClick={onBuild} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white sm:w-auto">Собрать AI-команду <Users size={17} /></button></div>;
}

function TeamProposal({ team, editing, passport, onEdit, onCancelEdit, onRemove, onAdd, onConfirm, onOpen }: { team: ChatTeamMember[]; editing: boolean; passport: BusinessPassport; onEdit: () => void; onCancelEdit: () => void; onRemove: (id: string) => void; onAdd: (id: string) => void; onConfirm: () => void; onOpen: (id: string) => void }) {
  const available = AGENT_REGISTRY.filter((agent) => !team.some((member) => member.id === agent.id));
  return <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_46px_rgba(0,0,0,.08)] ring-1 ring-black/8"><div className="h-2 bg-future-purple" /><div className="p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-future-purple">Команда Альфа-Партнёра</p><h2 className="mt-1 text-[27px] font-black tracking-[-0.045em]">Ваша AI-команда готова</h2><p className="mt-2 max-w-[680px] text-[12px] font-medium leading-5 text-black/52">Специалисты подобраны под проект, текущую стадию и задачи. Состав можно изменить до подтверждения.</p></div><span className="self-start rounded-full bg-future-green px-3 py-2 text-[10px] font-bold">{team.length} {team.length === 5 ? "специалистов" : "специалиста"}</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{team.map((member) => <article key={member.id} className="flex min-h-[210px] flex-col rounded-[22px] bg-white p-4 ring-1 ring-black/10"><div className="flex items-start gap-3"><RoleAvatar id={member.id} /><div className="min-w-0"><h3 className="text-[15px] font-bold">{member.name}</h3><p className="mt-1 text-[10px] font-medium leading-4 text-black/42">{member.description}</p></div>{editing && <button type="button" onClick={() => onRemove(member.id)} className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-muted text-alfa-red" aria-label={`Удалить ${member.name}`}><Trash2 size={16} /></button>}</div><p className="mt-4 text-[11px] font-medium leading-5 text-black/56"><strong className="text-black">Зачем в команде:</strong> {member.reason}</p><p className="mt-2 border-t border-black/8 pt-3 text-[11px] font-medium leading-5 text-black/56"><strong className="text-black">Первая задача:</strong> {member.firstTask}</p>{!editing && <button type="button" onClick={() => onOpen(member.id)} className="mt-auto inline-flex min-h-11 items-center justify-between gap-2 rounded-[13px] bg-black px-4 text-[12px] font-bold text-white">Открыть чат <ArrowRight size={14} /></button>}</article>)}</div>{editing && <div className="mt-4 rounded-[20px] border border-dashed border-black/20 p-4"><p className="text-[11px] font-bold">Добавить специалиста</p><div className="mt-3 flex flex-wrap gap-2">{available.map((agent) => <button key={agent.id} type="button" disabled={team.length >= 5} onClick={() => onAdd(agent.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-muted px-4 text-[12px] font-bold disabled:opacity-35"><Plus size={14} />{agent.name}</button>)}</div><p className="mt-3 text-[10px] text-black/40">В команде должно остаться от 3 до 5 агентов. Контекст: {passport.product || passport.direction || "проект уточняется"}.</p></div>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onConfirm} disabled={team.length < 3 || team.length > 5} className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-[15px] bg-alfa-red px-5 text-[12px] font-bold text-white disabled:opacity-35">Подтвердить команду <Check size={16} /></button>{editing ? <button type="button" onClick={onCancelEdit} className="min-h-13 rounded-[15px] bg-muted px-5 text-[12px] font-bold">Готово</button> : <button type="button" onClick={onEdit} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[15px] bg-muted px-5 text-[12px] font-bold"><Pencil size={15} />Изменить состав</button>}</div></div></div>;
}

function TeamPanel({ state, onClose, onOpen, onOpenPlans }: { state: PartnerState; onClose: () => void; onOpen: (id: string) => void; onOpenPlans: () => void }) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="team-panel-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside ref={dialogRef} className="ml-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-[#f3f3f4] shadow-[-28px_0_80px_rgba(0,0,0,.22)]"><div className="bg-alfa-red p-5 text-white sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">Команда вашего бизнеса</p><h2 id="team-panel-title" className="mt-2 text-[34px] font-black leading-none tracking-[-0.055em]">Моя команда · {state.team.length}</h2><p className="mt-3 max-w-[360px] text-[11px] font-medium leading-5 text-white/70">Один главный партнёр и специалисты с отдельными задачами и историями.</p></div><button type="button" onClick={onClose} className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white text-black" aria-label="Закрыть команду"><X size={19} /></button></div></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6"><button type="button" onClick={() => onOpen("alpha-partner")} className={`flex w-full items-center gap-3 rounded-[22px] p-4 text-left shadow-sm ${state.activeAgentId === "alpha-partner" ? "bg-black text-white" : "bg-white text-black ring-1 ring-black/8"}`}><RoleAvatar id="alpha-partner" size="lg" /><span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">Альфа-Партнёр</span><span className={`mt-1 block text-[10px] font-medium leading-4 ${state.activeAgentId === "alpha-partner" ? "text-white/58" : "text-black/45"}`}>Главный координатор · объединяет результаты команды</span></span><ChevronRight size={19} /></button>{state.team.map((member) => { const status = state.agentStatuses[member.id] ?? "idle"; return <article key={member.id} className={`rounded-[22px] p-4 shadow-sm ${state.activeAgentId === member.id ? "bg-future-blue text-white" : "bg-white text-black ring-1 ring-black/8"}`}><div className="flex items-start gap-3"><RoleAvatar id={member.id} /><div className="min-w-0 flex-1"><p className="text-[15px] font-bold">{member.name}</p><p className={`mt-1 flex items-center gap-2 text-[10px] font-bold ${state.activeAgentId === member.id ? "text-white/72" : "text-black/45"}`}><StatusDot status={status} />{STATUS_LABELS[status]}</p></div></div><p className={`mt-4 line-clamp-2 border-t pt-3 text-[10px] font-medium leading-4 ${state.activeAgentId === member.id ? "border-white/18 text-white/68" : "border-black/8 text-black/48"}`}>{state.agentTasks[member.id] ? `Последняя задача: ${state.agentTasks[member.id]}` : `Первая задача: ${member.firstTask}`}</p><button type="button" onClick={() => onOpen(member.id)} className={`mt-4 flex min-h-11 w-full items-center justify-between rounded-[13px] px-4 text-[10px] font-bold ${state.activeAgentId === member.id ? "bg-white text-black" : "bg-black text-white"}`}>Открыть чат <ArrowRight size={15} /></button></article>; })}<div className="rounded-[20px] bg-black p-4 text-white"><p className="text-[10px] font-bold text-future-green">Альфа-Партнёр Pro</p><p className="mt-1 text-[11px] text-white/62">{state.team.length} из 6 специалистов добавлено</p><button type="button" onClick={onOpenPlans} className="mt-3 min-h-11 w-full rounded-[12px] bg-white/12 px-4 text-[10px] font-bold">Возможности тарифа</button></div></div><p className="bg-white px-5 py-4 text-[9px] font-medium leading-4 text-black/42 sm:px-7">Все агенты используют общий паспорт бизнеса, но истории их чатов хранятся отдельно.</p></aside></div>;
}

function TeamKitDownloadDock({ onDownload }: { onDownload: () => void }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTarget(document.querySelector<HTMLElement>('[aria-labelledby="team-panel-title"] aside'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-[46px] right-0 z-[120] w-full max-w-[520px] px-4 pb-[env(safe-area-inset-bottom)] sm:px-6">
      <div className="pointer-events-auto rounded-[20px] bg-future-blue p-4 text-white shadow-[0_16px_42px_rgba(0,0,0,.28)]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-future-green text-black"><Download size={18} /></span>
          <div>
            <p className="text-[14px] font-bold">Забрать команду на устройство</p>
            <p className="mt-1 text-[10px] font-medium leading-4 text-white/65">Презентационный ZIP с паспортом бизнеса, ролями и задачами агентов.</p>
          </div>
        </div>
        <button type="button" onClick={onDownload} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-white px-4 text-[11px] font-bold text-black">
          Скачать ZIP-комплект <Download size={15} />
        </button>
        <p className="mt-3 text-[9px] font-medium leading-4 text-white/50">Агенты внутри архива пока не запускаются и не получают доступ к устройству.</p>
      </div>
    </div>,
    target,
  );
}

function ConfirmModal({ title, text, confirmLabel, onConfirm, onClose }: { title: string; text: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="w-full max-w-[460px] rounded-[26px] bg-white p-6"><div className="flex items-start justify-between gap-4"><h2 id="confirm-title" className="text-[24px] font-bold tracking-[-0.03em]">{title}</h2><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть"><X size={18} /></button></div><p className="mt-4 text-[13px] leading-5 text-black/55">{text}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onConfirm} className="min-h-12 flex-1 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white">{confirmLabel}</button><button type="button" onClick={onClose} className="min-h-12 rounded-[14px] bg-muted px-5 text-[12px] font-bold">Отмена</button></div></div></div>;
}

function ProductConnectModal({
  recommendation,
  detailsOpen,
  onShowDetails,
  onClose,
}: {
  recommendation: BankRecommendation;
  detailsOpen: boolean;
  onShowDetails: () => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const product = getBankProduct(recommendation.productId);
  if (!product) return null;
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-connect-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="max-h-[90dvh] w-full max-w-[620px] overflow-y-auto rounded-[30px] bg-white p-6 text-black sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.09em] text-alfa-red">
              Продуктовая демонстрация
            </p>
            <h2
              id="product-connect-title"
              className="mt-2 text-[30px] font-black leading-none tracking-[-.045em]"
            >
              В полной версии подключим здесь
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-5 text-[13px] leading-6 text-black/58">
          Сейчас перед вами прототип Альфа-Партнёра. В полноценной версии после
          подтверждения пользователь сможет перейти в защищённый Альфа-Бизнес и
          подключить выбранный продукт.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {[
            "Рекомендация AI",
            "Подтверждение",
            "Альфа-Бизнес",
            "Подключение продукта",
          ].map((step, index) => (
            <div
              key={step}
              className={`rounded-[16px] p-3 text-[10px] font-bold leading-4 ${index === 3 ? "bg-future-green" : "bg-muted"}`}
            >
              {index + 1}. {step}
            </div>
          ))}
        </div>
        {detailsOpen && (
          <div className="mt-5 rounded-[20px] bg-future-blue p-5 text-white">
            <p className="text-[9px] font-bold uppercase tracking-[.09em] text-future-green">
              Демонстрационная карточка
            </p>
            <h3 className="mt-2 text-[20px] font-bold">{product.name}</h3>
            <p className="mt-3 text-[12px] leading-5 text-white/72">
              {product.solves}
            </p>
            <p className="mt-3 text-[11px] leading-5 text-white/58">
              Причина сейчас: {recommendation.reason}
            </p>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-[14px] bg-black px-5 text-[12px] font-bold text-white"
          >
            Понятно
          </button>
          <button
            type="button"
            onClick={onShowDetails}
            className="min-h-12 rounded-[14px] bg-muted px-5 text-[12px] font-bold"
          >
            Посмотреть, как это будет работать
          </button>
        </div>
      </div>
    </div>
  );
}

function AlfaBusinessModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const data = [
    "Поступления",
    "Расходы",
    "Количество операций",
    "Динамику оборота",
    "Средний чек",
    "Регулярность платежей",
    "Подключённые продукты Альфы",
  ];
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alfa-business-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="max-h-[90dvh] w-full max-w-[640px] overflow-y-auto rounded-[30px] bg-white p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.09em] text-alfa-red">
              Только с разрешения
            </p>
            <h2
              id="alfa-business-modal-title"
              className="mt-2 text-[30px] font-black leading-none tracking-[-.045em]"
            >
              Подключить данные Альфа-Бизнеса
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-5 text-[13px] leading-6 text-black/58">
          С вашего разрешения Альфа-Партнёр сможет учитывать данные бизнеса и
          использовать их для рекомендаций.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item}
              className="flex min-h-12 items-center gap-3 rounded-[15px] bg-muted px-4 text-[11px] font-bold"
            >
              <Check size={15} className="text-alfa-red" />
              {item}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[20px] bg-future-green p-4 text-[11px] font-bold leading-5">
          <p>AI не совершает операции самостоятельно.</p>
          <p className="mt-1">
            Любое финансовое действие требует подтверждения пользователя.
          </p>
        </div>
        <p className="mt-4 text-[10px] text-black/42">
          В прототипе подключается только демонстрационный набор показателей —
          без доступа к банковскому счёту.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 flex-1 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white"
          >
            Разрешить демо-доступ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-[14px] bg-muted px-5 text-[12px] font-bold"
          >
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  );
}

function BusinessDataInfoModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="business-data-info-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="w-full max-w-[520px] rounded-[28px] bg-white p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.09em] text-alfa-red">Демо-данные Альфа-Бизнеса</p><h2 id="business-data-info-title" className="mt-2 text-[28px] font-black tracking-[-.04em]">Как AI использует данные</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть"><X size={18} /></button></div><p className="mt-5 text-[13px] leading-6 text-black/58">Данные помогают Альфа-Партнёру точнее определять текущую задачу бизнеса: замечать динамику, связывать её с результатами команды и выбирать одного подходящего специалиста.</p><div className="mt-5 flex gap-3 rounded-[18px] bg-future-green p-4"><Info size={19} className="shrink-0" /><p className="text-[11px] font-bold leading-5">Финансовые действия AI не выполняет. Любое подключение или операция требует отдельного подтверждения пользователя.</p></div><button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-[14px] bg-black text-[12px] font-bold text-white">Понятно</button></div></div>;
}
