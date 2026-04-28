"use client";

/**
 * SENHA_ESCRITORIO — chave de acesso à área privada.
 *
 * Para revogar o link em circulação ou trocar a senha, basta editar
 * a string abaixo. Nada mais no código depende deste valor; toda a
 * lógica de gate compara diretamente com esta constante.
 *
 * Observação de segurança: como esta página é client-side, a senha
 * fica visível no bundle JS — é um gate de obscuridade, não de
 * autenticação real. Suficiente para um link "não-listado" de uso
 * interno; se evoluir para algo sensível, mover para autenticação
 * server-side (middleware + cookie ou NextAuth).
 */
const SENHA_ESCRITORIO = "tayah2026";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import CalculadoraPro from "@/components/escritorio/CalculadoraPro";

export default function EscritorioClient() {
  const searchParams = useSearchParams();
  const autorizado = searchParams.get("senha") === SENHA_ESCRITORIO;

  // -mt-16/-mt-20 neutraliza o pt do <body> definido em layout.tsx,
  // permitindo que esta área tenha seu próprio header e fundo full-bleed,
  // distintos da landing pública.
  if (!autorizado) {
    return (
      <main className="-mt-16 md:-mt-20 min-h-screen bg-offwhite flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-grey font-bold mb-4">
            Tayah Advogados
          </p>
          <h1 className="font-black text-3xl md:text-4xl text-ink leading-tight mb-4">
            Acesso Restrito
          </h1>
          <p className="text-grey leading-relaxed mb-8">
            Esta área é de uso exclusivo do escritório Tayah Advogados.
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-bold text-bordo hover:text-bordo-dark underline-offset-4 hover:underline transition-colors"
          >
            Voltar ao site público
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="-mt-16 md:-mt-20 min-h-screen bg-[#F5F5F5]">
      <header
        role="banner"
        className="h-16 md:h-20 bg-white shadow-sm flex items-center justify-between px-6 md:px-10"
      >
        <Logo className="h-10 md:h-12 w-auto" priority />
        <h1 className="hidden md:block font-bold text-ink text-lg">
          Área do Escritório
        </h1>
        <span className="text-[10px] md:text-xs uppercase tracking-[0.18em] font-bold bg-bordo/10 text-bordo px-3 py-1.5 rounded">
          Modo Privado
        </span>
      </header>

      <main>
        <CalculadoraPro />

        <div className="max-w-[900px] mx-auto px-4 md:px-0 pb-16 text-center">
          <Link
            href="/"
            className="inline-block text-sm font-bold text-bordo hover:text-bordo-dark underline-offset-4 hover:underline transition-colors"
          >
            Voltar à landing pública
          </Link>
        </div>
      </main>
    </div>
  );
}
