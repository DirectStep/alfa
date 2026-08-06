import { strToU8, zip } from "fflate";
import { assetPath } from "@/lib/assetPath";

export type AgentKitAnswers = {
  situation?: string;
  product?: string;
  audience?: string;
  stage?: string;
  prototype?: string;
  budget?: string;
  goal?: string;
};

export type AgentKitBuildStage = 1 | 2 | 3 | 4;

type AgentKitProfile = {
  projectName: string;
  product: string;
  audience: string;
  readiness: string;
  stage: string;
  budget: string;
  goal: string;
};

type BuiltAgentKit = {
  blob: Blob;
  fileName: string;
};

const PENDING_VALUE = "Пока не определено";
const AGENT_NAME = "Агент проверки спроса";
const ACTION_NAME = "Проверить спрос до производства";
const SUCCESS_CRITERIA = "10 ответов и минимум 3 подтвержденных интереса";
const INTERVIEW_QUESTIONS = [
  "Какой вариант вы бы выбрали?",
  "Почему выбрали именно его?",
  "В какой ситуации вы бы использовали этот продукт?",
  "Какую цену считаете приемлемой?",
  "Что мешает вам оставить заявку сейчас?",
  "Готовы ли вы оставить контакт или оформить предзаказ?",
];
const ACTION_PLAN = [
  "Подготовить 2-3 варианта продукта.",
  "Найти минимум 5 представителей аудитории.",
  "Показать варианты без предварительного объяснения идеи.",
  "Спросить, какой вариант человек выбрал бы и почему.",
  "Уточнить приемлемую цену.",
  "Предложить оставить контакт или оформить предзаказ.",
  "Зафиксировать ответы.",
];

function answerOrPending(value?: string) {
  const normalized = value?.trim();
  if (!normalized || /не\s+определ/i.test(normalized)) return PENDING_VALUE;
  return normalized;
}

function latinFilePart(value: string) {
  const alphabet: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return value.toLowerCase()
    .split("")
    .map((character) => alphabet[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Project";
}

export function getAgentKitProfile(answers: AgentKitAnswers): AgentKitProfile {
  const projectContext = `${answers.situation ?? ""} ${answers.product ?? ""}`.toLowerCase();
  const projectName = /украшен|кольц|сер[её]г|браслет/.test(projectContext)
    ? "Бренд украшений"
    : /одеж|худи|свитшот|футбол|капсул/.test(projectContext)
      ? "Бренд одежды"
      : answerOrPending(answers.product);
  return {
    projectName,
    product: answerOrPending(answers.product),
    audience: answerOrPending(answers.audience),
    readiness: answerOrPending(answers.prototype),
    stage: answerOrPending(answers.stage || (answers.situation ? "Проверка идеи" : undefined)),
    budget: answerOrPending(answers.budget),
    goal: answerOrPending(answers.goal),
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function nextPaint() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Не удалось прочитать аватар агента."));
    reader.readAsDataURL(blob);
  });
}

async function loadAgentAvatar() {
  try {
    const response = await fetch(assetPath("/assets/ai/alfa-agent.png"));
    if (!response.ok) return "";
    return await blobToDataUrl(await response.blob());
  } catch {
    return "";
  }
}

function createAgentHtml(profile: AgentKitProfile, avatarDataUrl: string) {
  const contextFields = [
    ["Проект", profile.projectName],
    ["Продукт", profile.product],
    ["Аудитория", profile.audience],
    ["Готовность проекта", profile.readiness],
    ["Стадия", profile.stage],
    ["Бюджет", profile.budget],
    ["Цель", profile.goal],
  ];
  const contextMarkup = contextFields.map(([label, value]) => `
    <div class="context-item">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>`).join("");
  const avatarMarkup = avatarDataUrl
    ? `<img src="${avatarDataUrl}" alt="Аватар персонального AI-агента">`
    : '<span class="avatar-fallback" aria-hidden="true">AI</span>';
  const planMarkup = ACTION_PLAN.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const questionsMarkup = INTERVIEW_QUESTIONS.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Агент проверки спроса — Альфа Дело</title>
  <style>
    :root {
      --red: #ef3124;
      --blue: #0078ff;
      --lime: #a8ff00;
      --purple: #9933ff;
      --black: #151515;
      --muted: #f2f3f5;
      --border: #e5e5e7;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: #fff;
      color: var(--black);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    button { font: inherit; }
    .container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
    .hero { padding: 44px 0 54px; border-bottom: 1px solid var(--border); }
    .hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 36px; align-items: center; }
    .eyebrow { margin: 0; color: var(--red); font-size: 12px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
    h1 { margin: 14px 0 0; max-width: 760px; font-size: clamp(42px, 6vw, 76px); line-height: .92; letter-spacing: -.055em; }
    .lead { max-width: 760px; margin: 24px 0 0; color: #595959; font-size: 18px; }
    .agent-card { overflow: hidden; min-height: 290px; border-radius: 34px; background: var(--blue); color: #fff; text-align: center; }
    .agent-card img { display: block; width: 190px; height: 240px; margin: 6px auto -28px; object-fit: contain; object-position: top center; }
    .avatar-fallback { display: grid; width: 150px; height: 150px; margin: 34px auto 24px; place-items: center; border-radius: 50%; background: var(--lime); color: var(--black); font-size: 54px; font-weight: 900; }
    .agent-card strong { display: block; padding: 20px; font-size: 20px; }
    main { padding: 56px 0 72px; }
    section + section { margin-top: 22px; }
    .panel { border-radius: 30px; background: var(--muted); padding: 30px; }
    .panel-blue { background: var(--blue); color: #fff; }
    .panel-lime { background: var(--lime); }
    .section-title { margin: 0; font-size: clamp(28px, 4vw, 42px); line-height: 1; letter-spacing: -.035em; }
    .context-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 24px 0 0; overflow: hidden; border-radius: 20px; background: #d8d8da; }
    .context-item { min-width: 0; background: #fff; padding: 18px; }
    .context-item dt { color: #777; font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
    .context-item dd { margin: 8px 0 0; overflow-wrap: anywhere; font-size: 16px; font-weight: 800; }
    .skills { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 24px; }
    .skill { border-radius: 22px; background: #fff; color: var(--black); padding: 22px; }
    .skill h3 { margin: 0; font-size: 20px; line-height: 1.05; }
    .skill dl { margin: 18px 0 0; }
    .skill dt { margin-top: 12px; color: #777; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .skill dd { margin: 4px 0 0; font-size: 14px; }
    .action-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr); gap: 20px; margin-top: 24px; }
    .action-copy { border-radius: 24px; background: #fff; color: var(--black); padding: 24px; }
    .action-copy p { margin: 14px 0 0; color: #555; }
    .action-copy ol { margin: 22px 0 0; padding-left: 23px; }
    .action-copy li + li { margin-top: 10px; }
    .criterion { border-radius: 24px; background: var(--lime); color: var(--black); padding: 24px; }
    .criterion span { display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .criterion strong { display: block; margin-top: 12px; font-size: 28px; line-height: 1.05; }
    .questions { margin: 24px 0 0; padding-left: 24px; font-size: 16px; }
    .questions li + li { margin-top: 10px; }
    .copy-button { min-height: 48px; margin-top: 24px; border: 0; border-radius: 14px; background: var(--red); color: #fff; padding: 0 22px; font-weight: 800; cursor: pointer; }
    .copy-button:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
    .outcomes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
    .outcome { min-height: 94px; border: 1px solid var(--border); border-radius: 20px; background: #fff; padding: 20px; font-weight: 800; }
    .notice { margin: 24px 0 0; border-left: 5px solid var(--red); padding: 4px 0 4px 18px; color: #555; }
    footer { background: var(--black); color: #fff; padding: 30px 0; }
    footer p { margin: 0; color: #aaa; font-size: 13px; }
    @media (max-width: 780px) {
      .container { width: min(100% - 28px, 1180px); }
      .hero { padding: 30px 0 38px; }
      .hero-grid, .action-grid { grid-template-columns: 1fr; }
      .agent-card { min-height: 250px; }
      .context-grid, .skills { grid-template-columns: 1fr; }
      .outcomes { grid-template-columns: 1fr; }
      main { padding: 38px 0 52px; }
      .panel { padding: 22px; border-radius: 24px; }
      .lead { font-size: 16px; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container hero-grid">
      <div>
        <p class="eyebrow">АЛЬФА ДЕЛО - ПЕРСОНАЛЬНЫЙ AI-АГЕНТ</p>
        <h1>Ваш агент настроен под бизнес</h1>
        <p class="lead">Этот комплект хранит контекст проекта, подключенные навыки и первое действие. Активный диалог с агентом продолжается внутри сервиса «Альфа Дело».</p>
      </div>
      <div class="agent-card">
        ${avatarMarkup}
        <strong>${escapeHtml(AGENT_NAME)}</strong>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="panel" aria-labelledby="context-title">
      <h2 class="section-title" id="context-title">Контекст проекта</h2>
      <dl class="context-grid">${contextMarkup}</dl>
    </section>

    <section class="panel panel-blue" aria-labelledby="skills-title">
      <h2 class="section-title" id="skills-title">Подключенные навыки</h2>
      <div class="skills">
        <article class="skill">
          <h3>Проверка спроса</h3>
          <dl><dt>Что делает</dt><dd>Проверяет реальный интерес до первой закупки.</dd><dt>Какие данные использует</dt><dd>Продукт, аудитория, готовность проекта и бюджет.</dd><dt>Результат</dt><dd>Подтверждения интереса и контакты потенциальных покупателей.</dd></dl>
        </article>
        <article class="skill">
          <h3>Интервью с клиентами</h3>
          <dl><dt>Что делает</dt><dd>Помогает провести короткие разговоры без наводящих вопросов.</dd><dt>Какие данные использует</dt><dd>Аудитория, продукт и текущая цель.</dd><dt>Результат</dt><dd>Заполненная таблица ответов, цен и возражений.</dd></dl>
        </article>
        <article class="skill">
          <h3>Тестирование предложения</h3>
          <dl><dt>Что делает</dt><dd>Сравнивает реакцию на 2-3 варианта продукта и цены.</dd><dt>Какие данные использует</dt><dd>Продукт, бюджет, аудитория и наличие эскизов или образца.</dd><dt>Результат</dt><dd>Вариант для следующего теста или первой закупки.</dd></dl>
        </article>
      </div>
    </section>

    <section class="panel panel-blue" aria-labelledby="action-title">
      <h2 class="section-title" id="action-title">Первое действие агента</h2>
      <div class="action-grid">
        <div class="action-copy">
          <h3>${escapeHtml(ACTION_NAME)}</h3>
          <p>Покажите потенциальным покупателям 2-3 варианта продукта и соберите подтверждения реального интереса до первой закупки.</p>
          <ol>${planMarkup}</ol>
        </div>
        <div class="criterion">
          <span>Критерий результата</span>
          <strong>${escapeHtml(SUCCESS_CRITERIA)}</strong>
        </div>
      </div>
    </section>

    <section class="panel" aria-labelledby="questions-title">
      <h2 class="section-title" id="questions-title">Вопросы для интервью</h2>
      <ol class="questions" id="interview-questions">${questionsMarkup}</ol>
      <button class="copy-button" id="copy-questions" type="button">Скопировать вопросы</button>
    </section>

    <section class="panel panel-lime" aria-labelledby="next-title">
      <h2 class="section-title" id="next-title">Что дальше</h2>
      <div class="outcomes">
        <div class="outcome">Есть первые предзаказы</div>
        <div class="outcome">Есть интерес, но нет заявок</div>
        <div class="outcome">Спрос не подтвердился</div>
        <div class="outcome">Проверка ещё не проведена</div>
      </div>
      <p class="notice">Сообщите результат в «Альфа Дело». Агент обновит маршрут. Платежный продукт Альфы появится только при возникновении задачи приема оплаты.</p>
    </section>
  </main>

  <footer><div class="container"><p>Переносимый комплект настроек и рабочих инструментов. Внутри файла не работает автономная LLM.</p></div></footer>

  <script>
    (function () {
      var questions = ${JSON.stringify(INTERVIEW_QUESTIONS)};
      var button = document.getElementById("copy-questions");

      function fallbackCopy(text) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        var copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
      }

      button.addEventListener("click", async function () {
        var text = questions.map(function (question, index) {
          return (index + 1) + ". " + question;
        }).join("\\n");
        var copied = false;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            copied = true;
          } else {
            copied = fallbackCopy(text);
          }
        } catch (error) {
          copied = fallbackCopy(text);
        }
        button.textContent = copied ? "Вопросы скопированы" : "Не удалось скопировать";
        window.setTimeout(function () {
          button.textContent = "Скопировать вопросы";
        }, 2200);
      });
    }());
  </script>
</body>
</html>`;
}

function createInterviewCsv() {
  const headers = [
    "Номер",
    "Имя или код респондента",
    "Сегмент",
    "Выбранный вариант",
    "Причина выбора",
    "Приемлемая цена",
    "Готов оставить контакт",
    "Готов оформить предзаказ",
    "Основное возражение",
    "Комментарий",
  ];
  const rows = Array.from({ length: 10 }, (_, index) => [index + 1, "", "", "", "", "", "", "", "", ""]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;
}

function createAgentConfig(profile: AgentKitProfile) {
  return {
    version: "prototype-1.0",
    created_at: new Date().toISOString(),
    agent_name: AGENT_NAME,
    project: {
      name: profile.projectName,
      product: profile.product,
      audience: profile.audience,
      readiness: profile.readiness,
      stage: profile.stage,
      budget: profile.budget,
      goal: profile.goal,
    },
    skills: [
      { id: "demand-validation", name: "Проверка спроса" },
      { id: "customer-interviews", name: "Интервью с клиентами" },
      { id: "offer-testing", name: "Тестирование предложения" },
    ],
    current_action: {
      name: ACTION_NAME,
      description: "Показать потенциальным покупателям 2-3 варианта продукта и собрать подтверждения реального интереса до первой закупки.",
      plan: ACTION_PLAN,
      success_criteria: SUCCESS_CRITERIA,
    },
    restrictions: [
      "Не выполняет финансовые операции",
      "Не создает платежные инструменты без подтверждения пользователя",
      "Не гарантирует коммерческий результат",
      "Не является автономной LLM",
    ],
    data_source: "Ответы пользователя, сохраненные после настройки агента в сервисе «Альфа Дело»",
    prototype_status: "Демонстрационный переносимый комплект настроек и рабочих инструментов",
    prototype: true,
  };
}

function createReadme(profile: AgentKitProfile) {
  return `Что находится в комплекте

Открыть_агента.html
Персональная офлайн-страница проекта «${profile.projectName}» с контекстом, подключенными навыками, первым действием и вопросами для интервью.

Таблица_интервью.csv
Шаблон на 10 респондентов для фиксации выбранных вариантов, цены, готовности оставить контакт, предзаказа и возражений.

Конфигурация_агента.json
Структурированные настройки проекта, цели, навыков, первого действия и ограничений агента.

README.txt
Описание содержимого комплекта и порядок продолжения работы.

Это демонстрационный комплект персонального AI-агента, созданный в рамках кейса чемпионата «Альфа Будущее». Полноценный AI-агент работает внутри сервиса «Альфа Дело». В комплекте сохраняются его настройки, контекст и рабочие инструменты.

Как продолжить работу

1. Откройте файл «Открыть_агента.html».
2. Используйте вопросы и таблицу для проверки спроса.
3. Вернитесь в «Альфа Дело» и сообщите результат.
4. Агент обновит маршрут и предложит следующий шаг.

Важно: комплект не содержит автономную LLM, не выполняет финансовые операции и не гарантирует коммерческий результат.
`;
}

function createZip(files: Record<string, Uint8Array>) {
  return new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

export async function buildAgentKit(
  answers: AgentKitAnswers,
  onStage: (stage: AgentKitBuildStage) => void,
): Promise<BuiltAgentKit> {
  const profile = getAgentKitProfile(answers);
  const config = createAgentConfig(profile);
  onStage(1);
  await nextPaint();

  const avatarDataUrl = await loadAgentAvatar();
  const html = createAgentHtml(profile, avatarDataUrl);
  onStage(2);
  await nextPaint();

  const csv = createInterviewCsv();
  const readme = createReadme(profile);
  onStage(3);
  await nextPaint();

  onStage(4);
  await nextPaint();
  const archive = await createZip({
    "Открыть_агента.html": strToU8(html),
    "Таблица_интервью.csv": strToU8(csv),
    "Конфигурация_агента.json": strToU8(JSON.stringify(config, null, 2)),
    "README.txt": strToU8(readme),
  });

  const projectPart = profile.projectName === "Бренд одежды"
    ? "Brand_Odezhdy"
    : profile.projectName === "Бренд украшений"
      ? "Brand_Ukrasheniy"
      : latinFilePart(profile.projectName);
  const archiveBuffer = new Uint8Array(archive.byteLength);
  archiveBuffer.set(archive);

  return {
    blob: new Blob([archiveBuffer.buffer], { type: "application/zip" }),
    fileName: `Alfa_Delo_AI_Agent_${projectPart}.zip`,
  };
}

export function downloadAgentKit({ blob, fileName }: BuiltAgentKit) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari can hand the Blob URL to the download manager with a small delay.
  // Keep it alive long enough for the hand-off, then release it.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
