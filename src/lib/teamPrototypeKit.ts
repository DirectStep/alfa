import { strToU8, zipSync } from "fflate";
import type { BusinessPassport } from "@/lib/alphaPartner";
import type { ChatTeamMember } from "@/lib/chatApi";

type TeamPrototypeKitInput = {
  passport: BusinessPassport;
  team: ChatTeamMember[];
  agentTasks: Record<string, string>;
};

const fallback = (value: string) => value.trim() || "Пока не определено";

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (symbol) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[symbol] ?? symbol);
}

function buildReadme(team: ChatTeamMember[]) {
  return `ВАЖНО: ЭТО ПРЕЗЕНТАЦИОННЫЙ ПРОТОТИП

Этот ZIP-комплект показывает, как в целевой версии можно будет перенести персональную AI-команду Альфа-Партнёра на компьютер или другое устройство.

СЕЙЧАС АГЕНТЫ ИЗ АРХИВА НЕ РАБОТАЮТ:
- они не подключены к нейросети;
- они не запускаются как программа;
- они не управляют компьютером или телефоном;
- они не получают доступ к файлам и приложениям;
- они не выполняют действия в фоне.

В архиве уже сохранены состав команды, паспорт бизнеса, роли, ограничения, первые задачи и демонстрационная офлайн-страница. В полноценной версии к этому комплекту будет добавлен локальный исполнитель с подключением к AI.

Как задумана целевая версия:
1. Пользователь выбирает рабочую папку.
2. Агент предлагает создать или изменить файл либо открыть нужную ссылку.
3. Пользователь видит действие до выполнения.
4. Каждое действие требует отдельного подтверждения.
5. Удаление файлов и скрытое управление устройством запрещены.

Состав демонстрационной команды:
- Альфа-Партнёр — главный координатор.
${team.map((member) => `- ${member.name} — ${member.description.replace(/[.!?]+$/, "")}.`).join("\n")}

С чего начать знакомство:
1. Распакуйте архив.
2. Откройте файл «ОТКРЫТЬ_КОМАНДУ.html» в браузере.
3. Посмотрите паспорт бизнеса и задачи специалистов.
4. Помните: это презентация будущей механики, а не установленный AI-продукт.
`;
}

function buildTeamHtml(passport: BusinessPassport, team: ChatTeamMember[], agentTasks: Record<string, string>) {
  const passportRows = [
    ["Тип проекта", passport.projectType],
    ["Направление", passport.direction],
    ["Продукт", passport.product],
    ["Аудитория", passport.audience],
    ["Стадия", passport.stage],
    ["Цель", passport.goal],
  ];
  const members = team.map((member, index) => `
    <article class="agent agent-${index % 3}">
      <span class="number">${index + 1}</span>
      <h3>${escapeHtml(member.name)}</h3>
      <p>${escapeHtml(member.description)}</p>
      <dl><dt>Зачем в команде</dt><dd>${escapeHtml(member.reason)}</dd></dl>
      <dl><dt>Первая задача</dt><dd>${escapeHtml(agentTasks[member.id] || member.firstTask)}</dd></dl>
    </article>`).join("");

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI-команда Альфа-Партнёра — прототип</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font-family:Arial,sans-serif}header{background:#f93228;color:#fff;padding:44px 20px 48px}main,header>div{width:min(1120px,100%);margin:auto}h1{max-width:800px;margin:8px 0 16px;font-size:clamp(42px,8vw,82px);line-height:.92;letter-spacing:-.055em}.label{font-size:12px;font-weight:800;text-transform:uppercase}.warning{margin:24px 0 0;background:#b5ff00;color:#111;padding:18px;border-radius:16px;font-weight:700;line-height:1.45}.section{padding:54px 20px}.section h2{font-size:clamp(30px,5vw,52px);letter-spacing:-.04em}.passport{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#ddd;border:1px solid #ddd;border-radius:18px;overflow:hidden}.passport div{background:#fff;padding:18px}.passport dt,.agent dt{font-size:10px;font-weight:800;text-transform:uppercase;color:#777}.passport dd,.agent dd{margin:7px 0 0;font-weight:700}.team{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.agent{min-height:300px;padding:22px;border-radius:22px;color:#fff}.agent-0{background:#087cff}.agent-1{background:#962cff}.agent-2{background:#b5ff00;color:#111}.number{font-size:50px;font-weight:900}.agent h3{font-size:24px;margin:16px 0 8px}.agent p{min-height:42px;opacity:.72}.agent dl{border-top:1px solid currentColor;padding-top:14px;margin-top:18px}.agent dt{color:currentColor;opacity:.6}.dark{background:#111;color:#fff}.dark p{max-width:760px;line-height:1.6;color:#bbb}footer{padding:24px 20px;text-align:center;font-size:12px;color:#777}@media(max-width:720px){.passport,.team{grid-template-columns:1fr}header{padding-top:32px}.section{padding:40px 16px}.agent{min-height:0}}
</style></head><body>
<header><div><p class="label">Альфа-Дело · переносимая AI-команда</p><h1>Ваша команда собрана</h1><p>Персональный состав специалистов и контекст бизнеса сохранены в одном комплекте.</p><div class="warning">Это презентационный прототип. Агенты в архиве не подключены к нейросети, не запускаются и не управляют устройством.</div></div></header>
<main>
<section class="section"><h2>Паспорт бизнеса</h2><dl class="passport">${passportRows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(fallback(value))}</dd></div>`).join("")}</dl></section>
<section class="section"><h2>AI-команда</h2><div class="team">${members}</div></section>
<section class="section dark"><h2>Как это будет работать</h2><p>В целевой версии пользователь выберет рабочую папку, а агенты смогут предлагать создание и редактирование файлов или открытие ссылок. Каждое действие будет выполняться только после явного подтверждения. Текущий архив демонстрирует состав и настройки, но не содержит работающего локального исполнителя.</p></section>
</main><footer>Презентационный комплект Альфа-Партнёра · без доступа к устройству</footer>
</body></html>`;
}

function buildAgentCard(member: ChatTeamMember, task: string) {
  return `# ${member.name}

Статус: презентационная конфигурация, агент не запускается.

## Роль
${member.description}

## Почему выбран
${member.reason}

## Первая задача
${task || member.firstTask}

## Разрешённые действия в целевой версии
- создавать рабочие материалы в выбранной пользователем папке;
- редактировать файлы только после подтверждения;
- открывать полезные ссылки после подтверждения;
- показывать план действия до выполнения.

## Ограничения
- не удалять файлы;
- не получать доступ за пределами выбранной папки;
- не выполнять действия скрытно или в фоне;
- не совершать финансовые операции;
- не считать рекомендации гарантией результата.
`;
}

export function downloadTeamPrototypeKit({ passport, team, agentTasks }: TeamPrototypeKitInput) {
  const config = {
    version: "presentation-prototype-1.0",
    createdAt: new Date().toISOString(),
    working: false,
    neuralNetworkConnected: false,
    deviceControlEnabled: false,
    project: passport,
    team: [{ id: "alpha-partner", name: "Альфа-Партнёр", role: "Главный координатор" }, ...team],
    plannedPermissions: {
      selectedFolderOnly: true,
      createFiles: true,
      editFilesAfterConfirmation: true,
      openLinksAfterConfirmation: true,
      deleteFiles: false,
      backgroundActions: false,
    },
  };
  const files: Record<string, Uint8Array> = {
    "ПРОЧИТАЙ_МЕНЯ.txt": strToU8(`\uFEFF${buildReadme(team)}`),
    "ОТКРЫТЬ_КОМАНДУ.html": strToU8(buildTeamHtml(passport, team, agentTasks)),
    "Паспорт_бизнеса.json": strToU8(JSON.stringify(config, null, 2)),
    "ПРАВИЛА_БУДУЩЕГО_ДОСТУПА.md": strToU8("# Правила будущего доступа\n\nАгенты работают только в выбранной папке. Каждое создание, изменение файла или открытие ссылки требует подтверждения пользователя. Удаление файлов, скрытые действия и финансовые операции запрещены. В текущем прототипе доступ к устройству отсутствует.\n"),
    "АГЕНТЫ/00_Альфа-Партнёр.md": strToU8("# Альфа-Партнёр\n\nГлавный координатор команды. Хранит общий паспорт бизнеса, распределяет задачи и объединяет результаты. Это презентационная конфигурация — агент из архива не запускается.\n"),
  };
  for (const member of team) files[`АГЕНТЫ/${safeFileName(member.name)}.md`] = strToU8(buildAgentCard(member, agentTasks[member.id] || member.firstTask));

  const archive = zipSync(files, { level: 6 });
  // Copy into a plain ArrayBuffer: this keeps Blob creation compatible with
  // browsers whose TypeScript definitions reject Uint8Array<ArrayBufferLike>.
  const archiveBuffer = new ArrayBuffer(archive.byteLength);
  new Uint8Array(archiveBuffer).set(archive);
  const blob = new Blob([archiveBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Alfa_Partner_AI_Team_PROTOTYPE.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
