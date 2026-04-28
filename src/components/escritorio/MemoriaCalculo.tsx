"use client";

/**
 * MemoriaCalculo — área expansível "▶️ Ver memória de cálculo".
 * Renderiza a string formatada por montarMemoriaCalculo() em
 * fonte monoespaçada, mostrando passo a passo todo o cálculo.
 */

import { useState } from "react";

interface Props {
  texto: string;
}

export default function MemoriaCalculo({ texto }: Props) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="rounded-md border border-grey/30 bg-offwhite">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-ink hover:bg-bordo/5 transition-colors rounded-md"
      >
        <span>{aberto ? "▼" : "▶️"} Ver memória de cálculo</span>
        <span className="text-xs text-grey font-normal uppercase tracking-wider">
          Auditoria
        </span>
      </button>
      {aberto && (
        <pre className="px-4 py-4 border-t border-grey/20 bg-white text-xs md:text-sm font-mono text-ink whitespace-pre-wrap overflow-x-auto leading-relaxed">
          {texto}
        </pre>
      )}
    </div>
  );
}
