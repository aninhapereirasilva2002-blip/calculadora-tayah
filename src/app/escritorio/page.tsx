/**
 * /escritorio — área privada de uso interno do escritório Tayah.
 *
 * Esta rota é intencionalmente "secreta": não há link público para ela
 * em nenhum lugar do site (header, footer, sitemap). O acesso depende
 * de conhecer a URL completa com o query param `?senha=...`.
 *
 * Esta page.tsx é um Server Component porque o Next.js só aceita o
 * export `metadata` em Server Components. A lógica de gate (que precisa
 * de useSearchParams) vive em ./EscritorioClient.tsx, envolto em Suspense
 * conforme exigido pelo Next 16 para useSearchParams em produção.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import EscritorioClient from "./EscritorioClient";

// noindex/nofollow: impede que buscadores indexem ou sigam links a partir
// desta rota mesmo que alguém compartilhe o link por engano.
export const metadata: Metadata = {
  title: "Área do Escritório — Tayah Advogados",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function EscritorioPage() {
  return (
    <Suspense fallback={null}>
      <EscritorioClient />
    </Suspense>
  );
}
