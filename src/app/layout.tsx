import type { Metadata } from "next";
import { styrene } from "@/fonts/styrene-a";
import "./globals.css";

export const metadata: Metadata = {
  title: "Альфа Дело — сообщество для тех, кто делает свое дело",
  description:
    "Платформа для молодых предпринимателей 17-25 лет: сообщество, знания, AI-помощник и инструменты Альфа-Банка в одном месте.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${styrene.variable} antialiased`}>
      <body className="bg-background text-text-primary">{children}</body>
    </html>
  );
}
