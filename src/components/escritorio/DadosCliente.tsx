"use client";

/**
 * DadosCliente — Seção 1 da calculadora técnica.
 * Cliente, contrato, operadora, tipo de plano e (se empresarial)
 * número de beneficiários, mais ano de contratação.
 *
 * Componente controlado: recebe `valor` e `onChange`. O parent
 * (CalculadoraPro) substitui o estado.
 */

import { useId, useMemo } from "react";
import {
  OPERADORAS,
  parseDecimalBR,
  type DadosCliente as Dados,
  type Operadora,
  type TipoPlano,
} from "@/lib/calculator-pro";

interface Props {
  valor: Dados;
  onChange: (v: Dados) => void;
}

const ROTULO =
  "block text-sm font-bold text-ink mb-1.5";
const INPUT =
  "w-full px-3.5 py-2.5 rounded-md border border-grey/40 bg-white text-ink focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

export default function DadosCliente({ valor, onChange }: Props) {
  const idNome = useId();
  const idContrato = useId();
  const idOperadora = useId();
  const idBenef = useId();
  const idAno = useId();

  const anos = useMemo(() => {
    const arr: number[] = [];
    for (let a = 2026; a >= 1980; a--) arr.push(a);
    return arr;
  }, []);

  function set<K extends keyof Dados>(chave: K, v: Dados[K]) {
    onChange({ ...valor, [chave]: v });
  }

  const benefNum = parseDecimalBR(valor.beneficiarios);
  const falsoColetivo =
    valor.tipoPlano === "empresarial" &&
    Number.isFinite(benefNum) &&
    benefNum > 0 &&
    benefNum < 30;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-grey/20 p-6 md:p-8">
      <h2 className="font-black text-xl md:text-2xl text-ink mb-1">
        1. Dados do cliente
      </h2>
      <p className="text-sm text-grey mb-6">
        Identificação do contrato em análise.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={idNome} className={ROTULO}>
            Nome completo do cliente
          </label>
          <input
            id={idNome}
            type="text"
            value={valor.nome}
            onChange={(e) => set("nome", e.target.value)}
            className={INPUT}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={idContrato} className={ROTULO}>
            Número do contrato
          </label>
          <input
            id={idContrato}
            type="text"
            value={valor.contrato}
            onChange={(e) => set("contrato", e.target.value)}
            className={INPUT}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={idOperadora} className={ROTULO}>
            Operadora
          </label>
          <select
            id={idOperadora}
            value={valor.operadora}
            onChange={(e) => set("operadora", e.target.value as Operadora | "")}
            className={INPUT}
          >
            <option value="">Selecione…</option>
            {OPERADORAS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={idAno} className={ROTULO}>
            Ano de contratação do plano
          </label>
          <select
            id={idAno}
            value={valor.anoContratacao}
            onChange={(e) => set("anoContratacao", e.target.value)}
            className={INPUT}
          >
            <option value="">Selecione…</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className={ROTULO}>Tipo de plano</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <RadioCard
            checked={valor.tipoPlano === "individual"}
            onClick={() => set("tipoPlano", "individual" as TipoPlano)}
            label="Individual / Familiar"
          />
          <RadioCard
            checked={valor.tipoPlano === "adesao"}
            onClick={() => set("tipoPlano", "adesao" as TipoPlano)}
            label="Coletivo por Adesão"
          />
          <RadioCard
            checked={valor.tipoPlano === "empresarial"}
            onClick={() => set("tipoPlano", "empresarial" as TipoPlano)}
            label="Coletivo Empresarial"
          />
        </div>
      </fieldset>

      {valor.tipoPlano === "empresarial" && (
        <div className="mt-5">
          <label htmlFor={idBenef} className={ROTULO}>
            Número de beneficiários no contrato
          </label>
          <input
            id={idBenef}
            type="number"
            min={1}
            inputMode="numeric"
            value={valor.beneficiarios}
            onChange={(e) => set("beneficiarios", e.target.value)}
            className={`${INPUT} max-w-xs`}
            placeholder="Ex.: 25"
          />
          {falsoColetivo && (
            <div className="mt-3 rounded-md bg-[#F5E6E6] text-bordo px-4 py-3 text-sm font-bold">
              ⚠️ Contrato com menos de 30 vidas — possível falso coletivo
              (RN 309/ANS).
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RadioCard({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`text-left p-3 rounded-md border-2 text-sm font-bold transition-colors ${
        checked
          ? "border-bordo bg-bordo/5 text-ink"
          : "border-grey/30 bg-white text-ink hover:border-bordo/60"
      }`}
    >
      {label}
    </button>
  );
}
