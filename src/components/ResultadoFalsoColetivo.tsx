"use client";

/**
 * ResultadoFalsoColetivo.tsx — tela de resultado da calculadora v3.
 *
 * Ordem (de cima para baixo):
 *  1. Porcentagem em círculo, na cor da faixa
 *  2. Veredito (SIM / PROVAVELMENTE / DIFICILMENTE / NÃO)
 *  3. Checklist dos 3 requisitos (✅ / ⚠️ / ❌)
 *  4. Texto explicativo
 *  5. CTA grande de WhatsApp
 *  6. Disclaimer (sempre visível)
 *
 * Compliance OAB: sem valor de restituição em R$, sem promessa de
 * resultado judicial. Regra e textos vêm de calculator-falso-coletivo.ts.
 */

import { useMemo } from "react";
import {
  APRESENTACAO,
  DISCLAIMER,
  OPCOES_REAJUSTE,
  OPCOES_TEMPO,
  OPCOES_VIDAS,
  OPCOES_VINCULO,
  ROTULO_STATUS,
  rotuloDe,
  type RequisitoAvaliado,
  type RespostasFalsoColetivo,
  type ResultadoFalsoColetivo as Resultado,
  type StatusRequisito,
} from "@/lib/calculator-falso-coletivo";
import { linkWhatsapp } from "@/lib/contato";

export default function ResultadoFalsoColetivo({
  resultado,
  dados,
  onReiniciar,
}: {
  resultado: Resultado;
  dados: RespostasFalsoColetivo & { nome?: string };
  onReiniciar: () => void;
}) {
  const ap = APRESENTACAO[resultado.veredito];

  // Mensagem pré-preenchida para o WhatsApp (sem valores em R$).
  const linkWpp = useMemo(() => {
    const linhas = [
      `Olá! Fiz o teste de falso coletivo no site do Tayah Advogados e gostaria de uma análise jurídica do meu caso.`,
      ``,
      `Meu nome é ${dados.nome?.trim() || "..."}.`,
      `Resultado: *${ap.rotulo} — ${resultado.percentual}%*.`,
      ``,
      `Requisitos:`,
      ...resultado.requisitos.map(
        (r) =>
          `${ROTULO_STATUS[r.status].icone} ${r.nome}: ${ROTULO_STATUS[r.status].texto}`,
      ),
      ``,
      `Minhas respostas:`,
      `• Vínculo prévio: ${rotuloDe(OPCOES_VINCULO, dados.vinculo)}`,
      `• Pessoas no contrato: ${rotuloDe(OPCOES_VIDAS, dados.vidas)}`,
      `• Último reajuste: ${rotuloDe(OPCOES_REAJUSTE, dados.reajuste)}`,
      `• Tempo de plano: ${rotuloDe(OPCOES_TEMPO, dados.tempo)}`,
    ];
    return linkWhatsapp(linhas.join("\n"));
  }, [dados, ap.rotulo, resultado]);

  const ctaForte = resultado.veredito === "sim";

  return (
    <div className="w-full max-w-3xl mx-auto animate-[var(--animate-fade-in)] space-y-6">
      <div className="rounded-xl bg-white border border-grey/30 p-6 md:p-10 shadow-sm">
        {/* 1. Porcentagem */}
        <CirculoPercentual pct={resultado.percentual} cor={ap.cor} />

        {/* 2. Veredito */}
        <h3
          className="mt-6 text-center font-black text-3xl md:text-4xl leading-tight"
          style={{ color: ap.cor }}
        >
          {ap.titulo}
        </h3>

        {/* 3. Checklist dos 3 requisitos */}
        <div className="mt-8">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] font-bold text-grey mb-3">
            Os 3 requisitos do falso coletivo
          </p>
          <ul className="space-y-2.5">
            {resultado.requisitos.map((r) => (
              <ItemRequisito key={r.numero} requisito={r} />
            ))}
          </ul>
        </div>

        {/* 4. Texto explicativo */}
        <p className="mt-8 text-ink text-base md:text-lg leading-relaxed">
          {ap.texto}
        </p>

        {/* 5. CTA WhatsApp */}
        <a
          href={linkWpp}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-6 block text-center rounded-md bg-[#25D366] text-white font-bold shadow-md hover:bg-[#20bd5a] transition-colors ${
            ctaForte
              ? "px-6 py-6 text-lg md:text-xl"
              : "px-6 py-5 text-base md:text-lg"
          }`}
        >
          💬 {ap.cta}
        </a>
        <p className="mt-3 text-center text-sm text-grey">
          WhatsApp (21) 99891-7757
        </p>

        {/* 6. Disclaimer — sempre visível */}
        <p className="mt-8 pt-5 border-t border-grey/20 text-xs text-grey leading-relaxed text-center">
          {DISCLAIMER}
        </p>
      </div>

      {/* Por que falar com o Tayah */}
      <div className="rounded-xl bg-white border border-grey/30 p-6 md:p-8 shadow-sm">
        <h3 className="font-black text-xl md:text-2xl text-ink">
          Por que falar com o Tayah Advogados?
        </h3>
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ItemPorQue icone="🏛️" texto="65 anos de tradição" />
          <ItemPorQue icone="🩺" texto="Especialistas em Direito da Saúde" />
          <ItemPorQue icone="🤝" texto="Análise sem compromisso" />
        </ul>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onReiniciar}
          className="px-4 py-2 rounded-md border border-grey/40 text-ink text-sm font-bold hover:bg-grey/5 transition-colors"
        >
          ↻ Refazer análise
        </button>
      </div>
    </div>
  );
}

/* ────────── peças visuais ────────── */

/** Círculo de progresso com a porcentagem no centro. */
function CirculoPercentual({ pct, cor }: { pct: number; cor: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <div
      className="relative w-40 h-40 md:w-48 md:h-48 mx-auto"
      role="img"
      aria-label={`${pct}% de chance`}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#8A8D8F"
          strokeOpacity="0.2"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black text-4xl md:text-5xl leading-none"
          style={{ color: cor }}
        >
          {pct}%
        </span>
        <span className="mt-1 text-xs md:text-sm font-bold uppercase tracking-wider text-grey">
          de chance
        </span>
      </div>
    </div>
  );
}

const ESTILO_STATUS: Record<StatusRequisito, string> = {
  cumprido: "bg-[#F0FAF3] border-emerald-600/40 text-emerald-800",
  parcial: "bg-[#FFF8EB] border-[#D97706]/50 text-[#B45309]",
  nao_cumprido: "bg-[#F5F5F5] border-grey/30 text-grey",
};

function ItemRequisito({ requisito }: { requisito: RequisitoAvaliado }) {
  const st = ROTULO_STATUS[requisito.status];
  return (
    <li className="flex items-center gap-3 rounded-md border border-grey/20 bg-offwhite px-4 py-3">
      <span className="text-xl leading-none flex-shrink-0" aria-hidden="true">
        {st.icone}
      </span>
      <span className="flex-1 text-sm md:text-base text-ink leading-snug">
        <span className="font-black">REQUISITO {requisito.numero}</span>
        <span className="text-grey"> — </span>
        {requisito.nome}
      </span>
      <span
        className={`flex-shrink-0 text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${ESTILO_STATUS[requisito.status]}`}
      >
        {st.texto}
      </span>
    </li>
  );
}

function ItemPorQue({ icone, texto }: { icone: string; texto: string }) {
  return (
    <li className="flex items-center gap-3 rounded-md bg-offwhite border border-grey/20 p-4">
      <span className="text-2xl leading-none" aria-hidden="true">
        {icone}
      </span>
      <span className="font-bold text-ink leading-snug">{texto}</span>
    </li>
  );
}
