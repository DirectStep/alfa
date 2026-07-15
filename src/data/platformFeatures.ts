export type PlatformFeature = {
  id: string;
  variant: "red" | "lavender" | "soft" | "black" | "pink" | "light-green";
  iconKey: "community" | "knowledge" | "courses" | "network" | "opportunities" | "profile";
  image?: string;
  title: string;
  description: string;
};

export const platformFeatures: PlatformFeature[] = [
  {
    id: "community",
    variant: "red",
    iconKey: "community",
    image: "/assets/cards/benefit-community.png",
    title: "Сообщество",
    description: "Обсуждения, вопросы и знакомства с другими предпринимателями",
  },
  {
    id: "knowledge",
    variant: "lavender",
    iconKey: "knowledge",
    image: "/assets/cards/benefit-knowledge.png",
    title: "База знаний",
    description: "Статьи и шаблоны документов на каждом этапе бизнеса",
  },
  {
    id: "courses",
    variant: "soft",
    iconKey: "courses",
    title: "Мини-курсы",
    description: "Короткие практические курсы без воды",
  },
  {
    id: "network",
    variant: "black",
    iconKey: "network",
    title: "Нетворкинг",
    description: "Находите партнёров, дизайнеров и подрядчиков внутри платформы",
  },
  {
    id: "opportunities",
    variant: "pink",
    iconKey: "opportunities",
    title: "Возможности",
    description: "Гранты, акселераторы и офферы для молодых предпринимателей",
  },
  {
    id: "profile",
    variant: "light-green",
    iconKey: "profile",
    title: "Профиль предпринимателя",
    description: "Один профиль для сообщества, курсов и инструментов банка",
  },
];
