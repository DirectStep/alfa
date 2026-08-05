import type { BenefitCard } from "@/types";
import { assetPath } from "@/lib/assetPath";

export const benefitCards: BenefitCard[] = [
  {
    id: "community",
    variant: "red",
    title: "Сообщество",
    description: "Кейсы, вопросы, люди, связи",
    image: assetPath("/assets/cards/benefit-community.png"),
  },
  {
    id: "knowledge",
    variant: "lavender",
    title: "Знания",
    description: "Статьи, шаблоны, практические курсы",
    image: assetPath("/assets/cards/benefit-knowledge.png"),
  },
  {
    id: "ai",
    variant: "light-green",
    title: "AI-помощник",
    description: "Следующий шаг, персональный план, подсказки",
    image: assetPath("/assets/cards/benefit-ai.png"),
  },
];
