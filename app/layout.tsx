import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Máquina de Sites. Painel",
  description: "CRM e funil da Máquina de Sites",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
