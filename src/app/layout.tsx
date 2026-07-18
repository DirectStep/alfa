import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Альфа-Дело — понятный путь от идеи до первой оплаты",
  description:
    "Альфа-Дело помогает проверить идею, составить план запуска, найти практический опыт и подключить финансовые инструменты Альфа-Банка.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="antialiased">
      <body className="bg-background text-text-primary">{children}</body>
    </html>
  );
}
