export type CommunityPost = {
  id: string;
  author: string;
  avatar: string;
  title: string;
  repliesCount: number;
};

export const communityPosts: CommunityPost[] = [
  {
    id: "demand-check",
    author: "Марина, e-commerce",
    avatar: "/assets/community/avatar-03.png",
    title: "Как проверить спрос до закупки товара?",
    repliesCount: 24,
  },
  {
    id: "designer-search",
    author: "Тимур, бренд одежды",
    avatar: "/assets/community/avatar-06.png",
    title: "Ищу дизайнера для запуска бренда",
    repliesCount: 12,
  },
  {
    id: "first-clients",
    author: "Алина, онлайн-школа",
    avatar: "/assets/community/avatar-01.png",
    title: "Как мы получили первые 100 клиентов",
    repliesCount: 41,
  },
];
