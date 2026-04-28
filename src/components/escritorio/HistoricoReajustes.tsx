"use client";

/**
 * HistoricoReajustes — Seção 4.
 * Tabela editável de reajustes (mês/ano, % financeiro/técnico/aplicado,
 * observação). Linhas ordenadas automaticamente por data ao renderizar.
 *
 * O acumulado mostrado embaixo usa exclusivamente o pctAplicado.
 */

import { useMemo } from "react";
import {
  NOMES_MESES,
  acumuladoMultiplicativo,
  novoId,
  parseDecimalBR,
  reajustesValidos,
  type Reajuste,
} from "@/lib/calculator-pro";

interface Props {
  reajustes: Reajuste[];
  onChange: (lista: Reajuste[]) => void;
}

const ANOS_REAJUSTE: number[] = (() => {
  const arr: number[] = [];
  for (let a = 2026; a >= 1995; a--) arr.push(a);
  return arr;
})();

export default function HistoricoReajustes({ reajustes, onChange }: Props) {
  // Ordena para apresentação (mas preserva ids para edição estável).
  const ordenados = useMemo(
    () =>
      [...reajustes].sort(
        (a, b) => (a.ano || 0) - (b.ano || 0) || (a.mes || 0) - (b.mes || 0),
      ),
    [reajustes],
  );

  const validos = reajustesValidos(reajustes);
  const acumulado = acumuladoMultiplicativo(
    validos.map((r) => r.aplicadoNum),
  );

  function adicionar() {
    onChange([
      ...reajustes,
      {
        id: novoId(),
        mes: 4,
        ano: new Date().getFullYear(),
        pctFinanceiro: "",
        pctTecnico: "",
        pctAplicado: "",
        observacao: "",
      },
    ]);
  }

  function atualizar(id: string, parcial: Partial<Reajuste>) {
    onChange(reajustes.map((r) => (r.id === id ? { ...r, ...parcial } : r)));
  }

  function remover(id: string) {
    onChange(reajustes.filter((r) => r.id !== id));
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-grey/20 p-6 md:p-8">
      <h2 className="font-black text-xl md:text-2xl text-ink mb-1">
        4. Histórico de reajustes
      </h2>
      <p className="text-sm text-grey mb-6">
        Adicione cada reajuste contestado. O acumulado é calculado pela
        fórmula multiplicativa do Tema 1016/STJ.
      </p>

      <div className="overflow-x-auto -mx-2 md:mx-0">
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead className="bg-bordo text-white">
            <tr>
              <Th>Mês</Th>
              <Th>Ano</Th>
              <Th>% Financeiro</Th>
              <Th>% Técnico</Th>
              <Th>% Aplicado</Th>
              <Th>Observação</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {ordenados.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-grey italic py-6 border-b border-grey/20"
                >
                  Nenhum reajuste cadastrado. Clique em &quot;Adicionar
                  reajuste&quot; abaixo.
                </td>
              </tr>
            )}
            {ordenados.map((r, i) => (
              <tr
                key={r.id}
                className={i % 2 === 0 ? "bg-white" : "bg-offwhite"}
              >
                <Td>
                  <select
                    value={r.mes}
                    onChange={(e) =>
                      atualizar(r.id, { mes: parseInt(e.target.value, 10) })
                    }
                    className={CELL_INPUT}
                  >
                    {NOMES_MESES.map((nome, idx) => (
                      <option key={nome} value={idx + 1}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <select
                    value={r.ano}
                    onChange={(e) =>
                      atualizar(r.id, { ano: parseInt(e.target.value, 10) })
                    }
                    className={CELL_INPUT}
                  >
                    {ANOS_REAJUSTE.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <PctInput
                    valor={r.pctFinanceiro}
                    onChange={(v) => atualizar(r.id, { pctFinanceiro: v })}
                  />
                </Td>
                <Td>
                  <PctInput
                    valor={r.pctTecnico}
                    onChange={(v) => atualizar(r.id, { pctTecnico: v })}
                  />
                </Td>
                <Td>
                  <PctInput
                    valor={r.pctAplicado}
                    onChange={(v) => atualizar(r.id, { pctAplicado: v })}
                    forte
                  />
                </Td>
                <Td>
                  <input
                    type="text"
                    value={r.observacao}
                    onChange={(e) =>
                      atualizar(r.id, { observacao: e.target.value })
                    }
                    className={CELL_INPUT}
                    placeholder="Opcional"
                  />
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => remover(r.id)}
                    className="text-xs font-bold text-grey hover:text-bordo uppercase"
                    aria-label="Remover reajuste"
                  >
                    ✕
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={adicionar}
          className="inline-flex items-center gap-2 text-sm font-bold text-bordo hover:text-bordo-dark"
        >
          + Adicionar reajuste
        </button>

        <div className="text-sm text-ink">
          Total de reajustes:{" "}
          <span className="font-bold">{validos.length}</span>
          <span className="mx-2 text-grey">|</span>
          Acumulado multiplicativo:{" "}
          <span className="font-bold text-bordo">
            {validos.length > 0
              ? `${acumulado.pct.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`
              : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}

const CELL_INPUT =
  "w-full px-2 py-1.5 rounded border border-grey/30 bg-white text-ink text-sm focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2 align-middle border-b border-grey/15">
      {children}
    </td>
  );
}

function PctInput({
  valor,
  onChange,
  forte = false,
}: {
  valor: string;
  onChange: (v: string) => void;
  forte?: boolean;
}) {
  // Aceita "19,2", "19.2", "19", etc. Estado livre — só interpretamos
  // numericamente em parseDecimalBR; aqui guardamos a string crua para
  // não atrapalhar a digitação.
  const num = parseDecimalBR(valor);
  const visual = !valor || Number.isFinite(num) ? "" : "border-bordo";
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        className={`${CELL_INPUT} pr-6 ${forte ? "font-bold" : ""} ${visual}`}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-grey text-xs">
        %
      </span>
    </div>
  );
}
