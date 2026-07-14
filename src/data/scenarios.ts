import type { ScenarioStage, SegmentOption } from "@/types";

export const industries: SegmentOption[] = [
  { id: "creative", label: "Креативные индустрии" },
  { id: "startups", label: "Стартапы" },
  { id: "ecommerce", label: "E-commerce" },
];

export const stages: ScenarioStage[] = [
  {
    id: "want",
    label: "Хочу свое",
    recommendation:
      "Начнём с базы: разберём идею, нишу и первые шаги перед стартом.",
  },
  {
    id: "idea",
    label: "Есть идея",
    recommendation:
      "Поможем проверить спрос и собрать первый прототип продукта.",
  },
  {
    id: "launching",
    label: "Запускаюсь",
    recommendation:
      "Подключим приём оплаты и соберём чек-лист для первого запуска.",
  },
  {
    id: "active",
    label: "Действующий бизнес",
    recommendation:
      "Сфокусируемся на росте: новые каналы продаж и масштабирование.",
  },
];
