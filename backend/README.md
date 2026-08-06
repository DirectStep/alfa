# Chat API для «Альфа Дело»

Минимальный CommonJS-backend для GigaChat. Он совместим с Node.js 22 в Yandex Cloud Functions и не требует npm-зависимостей.

## Локальный запуск

1. Скопируйте `.env.example` в `.env.local`.
2. Вставьте Authorization Key из кабинета GigaChat в `GIGACHAT_CREDENTIALS` без префикса `Basic`.
3. В одном терминале запустите `npm run dev:api`.
4. Во втором терминале запустите `npm run dev:frontend`.

Frontend обращается к `/api/chat`, а Next.js проксирует запросы на `http://127.0.0.1:3011/api/chat`.

## Yandex Cloud Functions

- runtime: Node.js 22;
- точка входа: `index.handler`;
- содержимое архива функции: `index.js` и `package.json` из папки `backend`;
- переменные окружения:
  - `GIGACHAT_CREDENTIALS` — Authorization Key;
  - `GIGACHAT_SCOPE=GIGACHAT_API_PERS`;
  - `GIGACHAT_MODEL=GigaChat-2-Max`;
- таймаут функции: не меньше 30 секунд;
- доступ: публичный вызов функции, так как проверка origin выполняется внутри обработчика.

После создания публичной версии скопируйте URL вызова функции в `NEXT_PUBLIC_CHAT_API_URL` перед production-сборкой frontend. Прямой URL функции принимает `POST` как чат и `GET` как healthcheck. Если нужен буквальный внешний путь `/api/chat`, поставьте перед функцией Yandex API Gateway и направьте его `POST /api/chat`, `GET /api/health` и `OPTIONS` на эту функцию.

Перед публичным запуском задайте в API Gateway квоту или ограничение частоты запросов и включите мониторинг расходов. CORS ограничивает вызовы из браузеров, но не заменяет защиту публичного server-to-server endpoint.

Разрешённые browser origin заданы в `backend/index.js`: локальные порты 3010 и 5173, а также `https://directstep.github.io`.

При отсутствии ключа, сетевой ошибке или некорректном ответе модели endpoint возвращает `status: "error"`; frontend автоматически продолжает сохранённый демонстрационный сценарий.
