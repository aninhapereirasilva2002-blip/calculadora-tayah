import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

// Lato é a única fonte do projeto (Manual de Identidade Visual Tayah):
// 400 Regular (corpo), 700 Bold (ênfases/labels), 900 Black (títulos).
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tayah Advogados — Calculadora de Revisão de Reajuste de Plano de Saúde",
  description:
    "Descubra se o reajuste do seu plano de saúde tem indícios de abusividade. Ferramenta informativa gratuita do escritório Tayah Advogados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${lato.variable} h-full antialiased`}
    >
      {/* pt-16 / md:pt-20 compensa o header fixo (64px mobile / 80px desktop) */}
      <body className="min-h-full flex flex-col font-sans bg-offwhite text-ink pt-16 md:pt-20">
        {children}
      </body>
    </html>
  );
}
