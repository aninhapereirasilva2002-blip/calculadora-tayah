"use client";

/**
 * Mensalidade — Seção 3.
 * Valor atual e valor anterior (opcional, calculado se vazio).
 * Mostra também o total de pessoas (titular + dependentes).
 */

import { useId } from "react";
import {
  mascaraMoeda,
  type Mensalidade as Dados,
} from "@/lib/calculator-pro";

interface Props {
  valor: Dados;
  totalPessoas: number; // titular(1) + N dependentes
  qtdDependentes: number;
  onChange: (v: Dados) => void;
}

const ROTULO = "block text-sm font-bold text-ink mb-1.5";

export default function Mensalidade({
  valor,
  totalPessoas,
  qtdDependentes,
  onChange,
}: Props) {
  const idAtual = useId();
  const idAnterior = useId();

  function setMoeda(chave: "atual" | "anterior", raw: string) {
    onChange({ ...valor, [chave]: mascaraMoeda(raw) });
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-grey/20 p-6 md:p-8">
      <h2 className="font-black text-xl md:text-2xl text-ink mb-1">
        3. Mensalidade
      </h2>
      <p className="text-sm text-grey mb-6">
        Valores em reais. O valor anterior é opcional — se vazio, é
        estimado automaticamente a partir do acumulado.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoMoeda
          id={idAtual}
          label="Mensalidade ATUAL"
          valor={valor.atual}
          onChange={(raw) => setMoeda("atual", raw)}
          requerido
        />
        <CampoMoeda
          id={idAnterior}
          label="Mensalidade ANTES do 1º reajuste contestado"
          valor={valor.anterior}
          onChange={(raw) => setMoeda("anterior", raw)}
        />
      </div>

      <p className="mt-4 text-xs text-grey">
        Total titular + dependentes:{" "}
        <span className="font-bold text-ink">
          1 + {qtdDependentes} ={" "}
          {totalPessoas} pessoa{totalPessoas === 1 ? "" : "s"}
        </span>
      </p>
    </section>
  );
}

function CampoMoeda({
  id,
  label,
  valor,
  onChange,
  requerido = false,
}: {
  id: string;
  label: string;
  valor: string;
  onChange: (raw: string) => void;
  requerido?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={ROTULO}>
        {label}
        {requerido && <span className="text-bordo"> *</span>}
        {!requerido && <span className="text-grey font-normal"> (opcional)</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey font-bold pointer-events-none">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0,00"
          className="w-full pl-10 pr-3 py-2.5 rounded-md border border-grey/40 bg-white text-ink focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo"
        />
      </div>
    </div>
  );
}
