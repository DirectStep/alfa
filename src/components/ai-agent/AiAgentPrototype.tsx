"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, RotateCcw, Send, Sparkles, WalletCards, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

type Step = "start" | "product" | "audience" | "prototype" | "budget" | "goal" | "analyzing" | "result" | "next" | "followup" | "payment";
type Message = { id: string; role: "agent" | "user"; text: string };
type Answers = { situation?: string; product?: string; audience?: string; prototype?: string; budget?: string; goal?: string };
type Snapshot = { step: Step; messages: Message[]; answers: Answers; saved: boolean; progress: number };
type AgentState = Snapshot & { version: 2; history: Snapshot[] };

const STORAGE_KEY = "alfa-delo-ai-agent-v2";
const MAX_INPUT_LENGTH = 400;
const initialState: AgentState = {
  version: 2,
  step: "start",
  answers: {},
  saved: false,
  progress: 12,
  history: [],
  messages: [],
};

const validSteps: Step[] = ["start", "product", "audience", "prototype", "budget", "goal", "analyzing", "result", "next", "followup", "payment"];

function isAgentState(value: unknown): value is AgentState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AgentState>;
  const history = candidate.history;
  const validSnapshot = (item: unknown): item is Snapshot => {
    if (!item || typeof item !== "object") return false;
    const entry = item as Partial<Snapshot>;
    return typeof entry.step === "string"
      && validSteps.includes(entry.step as Step)
      && Array.isArray(entry.messages)
      && entry.messages.every((message) => message && typeof message.id === "string" && (message.role === "agent" || message.role === "user") && typeof message.text === "string")
      && entry.answers !== null
      && typeof entry.answers === "object"
      && Object.values(entry.answers).every((answer) => answer === undefined || typeof answer === "string")
      && typeof entry.saved === "boolean"
      && typeof entry.progress === "number"
      && entry.progress >= 0
      && entry.progress <= 100;
  };
  return candidate.version === 2
    && validSnapshot(candidate)
    && Array.isArray(history)
    && history.every(validSnapshot);
}

const quickReplies: Partial<Record<Step, string[]>> = {
  start: ["У меня есть идея бренда одежды", "Хочу проверить, будут ли покупать", "Не понимаю, что делать перед первой закупкой"],
  product: ["Базовые футболки", "Худи и свитшоты", "Небольшая капсула"],
  audience: ["Студенты 18–24", "Молодые специалисты", "Пока не определился"],
  prototype: ["Есть эскизы", "Есть один образец", "Пока только идея"],
  budget: ["До 50 000 ₽", "50 000–150 000 ₽", "Бюджет ещё не определён"],
  goal: ["Проверить спрос", "Собрать первые заявки", "Понять, что запускать первым"],
};

const prompts = {
  product: "Что вы хотите запустить первым?",
  audience: "Кто должен стать первым покупателем?\nЭто поможет выбрать подходящий способ проверки спроса.",
  prototype: "Что уже подготовлено?\nЭскизы, образец или пока только идея.",
  budget: "Какой бюджет есть на проверку?\nПодберём тест без лишних затрат.",
  goal: "Какой результат вы хотите получить сейчас?\nПо нему агент выберет одну ближайшую задачу.",
};

function snapshot(state: AgentState): Snapshot {
  return { step: state.step, messages: state.messages, answers: state.answers, saved: state.saved, progress: state.progress };
}

function makeMessage(role: Message["role"], text: string): Message {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text };
}

function nextQuestion(step: Step): Step {
  return ({ start: "product", product: "audience", audience: "prototype", prototype: "budget", budget: "goal" } as Partial<Record<Step, Step>>)[step] ?? "analyzing";
}

function answerKey(step: Step): keyof Answers {
  return ({ start: "situation", product: "product", audience: "audience", prototype: "prototype", budget: "budget", goal: "goal" } as Record<string, keyof Answers>)[step];
}

function branchReply(step: Step, answer: string) {
  const normalized = answer.toLowerCase();
  if (step === "start") {
    if (/закуп|производ|парт/.test(normalized)) return "Сначала проверим спрос без закупки.";
    if (/покуп|спрос|клиент/.test(normalized)) return "Ищем подтверждённый спрос, а не просто мнения.";
    return "Начнём с проверки идеи.";
  }
  if (step === "product" && /худи|свитшот/.test(normalized)) return "Для худи особенно важно проверить дизайн и приемлемую цену до дорогого образца.";
  if (step === "product" && /футбол/.test(normalized)) return "Футболку можно проверить быстро: хватит визуализации и понятного предложения.";
  if (step === "audience" && /не определ|не знаю|все/.test(normalized)) return "Слишком широкая аудитория размоет ответы — для теста выберем один доступный сегмент.";
  if (step === "prototype" && /образец|прототип/.test(normalized)) return "Образец поможет получить более точную реакцию, но новую партию пока не заказываем.";
  if (step === "budget" && /не определ|не знаю/.test(normalized)) return "Тогда выберем тест почти без затрат: интервью и сбор контактов.";
  return "";
}

export function AiAgentPrototype() {
  const [state, setState] = useState<AgentState>(initialState);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [showStartInput, setShowStartInput] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(1);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isAgentState(parsed)) setState(parsed);
          else window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Диалог продолжает работать, даже если браузер запретил локальное хранилище.
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (state.step !== "analyzing") return;
    const skillsTimer = window.setTimeout(() => setAnalysisStage(2), 600);
    const actionTimer = window.setTimeout(() => setAnalysisStage(3), 1200);
    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        step: "result",
        progress: 66,
      }));
    }, 1800);
    return () => {
      window.clearTimeout(skillsTimer);
      window.clearTimeout(actionTimer);
      window.clearTimeout(timer);
    };
  }, [state.step]);

  useEffect(() => {
    const chat = chatScrollRef.current;
    if (!chat) return;
    const frame = window.requestAnimationFrame(() => {
      if (state.step === "start" && state.messages.length === 0) {
        chat.scrollTop = 0;
        return;
      }
      if (state.step === "result") {
        const agentCard = chat.querySelector<HTMLElement>("[data-agent-result]");
        chat.scrollTop = agentCard ? Math.max(0, agentCard.offsetTop - chat.offsetTop - 16) : chat.scrollHeight;
        return;
      }
      chat.scrollTop = chat.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.messages, state.step]);

  function submitAnswer(rawAnswer: string) {
    const answer = rawAnswer.trim();
    if (!answer) return setError("Напиши пару слов о ситуации или выбери готовый вариант.");
    if (answer.length > MAX_INPUT_LENGTH) return setError(`Сократи ответ до ${MAX_INPUT_LENGTH} символов — сейчас ${answer.length}.`);
    if (!["start", "product", "audience", "prototype", "budget", "goal"].includes(state.step)) return;

    const next = nextQuestion(state.step);
    const key = answerKey(state.step);
    const branch = branchReply(state.step, answer);
    const followUp = next === "analyzing" ? undefined : `${branch ? `${branch} ` : ""}${prompts[next as keyof typeof prompts]}`;
    if (next === "analyzing") setAnalysisStage(1);
    setState((current) => ({
      ...(current.step !== state.step ? current : {
        ...current,
        step: next,
        progress: ({ start: 14, product: 22, audience: 30, prototype: 38, budget: 46, goal: 54 } as Record<string, number>)[current.step] ?? current.progress,
        answers: { ...current.answers, [key]: answer },
        history: [...current.history, snapshot(current)],
        messages: [...current.messages, makeMessage("user", answer), ...(followUp ? [makeMessage("agent", followUp)] : [])],
      }),
    }));
    setInput("");
    setError("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitAnswer(input);
  }

  function goBack() {
    setState((current) => {
      const previous = current.history.at(-1);
      return previous ? { ...current, ...previous, history: current.history.slice(0, -1) } : current;
    });
    setError("");
  }

  function savePassport() {
    setState((current) => ({
      ...current,
      saved: true,
      progress: Math.max(current.progress, 64),
      messages: current.saved ? current.messages : [...current.messages, makeMessage("agent", "Результат сохранён. Паспорт бизнеса и маршрут обновлены.")],
    }));
    setPassportOpen(true);
  }

  function moveToNextStep() {
    setState((current) => ({
      ...current,
      step: "next",
      progress: 78,
      history: [...current.history, snapshot(current)],
      messages: [...current.messages, makeMessage("agent", "Как прошла проверка спроса?")],
    }));
  }

  function confirmPreorders() {
    setState((current) => ({
      ...current,
      step: "payment",
      progress: 92,
      history: [...current.history, snapshot(current)],
      messages: [...current.messages, makeMessage("user", "Есть первые предзаказы"), makeMessage("agent", "У вас появились первые предзаказы. Теперь агент подключает навык приёма первой оплаты.")],
    }));
  }

  function reportOutcome(answer: "Есть интерес, но без заявок" | "Спрос не подтвердился" | "Ещё не проводил проверку") {
    setState((current) => {
      const text = answer === "Есть интерес, но без заявок"
        ? "Интерес есть, но заявок пока нет. Уточните предложение и повторите тест."
        : answer === "Спрос не подтвердился"
          ? "Спрос не подтвердился. Следующий шаг — пересобрать предложение и проверить новый вариант."
          : "Сначала проведите 5 интервью и соберите минимум 10 ответов. Маршрут останется на текущем этапе.";
      return current.messages.at(-1)?.text === text ? current : { ...current, step: "followup", history: [...current.history, snapshot(current)], messages: [...current.messages, makeMessage("user", answer), makeMessage("agent", text)] };
    });
  }

  function resetConversation() {
    setState(initialState);
    setInput("");
    setError("");
    setPassportOpen(false);
    setResetOpen(false);
    setPaymentOpen(false);
    setConfigOpen(false);
    setShowStartInput(false);
    setAnalysisStage(1);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Состояние уже сброшено в памяти.
    }
  }

  function retryDemandTest() {
    setState((current) => ({
      ...current,
      step: "result",
      progress: 66,
      history: [...current.history, snapshot(current)],
      messages: [...current.messages, makeMessage("agent", "Я вернул план проверки спроса. Скорректируйте предложение и проведите тест ещё раз.")],
    }));
  }

  const canAnswer = ["start", "product", "audience", "prototype", "budget", "goal"].includes(state.step);
  const replies = quickReplies[state.step] ?? [];
  const questionNumber = ({ product: 1, audience: 2, prototype: 3, budget: 4, goal: 5 } as Partial<Record<Step, number>>)[state.step];
  const activeStage = ["result", "next", "followup", "payment"].includes(state.step) ? 4 : state.step === "analyzing" ? analysisStage : 0;
  const agentWorkStages = activeStage === 4
    ? ["Изучил бизнес", "Подключил навыки", "Выбрал первое действие", "Агент готов"]
    : ["Изучает бизнес", "Подключает навыки", "Выбирает первое действие", "Готовит агента"];
  const activeSkills = state.step === "payment"
    ? ["Проверка спроса", "Интервью с клиентами", "Тестовое предложение", "Приём первой оплаты"]
    : ["Проверка спроса", "Интервью с клиентами", "Тестовое предложение"];
  const businessStageIndex = state.step === "payment" ? 2 : ["result", "next", "followup"].includes(state.step) ? 1 : 0;
  const businessProgress = Math.round((businessStageIndex / 4) * 100);
  const businessMilestones = ["Идея", "Проверка спроса", "Первые заявки", "Первая оплата", "Рост"];
  const currentBusinessStage = state.step === "payment" ? "первые заявки" : ["result", "next", "followup"].includes(state.step) ? "проверка спроса" : "идея";

  return (
    <section className="ai-agent-shell min-h-[calc(100dvh-76px)] bg-[#f4f4f5] pb-[max(4rem,env(safe-area-inset-bottom))] text-black min-[1024px]:h-[calc(100dvh-76px)] min-[1024px]:min-h-0 min-[1024px]:overflow-clip min-[1024px]:pb-0 laptop:h-[calc(100dvh-84px)]">
      <Container className="ai-agent-container relative overflow-clip pb-8 pt-5 min-[1024px]:h-full min-[1024px]:pb-3 min-[1024px]:pt-3 laptop:pb-4 laptop:pt-4">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-alfa-red">Альфа Дело · AI-агент</p>
          <h1 className="mt-1 max-w-[930px] text-[30px] font-bold leading-none tracking-[-0.045em] sm:text-[36px] laptop:text-[38px]">AI-агент, который ведёт бизнес дальше</h1>
          <p className="mt-1.5 max-w-[970px] text-[12px] leading-4 text-black/60 sm:text-[13px]">Собирает контекст, подключает нужные навыки и выбирает следующее действие.</p>
          <p className="mt-1 text-[11px] font-bold text-black/75">5 коротких вопросов — и агент готов к первой задаче.</p>
        </div>

        <div className="relative z-10 mt-2 rounded-[18px] bg-white px-4 py-2 text-black shadow-[0_1px_0_rgba(0,0,0,0.05)] sm:px-5">
          <div className="flex items-center justify-between gap-4"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-alfa-red">Путь бизнеса</p><p className="text-[10px] font-bold text-black/55">Сейчас: {currentBusinessStage}</p></div>
          <div className="relative mt-2 h-3" role="progressbar" aria-label="Прогресс бизнеса" aria-valuemin={0} aria-valuemax={100} aria-valuenow={businessProgress}>
            <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-black/[0.08]"><span className="block h-full origin-left bg-alfa-red transition-transform duration-500" style={{ transform: `scaleX(${businessProgress / 100})` }} /></div>
            <div className="absolute inset-0 flex items-center justify-between" aria-hidden="true">{businessMilestones.map((label, index) => <span key={label} className={`h-2.5 w-2.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${index <= businessStageIndex ? "bg-alfa-red" : "bg-[#d8d8da]"}`} />)}</div>
          </div>
          <div className="mt-1 grid grid-cols-5 text-[10px] font-bold leading-[1.1] text-black/40 sm:text-[11px]">{businessMilestones.map((label, index) => <span key={label} className={`${index === 0 ? "text-left" : index === 4 ? "text-right" : "text-center"} ${index === businessStageIndex ? "text-black/75" : ""}`}>{label}</span>)}</div>
        </div>

        <div className="relative z-10 mt-2 grid items-start gap-2.5 min-[1024px]:grid-cols-[minmax(0,1fr)_250px]">
          <div className={`ai-agent-chat flex flex-col overflow-hidden rounded-[24px] bg-white text-black shadow-[0_12px_32px_rgba(17,17,17,0.06)] ${state.step === "start" ? "h-auto min-[1024px]:h-[max(420px,calc(100dvh-260px))] min-[1024px]:max-h-[680px]" : "h-[580px] min-[1024px]:h-[max(420px,calc(100dvh-260px))] min-[1024px]:max-h-[680px]"}`}>
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 sm:px-6">
              <div className="flex items-center gap-3"><span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-future-blue ring-1 ring-black/5" aria-hidden="true"><Image src={assetPath("/assets/ai/alfa-agent.png")} alt="" width={1026} height={1402} className="absolute -top-2 left-1/2 h-[88px] w-16 max-w-none -translate-x-1/2 object-contain object-top" /></span><div><p className="text-[14px] font-bold">AI-агент «Альфа Дело»</p><p className="text-[11px] text-black/45">Собирает агента под ваш бизнес</p></div></div>
              <button type="button" onClick={() => setResetOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[12px] font-bold text-black/55 hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue" aria-label="Начать диалог заново"><RotateCcw size={16} /><span className="hidden sm:inline">Заново</span></button>
            </div>

            <div ref={chatScrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain bg-[#fbfbfa] px-4 py-5 [&>*]:shrink-0 sm:px-6" aria-live="polite">
              {state.messages.map((message, index) => { const isCurrentQuestion = Boolean(questionNumber) && index === state.messages.length - 1 && message.role === "agent"; return <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-[18px] px-4 py-3 text-[15px] leading-6 sm:max-w-[78%] sm:text-[16px] ${message.role === "user" ? "rounded-br-md bg-black text-white" : "rounded-bl-md bg-[#efefed] text-black"}`}>{isCurrentQuestion && <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.08em] text-future-purple">Настройка агента · вопрос {questionNumber} из 5</p>}<p className="whitespace-pre-line">{message.text}</p></div></div>; })}

              {state.step === "start" && <article className="relative grid min-h-full overflow-hidden rounded-[22px] bg-future-blue p-5 text-white sm:p-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:gap-6"><div className="relative z-10"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">Настройка агента</p><h2 className="mt-2 max-w-[620px] text-[28px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[34px]">С чего начинаем?</h2><p className="mt-3 max-w-[570px] text-[13px] leading-5 text-white/75">Выберите близкую ситуацию. Все варианты покажут, как агент изучает проект и выбирает первое действие.</p><div className="mt-5 grid max-w-[650px] gap-2 sm:grid-cols-2">{quickReplies.start?.map((reply, index) => <button key={reply} type="button" onClick={() => submitAnswer(reply)} className={`min-h-12 rounded-[14px] px-4 text-left text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${index === 0 ? "bg-alfa-red text-white sm:col-span-2" : "bg-white/12 text-white ring-1 ring-white/25"}`}>{reply}</button>)}</div><button type="button" onClick={() => { setShowStartInput(true); window.requestAnimationFrame(() => inputRef.current?.focus()); }} className="mt-3 min-h-11 text-[12px] font-bold text-white underline decoration-white/35 underline-offset-4 hover:decoration-white">Описать свой проект</button><p className="mt-3 text-[10px] font-bold text-white/55">Демонстрация занимает около 2 минут.</p></div><div className="pointer-events-none relative hidden h-full min-h-[300px] md:block" aria-hidden="true"><div className="absolute inset-0 rounded-[28px] bg-white/[0.08]" /><Image src={assetPath("/assets/ai/alfa-agent.png")} alt="" width={1026} height={1402} priority className="absolute -bottom-10 left-1/2 h-[410px] w-[300px] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_24px_28px_rgba(45,0,70,0.24)]" /></div></article>}

              {state.step === "analyzing" && <div className="max-w-[520px] rounded-[20px] bg-future-blue p-4 text-white"><div className="flex items-center gap-3 text-[15px] font-bold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-future-green" />Настраиваю агента под ваш бизнес…</div><ul className="mt-3 grid gap-1.5 text-[12px] text-white/75"><li>Изучаю проект</li><li>Подключаю подходящие навыки</li><li>Выбираю первое действие</li></ul></div>}

              {state.step === "result" && <ConfiguredAgentCard answers={state.answers} skills={activeSkills} saved={state.saved} onDownload={() => setConfigOpen(true)} onContinue={moveToNextStep} onSave={savePassport} />}

              {state.step !== "start" && replies.length > 0 && <div className="mt-auto pt-2"><p className="mb-3 text-[11px] font-bold text-black/45">Выберите вариант или напишите свой ответ</p><div className="flex flex-wrap gap-2">{replies.map((reply) => <button key={reply} type="button" onClick={() => submitAnswer(reply)} className="min-h-11 rounded-full border border-black/15 bg-white px-4 py-2 text-left text-[12px] font-bold transition-colors hover:border-future-blue hover:text-future-blue">{reply}</button>)}</div></div>}

              {state.step === "next" && <div className="rounded-[20px] bg-white p-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={confirmPreorders} className="min-h-11 rounded-full bg-black px-4 text-[12px] font-bold text-white">Есть первые предзаказы</button><button type="button" onClick={() => reportOutcome("Есть интерес, но без заявок")} className="min-h-11 rounded-full border border-black/20 px-4 text-[12px] font-bold">Есть интерес, но без заявок</button><button type="button" onClick={() => reportOutcome("Спрос не подтвердился")} className="min-h-11 rounded-full border border-black/20 px-4 text-[12px] font-bold">Спрос не подтвердился</button><button type="button" onClick={() => reportOutcome("Ещё не проводил проверку")} className="min-h-11 rounded-full border border-black/20 px-4 text-[12px] font-bold">Ещё не проводил проверку</button></div></div>}

              {state.step === "followup" && <div className="rounded-[20px] border border-black/10 bg-white p-4"><p className="text-[12px] font-bold">Маршрут можно продолжить после повторной проверки.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={retryDemandTest} className="min-h-11 rounded-full bg-black px-4 text-[12px] font-bold text-white">Вернуться к плану проверки</button><button type="button" onClick={() => setPassportOpen(true)} className="min-h-11 rounded-full border border-black/20 px-4 text-[12px] font-bold">Открыть паспорт бизнеса</button></div></div>}

              {state.step === "payment" && <div className="overflow-hidden rounded-[20px] border border-alfa-red/20 bg-white p-4 text-black sm:p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-alfa-red text-white"><WalletCards size={21} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-alfa-red">Финансовая задача · приём первой оплаты</p><div className="mt-2 inline-flex rounded-full bg-future-purple/10 px-3 py-1.5 text-[11px] font-bold text-future-purple">+ Приём первой оплаты</div><h3 className="mt-2 text-[20px] font-bold">Платёжная ссылка Альфа-Бизнес</h3><p className="mt-1.5 text-[11px] leading-4 text-black/55">Проверка спроса → первые предзаказы → необходимо принять оплату.</p><button type="button" onClick={() => setPaymentOpen(true)} className="mt-3 min-h-11 rounded-full bg-alfa-red px-5 text-[12px] font-bold text-white">Создать платёжную ссылку</button><p className="mt-2 text-[9px] leading-3 text-black/35">Операция откроется в защищённом контуре Альфа-Бизнес после подтверждения.</p></div></div></div>}
            </div>

            {canAnswer && (state.step !== "start" || showStartInput) && <form onSubmit={handleSubmit} className="border-t border-black/10 bg-white p-3"><div className={`flex items-end gap-2 rounded-[16px] border bg-white p-1.5 ${error ? "border-alfa-red" : "border-black/15 focus-within:border-black"}`}><textarea ref={inputRef} value={input} onChange={(event) => { setInput(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitAnswer(input); } }} rows={1} placeholder={state.step === "start" ? "Опишите ситуацию с запуском бренда одежды…" : "Напишите ответ…"} aria-label="Ответ AI-агенту" aria-invalid={Boolean(error)} className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-[14px] outline-none placeholder:text-black/35" /><button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-alfa-red text-white transition-transform hover:-translate-y-0.5" aria-label="Отправить ответ"><Send size={18} /></button></div><div className="mt-1.5 flex items-start justify-between gap-3 px-1"><p className="text-[11px] font-medium text-alfa-red" role="alert">{error}</p><p className={`ml-auto shrink-0 text-[10px] ${input.length > MAX_INPUT_LENGTH ? "text-alfa-red" : "text-black/35"}`}>{input.length}/{MAX_INPUT_LENGTH}</p></div></form>}
          </div>

          <aside className="rounded-[20px] bg-white p-4 text-black shadow-[0_8px_24px_rgba(17,17,17,0.04)] min-[1024px]:sticky min-[1024px]:top-2">
            <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-alfa-red">Статус агента</p><p className="mt-1 text-[12px] font-bold text-black/65">{activeStage === agentWorkStages.length ? "Настройка завершена" : agentWorkStages[activeStage]}</p></div>{state.history.length > 0 && !["analyzing", "payment"].includes(state.step) && <button type="button" onClick={goBack} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-bold text-black/50 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue"><ArrowLeft size={13} />Назад</button>}</div>
            <ol className="relative mt-3 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-black/10">{agentWorkStages.map((label, index) => { const complete = index < activeStage; const current = activeStage === agentWorkStages.length ? index === agentWorkStages.length - 1 : index === activeStage; return <li key={label} className={`relative flex min-h-11 items-center gap-3 rounded-[11px] px-2 py-2 ${current ? "bg-future-blue/[0.07]" : ""}`}><span className={`relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4 ring-white text-[10px] font-bold ${complete ? "bg-future-green text-black" : current ? "bg-future-blue text-white" : "bg-[#eeeeef] text-black/30"}`}>{complete ? <Check size={12} /> : index + 1}</span><span className={`text-[12px] font-bold ${current ? "text-future-blue" : complete ? "text-black/65" : "text-black/35"}`}>{label}</span></li>; })}</ol>
          </aside>
        </div>

      </Container>

      {passportOpen && <PassportModal state={state} onClose={() => setPassportOpen(false)} />}
      {resetOpen && <ResetModal onReset={resetConversation} onClose={() => setResetOpen(false)} />}
      {paymentOpen && <PaymentModal onClose={() => setPaymentOpen(false)} />}
      {configOpen && <AgentConfigModal onContinue={() => { setConfigOpen(false); moveToNextStep(); }} onClose={() => setConfigOpen(false)} />}
    </section>
  );
}

function ConfiguredAgentCard({ answers, skills, saved, onDownload, onSave, onContinue }: { answers: Answers; skills: string[]; saved: boolean; onDownload: () => void; onSave: () => void; onContinue: () => void }) {
  const [planOpen, setPlanOpen] = useState(false);
  const goal = answers.goal === "Собрать первые заявки"
    ? "Получить первые подтверждённые заявки"
    : answers.goal === "Понять, что запускать первым"
      ? "Выбрать первый продукт для запуска"
      : "Получить подтверждение спроса";

  const displaySkills = skills.map((skill) => {
    if (skill === "Интервью с клиентами") return "Интервью с ЦА";
    if (skill === "Тестовое предложение") return "Тест оффера";
    return skill;
  });

  return <article data-agent-result className="rounded-[24px] border border-black/10 bg-white p-4 text-black sm:p-5">
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-alfa-red text-white"><Sparkles size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-alfa-red">Персонализация завершена</p><h3 className="mt-1 text-[25px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[28px]">Ваш персональный AI-агент готов</h3></div></div>
        <p className="mt-3 text-[12px] leading-[18px] text-black/60">Он собран по вашим ответам и уже понимает продукт, стадию и цель бизнеса.</p>
        <div className="mt-3 rounded-[16px] border border-future-blue/15 bg-future-blue/[0.06] p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-future-blue">Персональная настройка</p><p className="mt-1 text-[14px] font-bold leading-4">{displaySkills.length} навыка под ваш бизнес</p></div><span className="grid h-8 min-w-8 place-items-center rounded-full bg-future-blue px-2 text-[12px] font-bold text-white">{displaySkills.length}</span></div>
          <p className="mt-1.5 text-[11px] leading-4 text-black/50">Выбраны по вашим ответам, текущей стадии и цели.</p>
          <div className="mt-2 flex flex-wrap gap-1">{displaySkills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-future-blue/15 bg-white px-2.5 py-1.5 text-[10px] font-bold text-black/75"><Check size={11} strokeWidth={3} className="text-future-blue" />{skill}</span>)}</div>
        </div>
        <div className="mt-3 border-y border-black/10 py-2 text-[11px] leading-4"><p><span className="font-bold uppercase tracking-[0.06em] text-black/35">Контекст</span><span className="ml-2 font-bold">Бренд одежды{answers.product ? ` · ${answers.product}` : ""} · Проверка идеи</span></p><p className="mt-1 text-black/55"><span className="font-bold text-black/35">Цель:</span> {goal}</p></div>
        <button type="button" onClick={onSave} className="mt-auto min-h-11 self-start pt-2 text-left text-[11px] font-bold text-black/45 underline decoration-black/20 underline-offset-4 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-future-blue">{saved ? "Открыть паспорт бизнеса" : "Сохранить результат в паспорт бизнеса"}</button>
      </div>

      <div className="relative overflow-hidden rounded-[20px] bg-future-blue p-4 text-white sm:p-5">
        <Image src={assetPath("/assets/ai/alfa-agent.png")} alt="" width={1026} height={1402} className="pointer-events-none absolute -right-1 -top-4 h-40 w-[118px] object-contain opacity-100 drop-shadow-[0_18px_22px_rgba(48,0,72,0.28)]" aria-hidden="true" />
        <div className="relative z-10 pr-24 sm:pr-28"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-future-green" /><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-white/70">Первое действие агента</p></div><h4 className="mt-2 text-[21px] font-bold leading-[1.02] tracking-[-0.025em] sm:text-[23px]">Проверить спрос до производства</h4></div>
        <p className="relative z-10 mt-2 max-w-[390px] text-[12px] leading-[18px] text-white/75">Агент подготовил короткий план и вопросы для первых интервью.</p>
        <div id="first-agent-plan" hidden={!planOpen} className="relative z-10 mt-3 rounded-[14px] bg-white p-3 text-black"><dl className="grid gap-2 text-[11px] sm:grid-cols-3"><div><dt className="text-black/45">Срок</dt><dd className="mt-1 font-bold">3 дня</dd></div><div><dt className="text-black/45">Готово, когда</dt><dd className="mt-1 font-bold">10 ответов и 3 интереса</dd></div><div><dt className="text-black/45">Инструмент</dt><dd className="mt-1 font-bold">Вопросы для интервью</dd></div></dl><ol className="mt-2 space-y-1 border-t border-black/10 pt-2 text-[11px] leading-4 text-black/65"><li>1. Подготовить три варианта продукта.</li><li>2. Провести пять интервью.</li><li>3. Собрать заявки или контакты.</li><li>4. Зафиксировать цену и ответы.</li></ol></div>
        <div className="relative z-10 mt-4"><button type="button" onClick={onDownload} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-alfa-red px-4 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Download size={16} />Скачать конфигурацию агента</button><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setPlanOpen((current) => !current)} aria-expanded={planOpen} aria-controls="first-agent-plan" className="min-h-12 rounded-[14px] bg-white px-3 text-[12px] font-bold text-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{planOpen ? "Скрыть план" : "Посмотреть план"}</button><button type="button" onClick={onContinue} className="inline-flex min-h-12 items-center justify-center gap-1 rounded-[14px] bg-white/12 px-3 text-[12px] font-bold text-white ring-1 ring-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Продолжить <ArrowRight size={14} /></button></div></div>
      </div>
    </div>
  </article>;
}

function useDialogFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    if (!dialog) {
      document.body.style.overflow = previousBodyOverflow;
      return;
    }
    const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    focusable[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
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

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return dialogRef;
}

function AgentConfigModal({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  return <div className="fixed inset-0 z-[105] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="config-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="max-h-[90dvh] w-full max-w-[580px] overflow-y-auto rounded-[28px] bg-white p-6 text-black sm:p-8"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-alfa-red text-white"><Download size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-alfa-red">Конфигурация создана</p><h2 id="config-title" className="mt-1 text-[27px] font-bold leading-none tracking-[-0.03em]">Конфигурация агента готова</h2></div></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть окно конфигурации"><X size={19} /></button></div><p className="mt-5 text-[14px] leading-6 text-black/65">Это демонстрационный прототип, созданный для финального кейса чемпионата «Альфа-Будущее». В текущей версии агент работает внутри страницы и не устанавливается как отдельный продукт.</p><p className="mt-3 text-[13px] leading-5 text-black/55">В полноценной версии пользователь сможет сохранить конфигурацию агента, подключённые навыки и контекст бизнеса в своём аккаунте «Альфа Дело».</p><p className="mt-4 rounded-[14px] bg-future-green px-4 py-3 text-[11px] font-bold text-black/65">Скачивание будет доступно в полной версии продукта.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onContinue} className="min-h-12 flex-1 rounded-[14px] bg-alfa-red px-5 text-[12px] font-bold text-white">Продолжить работу с агентом</button><button type="button" onClick={onClose} className="min-h-12 rounded-[14px] border border-black/15 px-5 text-[12px] font-bold">Закрыть</button></div></div></div>;
}

function PassportModal({ state, onClose }: { state: AgentState; onClose: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  const currentStage = state.step === "payment" ? 2 : 1;
  const skills = state.step === "payment"
    ? "Проверка спроса · Интервью · Тестовое предложение · Приём первой оплаты"
    : "Проверка спроса · Интервью · Тестовое предложение";
  const fields = [["Идея", state.answers.product || "Небольшая капсула одежды"], ["Стадия", state.step === "payment" ? "Первые заказы" : "Есть идея"], ["Аудитория", state.answers.audience || "Студенты 18–24"], ["Цель", state.answers.goal || "Проверить спрос"], ["Активные навыки", skills], ["Выполненный шаг", state.step === "payment" ? "Проверка спроса" : "Паспорт бизнеса сформирован"], ["Текущая задача", state.step === "payment" ? "Принять первую оплату" : "Проверить спрос"], ["Следующий этап", state.step === "payment" ? "Регулярные продажи" : "Первые заказы"]];
  const passportStages = [["Идея", "Идея"], ["Проверка спроса", "Спрос"], ["Первые заказы", "Заявки"], ["Первая оплата", "Оплата"], ["Регулярные продажи", "Продажи"]];
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="passport-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="max-h-[90dvh] w-full max-w-[700px] overflow-y-auto rounded-[28px] bg-white p-6 text-black sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-alfa-red">Паспорт бизнеса</p><h2 id="passport-title" className="mt-2 text-[30px] font-bold tracking-[-0.03em]">Бренд одежды</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-muted" aria-label="Закрыть паспорт бизнеса"><X size={19} /></button></div><div className="mt-6 grid grid-cols-5 gap-1.5 sm:gap-2">{passportStages.map(([label, mobileLabel], index) => <div key={label} className={`rounded-[12px] px-1 py-2 text-center text-[9px] font-bold leading-3 sm:rounded-[14px] sm:p-3 sm:text-left ${index === currentStage ? "bg-future-green" : index < currentStage ? "bg-black text-white" : "bg-muted text-black/40"}`}><span className="sm:hidden">{mobileLabel}</span><span className="hidden sm:inline">{label}</span></div>)}</div><dl className="mt-4 grid gap-px overflow-hidden rounded-[20px] bg-black/10 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="bg-muted p-4"><dt className="text-[10px] font-bold uppercase tracking-[0.07em] text-black/40">{label}</dt><dd className="mt-2 text-[13px] font-bold leading-5">{value}</dd></div>)}</dl><button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-[14px] bg-black text-[13px] font-bold text-white">Продолжить маршрут</button></div></div>;
}

function PaymentModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  return <div className="fixed inset-0 z-[105] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="max-h-[90dvh] w-full max-w-[500px] overflow-y-auto rounded-[28px] bg-white p-6 text-black sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-alfa-red">Следующий экран продукта</p><h2 id="payment-title" className="mt-2 text-[28px] font-bold tracking-[-0.03em]">Переход в Альфа-Бизнес</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted" aria-label="Закрыть переход к платёжной ссылке"><X size={19} /></button></div><p className="mt-5 text-[14px] leading-6 text-black/60">В рабочей версии здесь откроется защищённый сценарий создания платёжной ссылки. Прототип не запрашивает банковские данные.</p><div className="mt-5 rounded-[18px] bg-future-green p-4"><p className="text-[12px] font-bold">Первые предзаказы подтверждены → платёжный инструмент разблокирован</p></div><button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-[14px] bg-black text-[13px] font-bold text-white">Вернуться в маршрут</button></div></div>;
}

function ResetModal({ onReset, onClose }: { onReset: () => void; onClose: () => void }) {
  const dialogRef = useDialogFocus(onClose);
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className="max-h-[90dvh] w-full max-w-[440px] overflow-y-auto rounded-[26px] bg-white p-6 text-black sm:p-8"><h2 id="reset-title" className="text-[26px] font-bold">Начать заново?</h2><p className="mt-3 text-[14px] leading-5 text-black/60">Текущий диалог и сохранённый прогресс будут удалены из этого браузера.</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onReset} className="min-h-12 rounded-[14px] bg-alfa-red px-5 text-[13px] font-bold text-white">Удалить и начать</button><button type="button" onClick={onClose} className="min-h-12 rounded-[14px] bg-muted px-5 text-[13px] font-bold">Оставить диалог</button></div></div></div>;
}
