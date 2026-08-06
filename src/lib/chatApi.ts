export type ChatPassport = {
  projectType?: string;
  direction?: string;
  product: string;
  audience: string;
  stage: string;
  prepared: string;
  goal: string;
  problems?: string;
  resources?: string;
  budget: string;
  delegationTasks?: string;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatTeamMember = {
  id: string;
  name: string;
  description: string;
  reason: string;
  firstTask: string;
};

export type ChatTeamSummary = {
  agentId: string;
  agentName: string;
  summary: string;
};

export type ChatStatus = "collecting" | "ready" | "team_ready" | "working" | "result_ready" | "payment_confirmation" | "error";

export type ChatResponse = {
  reply: string;
  passport: ChatPassport;
  status: ChatStatus;
  team: ChatTeamMember[];
  nextAction: string | null;
  sharedSummary: string | null;
  errorCode?: string;
  requestId?: string;
};

export type ChatRequest = {
  message: string;
  history: ChatHistoryMessage[];
  passport: ChatPassport;
  role?: "partner" | "specialist";
  agentId?: string;
  team?: ChatTeamMember[];
  teamSummaries?: ChatTeamSummary[];
  teamConfirmed?: boolean;
};

export type HealthResponse = {
  status: "ok" | "error";
  provider: "gigachat";
  configured: boolean;
  oauthAvailable?: boolean;
  modelAvailable?: boolean;
  lastErrorCode?: string | null;
};

const STATUSES: ChatStatus[] = ["collecting", "ready", "team_ready", "working", "result_ready", "payment_confirmation", "error"];
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL?.trim() || "/api/chat";
const HEALTH_API_URL = process.env.NEXT_PUBLIC_HEALTH_API_URL?.trim()
  || (CHAT_API_URL === "/api/chat"
    ? "/api/health"
    : /\/api\/chat\/?$/.test(CHAT_API_URL)
      ? CHAT_API_URL.replace(/\/api\/chat\/?$/, "/api/health")
      : CHAT_API_URL);
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

class ChatApiError extends Error {
  constructor(message: string, readonly code: string, readonly requestId: string) {
    super(message);
    this.name = "ChatApiError";
  }
}

function isTeamMember(value: unknown): value is ChatTeamMember {
  if (!value || typeof value !== "object") return false;
  const member = value as Partial<ChatTeamMember>;
  return [member.id, member.name, member.description, member.reason, member.firstTask].every((field) => typeof field === "string");
}

function isChatResponse(value: unknown): value is ChatResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<ChatResponse>;
  const passport = response.passport as Record<string, unknown> | undefined;
  return typeof response.reply === "string"
    && STATUSES.includes(response.status as ChatStatus)
    && (response.nextAction === null || typeof response.nextAction === "string")
    && (response.sharedSummary === null || typeof response.sharedSummary === "string")
    && Boolean(passport)
    && Object.values(passport ?? {}).every((field) => typeof field === "string")
    && Array.isArray(response.team)
    && response.team.every(isTeamMember);
}

function requestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function diagnostic(event: string, details: Record<string, unknown>) {
  if (IS_DEVELOPMENT) console.info(`[Альфа-партнёр] ${event}`, details);
}

async function readJson(response: Response, id: string) {
  try {
    return await response.json() as unknown;
  } catch {
    throw new ChatApiError("Backend вернул некорректный JSON", "frontend_invalid_json", id);
  }
}

async function sendOnce(input: ChatRequest, id: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 40_000);
  const startedAt = performance.now();
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Request-ID": id },
      body: JSON.stringify({
        ...input,
        role: input.role ?? "partner",
        agentId: input.agentId ?? "alpha-partner",
        team: input.team ?? [],
        teamSummaries: input.teamSummaries ?? [],
      }),
      signal: controller.signal,
    });
    const body = await readJson(response, id);
    diagnostic("chat response", { requestId: id, statusCode: response.status, elapsedMs: Math.round(performance.now() - startedAt) });
    if (!response.ok || !isChatResponse(body)) throw new ChatApiError("Некорректный ответ chat API", `frontend_http_${response.status}`, id);
    return body;
  } catch (error) {
    if (error instanceof ChatApiError) throw error;
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ChatApiError(
      aborted ? "Chat API не ответил вовремя" : "Не удалось подключиться к локальному backend или запрос заблокирован CORS",
      aborted ? "frontend_timeout" : "frontend_network_error",
      id,
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function sendChatMessage(input: ChatRequest): Promise<ChatResponse> {
  let lastResponse: ChatResponse | null = null;
  let lastError: ChatApiError | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const id = requestId();
    try {
      const response = await sendOnce(input, id);
      if (response.status !== "error") return response;
      lastResponse = response;
      diagnostic("provider fallback", { requestId: response.requestId || id, attempt, errorCode: response.errorCode || "provider_error" });
    } catch (error) {
      lastError = error instanceof ChatApiError ? error : new ChatApiError("Неизвестная ошибка frontend", "frontend_unknown", id);
      diagnostic("chat request failed", { requestId: lastError.requestId, attempt, errorCode: lastError.code });
    }
    if (attempt === 1) await new Promise((resolve) => window.setTimeout(resolve, 300));
  }
  if (lastResponse) return lastResponse;
  throw lastError ?? new ChatApiError("Chat API недоступен", "frontend_unknown", requestId());
}

export async function checkChatHealth(): Promise<HealthResponse> {
  const id = requestId();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(HEALTH_API_URL, { headers: { "X-Request-ID": id }, signal: controller.signal, cache: "no-store" });
    const body = await readJson(response, id) as Partial<HealthResponse>;
    const valid = (body.status === "ok" || body.status === "error") && body.provider === "gigachat" && typeof body.configured === "boolean";
    if (!valid) throw new ChatApiError("Некорректный healthcheck", "health_invalid_json", id);
    diagnostic("health response", { requestId: id, statusCode: response.status, status: body.status, lastErrorCode: body.lastErrorCode ?? null });
    return body as HealthResponse;
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    const code = error instanceof ChatApiError ? error.code : aborted ? "health_timeout" : "health_network_error";
    diagnostic("health failed", { requestId: id, errorCode: code });
    return { status: "error", provider: "gigachat", configured: false, lastErrorCode: code };
  } finally {
    window.clearTimeout(timeout);
  }
}
