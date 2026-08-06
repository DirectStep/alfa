"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Pencil,
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
import { sanitizePartnerState, serializePartnerState } from "@/lib/partnerStorage.mjs";
import {
  checkChatHealth,
  sendChatMessage,
  type ChatHistoryMessage,
  type ChatTeamMember,
  type ChatTeamSummary,
} from "@/lib/chatApi";

type Message = { id: string; role: "agent" | "user"; text: string; source?: "ai" | "demo" };
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
};

const STORAGE_KEY = "alfa-delo-alpha-partner-v1";
const LEGACY_STORAGE_KEY = "alfa-delo-ai-agent-v2";
const ONBOARDING_STORAGE_KEY = "alfaPartnerOnboardingSeen";
const MAX_INPUT_LENGTH = 800;
const FALLBACK_NOTICE = "Сейчас работаем в демо-режиме. Ваши ответы и прогресс сохраняются.";
const PAYMENT_CONFIRMATION = "Правильно понял, у вас уже есть реальный заказ или предзаказ и нужно принять оплату?";
const LEGACY_START_MESSAGE = "Расскажите, с чем вы пришли. У вас уже есть работающий бизнес или пока только идея?";
const START_MESSAGE = "Привет! Я ваш Альфа-Партнёр. Помогу развивать действующий бизнес или запустить новый: разберусь в ситуации, соберу AI-команду и предложу следующий шаг. Если появится конкретная финансовая задача, подскажу подходящий продукт Альфа-Банка. С чем вы пришли — у вас уже есть бизнес или пока идея?";
const START_REPLIES = ["У меня уже есть бизнес", "У меня есть бизнес-идея", "Хочу запустить новый продукт"];
const PROCESS_STEPS = ["Расскажите о бизнесе", "Получите AI-команду", "Делегируйте задачи", "Соберите результат"];
const HERO_ROLES = ["marketer", "finance", "copywriter"];

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

function makeMessage(role: Message["role"], text: string, source: Message["source"] = "ai"): Message {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text, source };
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
  if (normalized[0]?.role !== "agent" || normalized[0].text !== LEGACY_START_MESSAGE) return normalized;
  return [{ ...normalized[0], text: START_MESSAGE }, ...normalized.slice(1)];
}

function withoutTrailingDemo(messages: Message[], replaceDemo: boolean) {
  if (!replaceDemo || messages.at(-1)?.source !== "demo") return messages;
  return messages.slice(0, -1);
}

function hasFallbackContext(passport: BusinessPassport, answerCount: number) {
  const core = [passport.projectType, passport.direction || passport.product, passport.audience, passport.stage, passport.goal];
  return answerCount >= 5 || (core.filter(Boolean).length >= 4 && Boolean(passport.problems || passport.delegationTasks || passport.prepared));
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
  if (!next.projectType) {
    if (/иде[яю]|хочу запустить|новый продукт/.test(normalized)) next.projectType = "Бизнес-идея";
    else if (/у меня (уже )?есть бизнес|работающ/.test(normalized)) next.projectType = "Существующий бизнес";
  }
  if (!next.product) {
    if (/худи/.test(normalized)) next.product = "Худи";
    else if (/украшен/.test(normalized)) next.product = "Украшения";
    else if (/футболк/.test(normalized)) next.product = "Футболки";
    else {
      const product = text.match(/(?:продаю|запустить|продукт|услуга)\s+([^,.!?]{2,80})/i)?.[1];
      if (product) next.product = product.trim();
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
      if (audience && !/теста|запуска|проверки|производства/i.test(audience)) next.audience = audience.trim();
    }
  }
  if (!next.prepared) {
    if (/эскиз/.test(normalized)) next.prepared = "Есть эскизы";
    else if (/образец|прототип/.test(normalized)) next.prepared = "Есть образец";
    else if (/только идея/.test(normalized)) next.prepared = "Пока только идея";
  }
  if (!next.resources && next.prepared) next.resources = next.prepared;
  if (!next.stage) {
    if (/заказ|предзаказ/.test(normalized)) next.stage = "Есть первые заказы";
    else if (/работающ|уже прода|есть клиенты/.test(normalized)) next.stage = "Работающий бизнес";
    else if (/иде[яю]|запустить/.test(normalized)) next.stage = "Идея";
  }
  if (!next.goal) {
    if (/проверить спрос/.test(normalized)) next.goal = "Проверить спрос";
    else if (/первые заявки|первых заявок/.test(normalized)) next.goal = "Получить первые заявки";
    else if (/запустить/.test(normalized)) next.goal = "Запустить продукт";
  }
  if (!next.budget) {
    if (/бюджет[^.!?]{0,30}(не определ|не знаю|пока нет)/.test(normalized)) next.budget = "Пока не определён";
    else {
      const budget = text.match(/\d[\d\s]*(?:₽|руб(?:лей|ля|ль)?)/i)?.[0];
      if (budget) next.budget = budget.trim();
    }
  }
  if (!next.problems) {
    const problem = text.match(/(?:проблема|не понимаю|мешает|сложно)\s*[:—-]?\s*([^.!?]{3,160})/i)?.[1];
    if (problem) next.problems = problem.trim();
  }
  if (!next.delegationTasks && /делегир|поручить|помоги|нужна помощь/i.test(normalized)) next.delegationTasks = text;
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
      <span className={`${dimensions} relative shrink-0 overflow-hidden rounded-[16px] bg-future-blue`}>
        <Image src={assetPath("/assets/ai/alfa-agent.png")} alt="Аватар Альфа-Партнёра" fill sizes="64px" className="object-cover object-top" />
      </span>
    );
  }
  const agent = getAgentDefinition(id);
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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [systemNotice, setSystemNotice] = useState("");
  const [lastFailedRequest, setLastFailedRequest] = useState<FailedRequest | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const howItWorksRef = useRef<HTMLButtonElement>(null);
  const requestSequence = useRef(0);

  const activeIsPartner = state.activeAgentId === "alpha-partner";
  const activeDefinition = activeIsPartner ? null : getAgentDefinition(state.activeAgentId);
  const activeMember = state.team.find((member) => member.id === state.activeAgentId);
  const activeMessages = activeIsPartner ? state.partnerHistory : state.agentThreads[state.activeAgentId] ?? [];

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
    try {
      window.localStorage.setItem(STORAGE_KEY, serializePartnerState(state));
    } catch {
      // Прототип продолжает работать, даже если браузер запретил локальное хранилище.
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void checkChatHealth().then((health) => {
      if (cancelled) return;
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
  }, [activeMessages.length, state.phase, loading, state.paymentState]);

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

  function openAgent(agentId: string) {
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
        partnerHistory: [...current.partnerHistory, makeMessage("agent", "Команда подтверждена. Откройте «Моя команда», выберите специалиста и делегируйте первую задачу. Я соберу результаты и помогу определить общий следующий шаг.")],
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
          partnerHistory: [...current.partnerHistory, makeMessage("agent", "Заказ подтверждён. Теперь доступен следующий шаг — приём первой оплаты.", "demo")],
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
            makeMessage("agent", "Контекст и результаты команды сохранены. Выберите специалиста в «Моей команде» или уточните, какую задачу хотите решить следующей.", "demo"),
          ],
        };
      }
      const answerCount = countUserMessages(current.partnerHistory);
      if (hasFallbackContext(passport, answerCount)) {
        const team = apiTeam.length >= 3 ? apiTeam : buildFallbackTeam(passport);
        return {
          ...current,
          passport,
          team,
          phase: "context_ready",
          partnerHistory: [...current.partnerHistory, makeMessage("agent", "Контекст бизнеса собран. Я подготовил команду специалистов под вашу цель и текущие задачи.", "demo")],
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
    };
    const currentAgentId = request.agentId;
    const userMessage = makeMessage("user", value);
    const sequence = ++requestSequence.current;
    setInput("");
    setInputError("");
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
              makeMessage("agent", "Передаю финансовую потребность Альфа-Партнёру для подтверждения."),
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
            partnerHistory: [...partnerHistory, makeMessage("agent", response.reply)],
            suggestedAgentId,
            paymentState: response.nextAction === "payment_confirmed" ? "unlocked" : current.paymentState === "confirming" && isNegativePaymentAnswer(value) ? "idle" : current.paymentState,
          };
        }
        const status: AgentStatus = response.status === "result_ready" ? "ready" : "waiting";
        const currentThread = withoutTrailingDemo(current.agentThreads[currentAgentId] ?? [], Boolean(retryRequest));
        return {
          ...current,
          passport,
          agentThreads: { ...current.agentThreads, [currentAgentId]: [...currentThread, makeMessage("agent", response.reply)] },
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
    setConnectionStatus("checking");
    const health = await checkChatHealth();
    if (health.status !== "ok" || !health.configured || !health.oauthAvailable || !health.modelAvailable) {
      setConnectionStatus("error");
      setSystemNotice("Подключение пока не восстановлено. Можно продолжить в демо-режиме.");
      return;
    }
    if (!lastFailedRequest) {
      setConnectionStatus("connected");
      setSystemNotice("");
      setToast("AI снова подключён");
      return;
    }
    await submitAnswer(lastFailedRequest.value, lastFailedRequest);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
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
        partnerHistory: [...current.partnerHistory, makeMessage("agent", `Получил результат от специалиста «${agent.name}». Учту его, когда будем выбирать следующий шаг.`)],
      };
    });
    setToast("Результат передан Альфа-Партнёру");
  }

  function openOnboarding() {
    setOnboardingOpen(true);
  }

  function focusChat() {
    document.getElementById("alpha-partner-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function closeOnboarding(focusChat = false) {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Приветствие всё равно можно закрыть, даже если localStorage недоступен.
    }
    setOnboardingOpen(false);
    if (focusChat) window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function restart() {
    requestSequence.current += 1;
    setLoading(false);
    setState(createInitialState());
    setResetOpen(false);
    setTeamPanelOpen(false);
    setInput("");
    setInputError("");
  }

  if (!hydrated) {
    return <section className="min-h-[560px] bg-surface" aria-label="Загрузка Альфа-Партнёра" />;
  }

  return (
    <section className="ai-agent-shell overflow-hidden bg-surface pb-16 text-black sm:pb-20 laptop:pb-24">
      <div className="bg-alfa-red text-white">
        <Container className="ai-agent-container">
          <div className="mx-auto max-w-[1180px]">
          <div className="grid min-h-[430px] items-center gap-7 py-9 sm:py-11 laptop:grid-cols-[minmax(0,1.05fr)_minmax(390px,.75fr)] laptop:gap-12 laptop:py-12">
            <div className="relative z-10 max-w-[760px]">
              <h1 className="max-w-[720px] text-[42px] font-black leading-[0.9] tracking-[-0.065em] sm:text-[62px] laptop:text-[72px]">Соберите AI-команду под свой бизнес</h1>
              <p className="mt-6 max-w-[680px] text-[16px] font-medium leading-6 text-white/76 sm:text-[19px] sm:leading-8">Расскажите о бизнесе или идее. Альфа-Партнёр изучит задачу, подберёт специалистов и поможет распределить работу.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={focusChat} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[16px] bg-future-green px-7 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Собрать команду <ArrowRight size={18} /></button>
                <button ref={howItWorksRef} type="button" onClick={openOnboarding} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[16px] bg-white px-7 text-[14px] font-bold text-black ring-1 ring-black/12 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Как это работает <ArrowRight size={18} /></button>
              </div>
              <p className="mt-6 flex items-center gap-2 text-[11px] font-bold text-white/68 sm:text-[12px]"><span className="h-2.5 w-2.5 rounded-full bg-future-green ring-4 ring-future-green/20" />Один партнёр · до пяти профильных AI-специалистов</p>
            </div>

            <div className="relative mx-auto hidden h-[390px] w-full max-w-[480px] laptop:block" aria-hidden="true">
              <div className="absolute inset-0 overflow-hidden rounded-[42px] bg-future-blue">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-future-purple" />
                <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-future-green" />
                <Image src={assetPath("/assets/ai/alfa-agent.png")} alt="" fill priority sizes="480px" className="z-10 object-contain object-bottom drop-shadow-[0_22px_22px_rgba(0,0,0,0.22)]" />
              </div>
              <div className="absolute -left-8 top-8 z-20 rounded-[18px] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,.14)]">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/35">Главный координатор</p>
                <p className="mt-1 text-[14px] font-bold">Альфа-Партнёр</p>
              </div>
              <div className="absolute -bottom-5 right-5 z-20 flex gap-2">
                {HERO_ROLES.map((agentId) => {
                  const agent = getAgentDefinition(agentId);
                  return <span key={agentId} className="flex items-center gap-2 rounded-full bg-black px-3 py-2 text-[10px] font-bold text-white shadow-lg"><StatusDot status="ready" />{agent?.name}</span>;
                })}
              </div>
            </div>
          </div>
          </div>
        </Container>
      </div>

      <Container className="ai-agent-container">
        <div className="mx-auto max-w-[1180px] pt-6 sm:pt-8">
          <div id="alpha-partner-chat" className="ai-agent-chat scroll-mt-5 flex h-[clamp(590px,74dvh,760px)] min-h-[560px] max-h-[760px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_70px_rgba(0,0,0,.1)] ring-1 ring-black/8 sm:min-h-[600px] sm:rounded-[36px]">
            <div className="h-2 shrink-0 bg-alfa-red" aria-hidden="true" />
            <header className="flex min-h-[82px] items-center justify-between gap-3 border-b border-black/8 px-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <RoleAvatar id={state.activeAgentId} />
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-x-2">
                    <p className="whitespace-nowrap text-[12px] font-bold sm:text-[16px]">{activeIsPartner ? <>AI-агент <span className="text-alfa-red">Альфа-Партнёр</span></> : activeMember?.name || activeDefinition?.name}</p>
                    <ConnectionBadge status={connectionStatus} />
                  </div>
                  <p className="truncate text-[10px] text-black/45 sm:text-[12px]">{activeIsPartner ? "Изучает бизнес, собирает команду и координирует задачи" : activeDefinition?.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!activeIsPartner && <button type="button" onClick={() => openAgent("alpha-partner")} className="hidden min-h-11 items-center gap-2 rounded-full bg-muted px-4 text-[11px] font-bold hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue sm:inline-flex"><ArrowLeft size={14} />К Альфа-Партнёру</button>}
                {!activeIsPartner && <button type="button" onClick={() => openAgent("alpha-partner")} className="grid h-11 w-11 place-items-center rounded-full bg-muted text-black sm:hidden" aria-label="Вернуться к Альфа-Партнёру"><ArrowLeft size={17} /></button>}
                {state.teamConfirmed && <button type="button" onClick={() => setTeamPanelOpen(true)} aria-label={`Моя команда · ${state.team.length}`} className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-black px-3.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue"><Users size={15} /><span className="hidden sm:inline">Моя команда · </span>{state.team.length}</button>}
                <button type="button" onClick={() => setResetOpen(true)} title="Начать заново" className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-muted px-3 text-[11px] font-bold text-black/55 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue" aria-label="Начать заново"><RotateCcw size={17} /><span className="hidden laptop:inline">Начать заново</span></button>
              </div>
            </header>

            <div ref={chatRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f1f2f4] px-4 py-5 sm:px-7 sm:py-7" aria-live="polite">
              <div className="mx-auto flex w-full max-w-[920px] flex-col gap-3">
                {activeMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] whitespace-pre-line rounded-[22px] px-4 py-3.5 text-[13px] font-medium leading-5 sm:max-w-[76%] sm:px-5 sm:py-4 sm:text-[14px] sm:leading-6 ${message.role === "user" ? "rounded-br-[7px] bg-black text-white" : "rounded-bl-[7px] bg-white text-black shadow-[0_5px_18px_rgba(0,0,0,.045)] ring-1 ring-black/6"}`}>{message.text}</div>
                  </div>
                ))}

                {systemNotice && <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-black/[0.045] px-4 py-3 text-[11px] text-black/60" role="status"><span>{systemNotice}</span><button type="button" onClick={() => void retryConnection()} disabled={loading || connectionStatus === "checking"} className="min-h-9 rounded-full bg-white px-4 font-bold text-black ring-1 ring-black/10 disabled:opacity-45">Повторить подключение</button></div>}

                {loading && <div className="flex justify-start"><div className="rounded-[20px] rounded-bl-[6px] bg-white px-5 py-3 text-[13px] text-black/55 ring-1 ring-black/6">{activeIsPartner ? "Альфа-Партнёр анализирует ответ…" : `${activeMember?.name || "Агент"} готовит результат…`}</div></div>}

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
                    <button type="button" onClick={transferResult} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-[11px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">Передать результат Альфа-Партнёру <ArrowRight size={14} /></button>
                  </div>
                )}

                {activeIsPartner && state.paymentState === "unlocked" && (
                  <div className="rounded-[22px] bg-alfa-red p-5 text-white sm:p-6">
                    <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-alfa-red"><WalletCards size={21} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">Финансовая задача подтверждена</p><h3 className="mt-1 text-[20px] font-bold">Платёжная ссылка Альфа-Бизнес</h3><p className="mt-2 max-w-[620px] text-[12px] leading-5 text-white/75">Инструмент появился только после подтверждения реального заказа и необходимости принять оплату.</p><button type="button" onClick={() => setPaymentOpen(true)} className="mt-4 min-h-11 rounded-full bg-white px-5 text-[11px] font-bold text-black">Посмотреть следующий экран</button></div></div>
                  </div>
                )}

                {!loading && activeIsPartner && countUserMessages(state.partnerHistory) === 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {START_REPLIES.map((reply, index) => <button key={reply} type="button" onClick={() => void submitAnswer(reply)} className={`min-h-12 rounded-[14px] px-4 text-left text-[11px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue ${index === 0 ? "bg-alfa-red text-white" : "bg-white text-black ring-1 ring-black/10"}`}>{reply}</button>)}
                  </div>
                )}

                {!loading && !activeIsPartner && activeDefinition && activeMessages.filter((message) => message.role === "user").length === 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeDefinition.quickTasks.map((task) => <button key={task} type="button" onClick={() => void submitAnswer(task)} className="min-h-11 rounded-full bg-white px-4 text-[11px] font-bold ring-1 ring-black/10 hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue">{task}</button>)}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={onSubmit} className="border-t border-black/8 bg-white p-3 sm:p-5">
              <div className="mx-auto flex max-w-[920px] items-end gap-2 rounded-[20px] bg-muted p-2.5 ring-1 ring-black/12 transition-shadow focus-within:bg-white focus-within:ring-2 focus-within:ring-future-blue">
                <textarea ref={inputRef} value={input} disabled={loading} onChange={(event) => { setInput(event.target.value); if (inputError) setInputError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitAnswer(input); } }} rows={1} maxLength={MAX_INPUT_LENGTH + 1} placeholder={activeIsPartner ? "Расскажите о бизнесе или задаче…" : `Поставьте задачу: ${activeDefinition?.name.toLowerCase()}…`} className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-[13px] font-medium leading-5 outline-none placeholder:text-black/48 disabled:opacity-60" aria-describedby={inputError ? "alpha-input-error" : undefined} />
                <button type="submit" disabled={loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-alfa-red text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red" aria-label="Отправить сообщение"><Send size={17} /></button>
              </div>
              <div className="mx-auto mt-1.5 flex max-w-[920px] justify-between px-2 text-[9px]"><p id="alpha-input-error" className="font-bold text-alfa-red">{inputError}</p><span className="ml-auto text-black/30">{input.length}/{MAX_INPUT_LENGTH}</span></div>
            </form>
          </div>

          <div className="mt-6 grid gap-4 laptop:grid-cols-[1.08fr_.92fr]">
            <div className="overflow-hidden rounded-[28px] bg-black p-5 text-white sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">Маршрут работы</p>
                  <h2 className="mt-1 text-[22px] font-bold tracking-[-0.035em]">От контекста к результату</h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold text-white/70">Шаг {currentProcessStep + 1} из 4</span>
              </div>
              <ol className="mt-6 grid gap-2 sm:grid-cols-4">
                {PROCESS_STEPS.map((label, index) => {
                  const completed = index < currentProcessStep;
                  const active = index === currentProcessStep;
                  return (
                    <li key={label} className={`min-h-[108px] rounded-[18px] p-3.5 transition-colors ${active ? "bg-alfa-red text-white" : completed ? "bg-future-green text-black" : "bg-white/8 text-white/42"}`}>
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-white text-alfa-red" : completed ? "bg-black text-white" : "bg-white/10 text-white/55"}`}>{completed ? <Check size={14} /> : index + 1}</span>
                      <p className="mt-4 text-[11px] font-bold leading-4">{label}</p>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="relative overflow-hidden rounded-[28px] bg-white p-5 ring-1 ring-black/8 sm:p-6">
              <div className="absolute right-0 top-0 h-24 w-3 bg-alfa-red" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-alfa-red">Паспорт бизнеса</p>
              <h2 className="mt-1 text-[22px] font-bold tracking-[-0.035em]">Контекст всегда с командой</h2>
              <p className="mt-2 max-w-[470px] text-[12px] leading-5 text-black/55">Агенты видят эти данные, поэтому не заставляют вас повторять вводную в каждом чате.</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                {passportFields.map(([label, value]) => (
                  <div key={label} className="min-w-0 border-t border-black/10 pt-3"><dt className="text-[10px] font-bold uppercase tracking-[0.09em] text-black/45">{label}</dt><dd className="mt-1.5 truncate text-[13px] font-bold">{value || "Уточняется"}</dd></div>
                ))}
              </dl>
            </div>
          </div>

          {state.teamConfirmed && <TeamShowcase team={state.team} statuses={state.agentStatuses} onOpen={openAgent} onOpenAll={() => setTeamPanelOpen(true)} />}
        </div>
      </Container>

      {teamPanelOpen && <TeamPanel state={state} onClose={() => setTeamPanelOpen(false)} onOpen={openAgent} />}
      {onboardingOpen && <OnboardingCarousel onClose={() => closeOnboarding(false)} onStart={() => closeOnboarding(true)} />}
      {resetOpen && <ConfirmModal title="Начать заново?" text="Текущая команда, отдельные диалоги и переданные результаты будут удалены из браузера." confirmLabel="Начать заново" onConfirm={restart} onClose={() => setResetOpen(false)} />}
      {paymentOpen && <PaymentModal onClose={() => setPaymentOpen(false)} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 py-3 text-[12px] font-bold text-white shadow-lg" role="status"><Check size={15} className="text-future-green" />{toast}</div>}
    </section>
  );
}

function TeamShowcase({ team, statuses, onOpen, onOpenAll }: { team: ChatTeamMember[]; statuses: Record<string, AgentStatus>; onOpen: (id: string) => void; onOpenAll: () => void }) {
  return (
    <section className="mt-16 sm:mt-20" aria-labelledby="team-showcase-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-alfa-red">Персональная AI-команда</p>
          <h2 id="team-showcase-title" className="mt-2 max-w-[760px] text-[34px] font-black leading-[0.94] tracking-[-0.055em] sm:text-[48px]">Специалисты уже знают ваш бизнес</h2>
          <p className="mt-4 max-w-[720px] text-[14px] font-medium leading-6 text-black/55 sm:text-[16px]">Откройте нужного агента, поставьте задачу и передайте готовый результат Альфа-Партнёру.</p>
        </div>
        <button type="button" onClick={onOpenAll} className="inline-flex min-h-13 shrink-0 items-center justify-center gap-3 self-start rounded-[15px] bg-black px-6 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 sm:self-auto">Открыть мою команду <Users size={17} /></button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {team.map((member, index) => {
          const status = statuses[member.id] ?? "idle";
          const tones = ["bg-future-blue text-white", "bg-future-purple text-white", "bg-future-green text-black", "bg-alfa-red text-white", "bg-black text-white"];
          return (
            <article key={member.id} className={`flex min-h-[290px] flex-col rounded-[28px] p-5 sm:p-6 ${tones[index % tones.length]}`}>
              <div className="flex items-start justify-between gap-3">
                <RoleAvatar id={member.id} size="lg" />
                <span className="rounded-full bg-white/18 px-3 py-2 text-[9px] font-bold backdrop-blur-sm">{STATUS_LABELS[status]}</span>
              </div>
              <h3 className="mt-8 text-[23px] font-bold leading-[1.02] tracking-[-0.035em]">{member.name}</h3>
              <p className="mt-3 text-[11px] font-medium leading-5 opacity-70">{member.reason}</p>
              <p className="mt-4 border-t border-current/20 pt-4 text-[10px] font-bold leading-4"><span className="block opacity-55">Первая задача</span>{member.firstTask}</p>
              <button type="button" onClick={() => onOpen(member.id)} className="mt-auto inline-flex min-h-11 items-center justify-between gap-3 rounded-[13px] bg-white px-4 text-[11px] font-bold text-black transition-transform hover:-translate-y-0.5">Открыть чат <ArrowRight size={15} /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const content = {
    checking: { label: "Проверяем AI", dot: "bg-black/30", text: "text-black/45" },
    connected: { label: "AI подключён", dot: "bg-[#21a653]", text: "text-[#18783d]" },
    demo: { label: "Демо-режим", dot: "bg-black/35", text: "text-black/45" },
    error: { label: "Ошибка подключения", dot: "bg-alfa-red", text: "text-alfa-red" },
  }[status];
  return <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold ${content.text}`}><span className={`h-2 w-2 rounded-full ${content.dot}`} aria-hidden="true" />{content.label}</span>;
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
    ["Проект", passport.product || passport.direction || "Пока не определено"],
    ["Стадия", passport.stage || "Пока не определено"],
    ["Цель", passport.goal || "Пока не определено"],
    ["Главная проблема", passport.problems || "Уточняется по контексту"],
    ["Делегировать", passport.delegationTasks || passport.goal || "Пока не определено"],
  ];
  return <div className="rounded-[24px] bg-future-blue p-5 text-white sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-future-green text-black"><Check size={20} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Этап завершён</p><h2 className="mt-1 text-[21px] font-bold">Контекст бизнеса собран</h2></div></div><dl className="mt-5 grid gap-px overflow-hidden rounded-[16px] bg-white/15 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="bg-white/8 px-4 py-3 last:sm:col-span-2"><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/50">{label}</dt><dd className="mt-1 text-[12px] font-bold">{value}</dd></div>)}</dl><button type="button" onClick={onBuild} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white sm:w-auto">Собрать AI-команду <Users size={17} /></button></div>;
}

function TeamProposal({ team, editing, passport, onEdit, onCancelEdit, onRemove, onAdd, onConfirm, onOpen }: { team: ChatTeamMember[]; editing: boolean; passport: BusinessPassport; onEdit: () => void; onCancelEdit: () => void; onRemove: (id: string) => void; onAdd: (id: string) => void; onConfirm: () => void; onOpen: (id: string) => void }) {
  const available = AGENT_REGISTRY.filter((agent) => !team.some((member) => member.id === agent.id));
  return <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_46px_rgba(0,0,0,.08)] ring-1 ring-black/8"><div className="h-2 bg-future-purple" /><div className="p-4 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-future-purple">Команда Альфа-Партнёра</p><h2 className="mt-1 text-[27px] font-black tracking-[-0.045em]">Ваша AI-команда готова</h2><p className="mt-2 max-w-[680px] text-[12px] font-medium leading-5 text-black/52">Специалисты подобраны под проект, текущую стадию и задачи. Состав можно изменить до подтверждения.</p></div><span className="self-start rounded-full bg-future-green px-3 py-2 text-[10px] font-bold">{team.length} {team.length === 5 ? "специалистов" : "специалиста"}</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{team.map((member) => <article key={member.id} className="flex min-h-[210px] flex-col rounded-[22px] bg-white p-4 ring-1 ring-black/10"><div className="flex items-start gap-3"><RoleAvatar id={member.id} /><div className="min-w-0"><h3 className="text-[15px] font-bold">{member.name}</h3><p className="mt-1 text-[10px] font-medium leading-4 text-black/42">{member.description}</p></div>{editing && <button type="button" onClick={() => onRemove(member.id)} className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-muted text-alfa-red" aria-label={`Удалить ${member.name}`}><Trash2 size={16} /></button>}</div><p className="mt-4 text-[11px] font-medium leading-5 text-black/56"><strong className="text-black">Зачем в команде:</strong> {member.reason}</p><p className="mt-2 border-t border-black/8 pt-3 text-[11px] font-medium leading-5 text-black/56"><strong className="text-black">Первая задача:</strong> {member.firstTask}</p>{!editing && <button type="button" onClick={() => onOpen(member.id)} className="mt-auto inline-flex min-h-11 items-center justify-between gap-2 rounded-[13px] bg-black px-4 text-[11px] font-bold text-white">Открыть чат <ArrowRight size={14} /></button>}</article>)}</div>{editing && <div className="mt-4 rounded-[20px] border border-dashed border-black/20 p-4"><p className="text-[11px] font-bold">Добавить специалиста</p><div className="mt-3 flex flex-wrap gap-2">{available.map((agent) => <button key={agent.id} type="button" disabled={team.length >= 5} onClick={() => onAdd(agent.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-muted px-4 text-[10px] font-bold disabled:opacity-35"><Plus size={14} />{agent.name}</button>)}</div><p className="mt-3 text-[10px] text-black/40">В команде должно остаться от 3 до 5 агентов. Контекст: {passport.product || passport.direction || "проект уточняется"}.</p></div>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onConfirm} disabled={team.length < 3 || team.length > 5} className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-[15px] bg-alfa-red px-5 text-[12px] font-bold text-white disabled:opacity-35">Подтвердить команду <Check size={16} /></button>{editing ? <button type="button" onClick={onCancelEdit} className="min-h-13 rounded-[15px] bg-muted px-5 text-[12px] font-bold">Готово</button> : <button type="button" onClick={onEdit} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[15px] bg-muted px-5 text-[12px] font-bold"><Pencil size={15} />Изменить состав</button>}</div></div></div>;
}

function TeamPanel({ state, onClose, onOpen }: { state: PartnerState; onClose: () => void; onOpen: (id: string) => void }) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="team-panel-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside ref={dialogRef} className="ml-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-[#f3f3f4] shadow-[-28px_0_80px_rgba(0,0,0,.22)]"><div className="bg-alfa-red p-5 text-white sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">Команда вашего бизнеса</p><h2 id="team-panel-title" className="mt-2 text-[34px] font-black leading-none tracking-[-0.055em]">Моя команда · {state.team.length}</h2><p className="mt-3 max-w-[360px] text-[11px] font-medium leading-5 text-white/70">Один главный партнёр и специалисты с отдельными задачами и историями.</p></div><button type="button" onClick={onClose} className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white text-black" aria-label="Закрыть команду"><X size={19} /></button></div></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6"><button type="button" onClick={() => onOpen("alpha-partner")} className={`flex w-full items-center gap-3 rounded-[22px] p-4 text-left shadow-sm ${state.activeAgentId === "alpha-partner" ? "bg-black text-white" : "bg-white text-black ring-1 ring-black/8"}`}><RoleAvatar id="alpha-partner" size="lg" /><span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">Альфа-Партнёр</span><span className={`mt-1 block text-[10px] font-medium leading-4 ${state.activeAgentId === "alpha-partner" ? "text-white/58" : "text-black/45"}`}>Главный координатор · объединяет результаты команды</span></span><ChevronRight size={19} /></button>{state.team.map((member) => { const status = state.agentStatuses[member.id] ?? "idle"; return <article key={member.id} className={`rounded-[22px] p-4 shadow-sm ${state.activeAgentId === member.id ? "bg-future-blue text-white" : "bg-white text-black ring-1 ring-black/8"}`}><div className="flex items-start gap-3"><RoleAvatar id={member.id} /><div className="min-w-0 flex-1"><p className="text-[15px] font-bold">{member.name}</p><p className={`mt-1 flex items-center gap-2 text-[10px] font-bold ${state.activeAgentId === member.id ? "text-white/72" : "text-black/45"}`}><StatusDot status={status} />{STATUS_LABELS[status]}</p></div></div><p className={`mt-4 line-clamp-2 border-t pt-3 text-[10px] font-medium leading-4 ${state.activeAgentId === member.id ? "border-white/18 text-white/68" : "border-black/8 text-black/48"}`}>{state.agentTasks[member.id] ? `Последняя задача: ${state.agentTasks[member.id]}` : `Первая задача: ${member.firstTask}`}</p><button type="button" onClick={() => onOpen(member.id)} className={`mt-4 flex min-h-11 w-full items-center justify-between rounded-[13px] px-4 text-[10px] font-bold ${state.activeAgentId === member.id ? "bg-white text-black" : "bg-black text-white"}`}>Открыть чат <ArrowRight size={15} /></button></article>; })}</div><p className="bg-white px-5 py-4 text-[9px] font-medium leading-4 text-black/42 sm:px-7">Все агенты используют общий паспорт бизнеса, но истории их чатов хранятся отдельно.</p></aside></div>;
}

function ConfirmModal({ title, text, confirmLabel, onConfirm, onClose }: { title: string; text: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="w-full max-w-[460px] rounded-[26px] bg-white p-6"><div className="flex items-start justify-between gap-4"><h2 id="confirm-title" className="text-[24px] font-bold tracking-[-0.03em]">{title}</h2><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть"><X size={18} /></button></div><p className="mt-4 text-[13px] leading-5 text-black/55">{text}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onConfirm} className="min-h-12 flex-1 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white">{confirmLabel}</button><button type="button" onClick={onClose} className="min-h-12 rounded-[14px] bg-muted px-5 text-[12px] font-bold">Отмена</button></div></div></div>;
}

function PaymentModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="max-h-[90dvh] w-full max-w-[520px] overflow-y-auto rounded-[28px] bg-white p-6 text-black sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-alfa-red">Финансовая задача подтверждена</p><h2 id="payment-title" className="mt-2 text-[28px] font-bold tracking-[-0.04em]">Переход в Альфа-Бизнес</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть"><X size={18} /></button></div><div className="mt-5 flex items-start gap-3 rounded-[20px] bg-future-green p-4"><CircleDollarSign size={22} className="shrink-0" /><p className="text-[12px] font-bold leading-5">Реальный заказ подтверждён → задача приёма оплаты появилась → платёжный инструмент разблокирован.</p></div><p className="mt-5 text-[13px] leading-6 text-black/55">В рабочей версии здесь откроется защищённый сценарий создания платёжной ссылки. Прототип не запрашивает банковские данные и не утверждает, что продукт уже подключён.</p><button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-[14px] bg-black text-[12px] font-bold text-white">Вернуться к Альфа-Партнёру</button></div></div>;
}
