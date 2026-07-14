export type AlfaProductLink = {
  id: string;
  situation: string;
  tool: string;
};

export const alfaProductLinks: AlfaProductLink[] = [
  { id: "first-payment", situation: "Первая оплата", tool: "СБП или платёжная ссылка" },
  { id: "online-sales", situation: "Онлайн-продажи", tool: "Интернет-эквайринг" },
  { id: "offline-sales", situation: "Офлайн-продажи", tool: "AlfaPOS" },
  { id: "fiscalization", situation: "Фискализация", tool: "Альфа-Касса" },
  { id: "payouts", situation: "Выплаты команде", tool: "Массовые выплаты" },
];
