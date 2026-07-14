export type PlatformFeature = {
  id: string;
  iconKey: "community" | "knowledge" | "courses" | "network" | "opportunities" | "profile";
  title: string;
  description: string;
};

export const platformFeatures: PlatformFeature[] = [
  {
    id: "community",
    iconKey: "community",
    title: "Сообщество",
    description: "Обсуждения, вопросы и знакомства с другими предпринимателями",
  },
  {
    id: "knowledge",
    iconKey: "knowledge",
    title: "База знаний",
    description: "Статьи и шаблоны документов на каждом этапе бизнеса",
  },
  {
    id: "courses",
    iconKey: "courses",
    title: "Мини-курсы",
    description: "Короткие практические курсы без воды",
  },
  {
    id: "network",
    iconKey: "network",
    title: "Нетворкинг",
    description: "Находите партнёров, дизайнеров и подрядчиков внутри платформы",
  },
  {
    id: "opportunities",
    iconKey: "opportunities",
    title: "Возможности",
    description: "Гранты, акселераторы и офферы для молодых предпринимателей",
  },
  {
    id: "profile",
    iconKey: "profile",
    title: "Профиль предпринимателя",
    description: "Один профиль для сообщества, курсов и инструментов банка",
  },
];
