"use client";

/**
 * ResultadoAnalise — Seção 5.
 * Renderiza:
 *  5.1 Resumo do caso (card destaque vermelho)
 *  5.2 Comparativos automáticos (tabela)
 *  5.3 Memória de cálculo (componente expansível)
 *  5.4 Indícios de abusividade (lista colorida)
 *
 * Recebe estado bruto + resultado já computado (computeResultado).
 * Não toca em estado.
 */

import {
  formatPctBR,
  montarMemoriaCalculo,
  rotuloTipoPlano,
  type CasoEstado,
  type Resultado,
} from "@/lib/calculator-pro";
import MemoriaCalculo from "./MemoriaCalculo";

interface Props {
  estado: CasoEstado;
  resultado: Resultado;
}

export default function ResultadoAnalise({ estado, resultado }: Props) {
  if (!resultado.preenchido) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-grey/20 p-8 md:p-10 text-center">
        <h2 className="font-black text-xl md:text-2xl text-ink mb-2">
          5. Resultado e análise técnica
        </h2>
        <p className="text-grey">
          Preencha os dados acima para ver a análise.
        </p>
      </section>
    );
  }

  const totalPessoas = 1 + estado.dependentes.length;
  const memoria = montarMemoriaCalculo(estado, resultado);

  return (
    <section className="space-y-6">
      <h2 className="font-black text-xl md:text-2xl text-ink">
        5. Resultado e análise técnica
      </h2>

      {/* 5.1 Resumo do caso */}
      <div className="rounded-lg bg-bordo text-white p-6 md:p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-80 mb-3">
          Resumo do caso
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base">
          <Linha label="Cliente" valor={estado.cliente.nome || "—"} />
          <Linha label="Contrato" valor={estado.cliente.contrato || "—"} />
          <Linha label="Operadora" valor={estado.cliente.operadora || "—"} />
          <Linha
            label="Tipo"
            valor={rotuloTipoPlano(estado.cliente.tipoPlano)}
          />
          <Linha
            label="Vidas"
            valor={`Titular + ${estado.dependentes.length} dependente${
              estado.dependentes.length === 1 ? "" : "s"
            } (${totalPessoas})`}
          />
          <Linha
            label={`Acumulado em ${resultado.duracaoMeses} mes${
              resultado.duracaoMeses === 1 ? "" : "es"
            }`}
            valor={
              resultado.qtdReajustes > 0
                ? formatPctBR(resultado.acumuladoCasoPct)
                : "—"
            }
            destacado
          />
        </div>
      </div>

      {/* 5.2 Comparativos */}
      <div className="rounded-lg bg-white border border-grey/20 shadow-sm p-6 md:p-8">
        <h3 className="font-bold text-lg text-ink mb-4">
          Comparativos automáticos
        </h3>
        <div className="overflow-x-auto -mx-2 md:mx-0">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead className="bg-ink text-white">
              <tr>
                <ThComp>Indicador</ThComp>
                <ThComp>Período</ThComp>
                <ThComp>Variação</ThComp>
                <ThComp>Status</ThComp>
              </tr>
            </thead>
            <tbody>
              {resultado.comparativos.map((c, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-offwhite"}
                >
                  <TdComp>{c.indicador}</TdComp>
                  <TdComp className="text-grey">{c.periodo}</TdComp>
                  <TdComp className="font-bold">{c.variacaoTexto}</TdComp>
                  <TdComp>
                    <StatusBadge texto={c.status} destaque={c.destaque} />
                  </TdComp>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-grey italic">
          IPCA e IGP-M são estimativas; usar índices oficiais do IBGE/FGV
          no parecer final.
        </p>
      </div>

      {/* 5.3 Memória de cálculo */}
      <MemoriaCalculo texto={memoria} />

      {/* 5.4 Indícios de abusividade */}
      <div className="rounded-lg bg-white border border-grey/20 shadow-sm p-6 md:p-8">
        <h3 className="font-bold text-lg text-ink mb-4">
          Indícios de abusividade
        </h3>
        <ul className="space-y-2">
          {resultado.avisos.map((a, i) => (
            <li
              key={i}
              className={`px-4 py-3 rounded-md text-sm font-medium ${corDoAviso(
                a.nivel,
              )}`}
            >
              {a.texto}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Linha({
  label,
  valor,
  destacado = false,
}: {
  label: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div
        className={`${
          destacado ? "text-2xl md:text-3xl font-black" : "font-bold"
        } leading-snug`}
      >
        {valor}
      </div>
    </div>
  );
}

function ThComp({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider">
      {children}
    </th>
  );
}

function TdComp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-3 py-3 align-middle border-b border-grey/15 ${className}`}
    >
      {children}
    </td>
  );
}

function StatusBadge({
  texto,
  destaque,
}: {
  texto: string;
  destaque: "red" | "amber" | "green" | null;
}) {
  if (!destaque) {
    return <span className="text-grey text-xs italic">{texto}</span>;
  }
  const cls =
    destaque === "red"
      ? "bg-[#F5E6E6] text-bordo"
      : destaque === "amber"
        ? "bg-[#FFF8DC] text-amber-900"
        : "bg-[#E6F4EA] text-emerald-900";
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${cls}`}>
      {texto}
    </span>
  );
}

function corDoAviso(nivel: "red" | "amber" | "green"): string {
  switch (nivel) {
    case "red":
      return "bg-[#F5E6E6] text-bordo border-l-4 border-bordo";
    case "amber":
      return "bg-[#FFF8DC] text-amber-900 border-l-4 border-amber-700";
    case "green":
      return "bg-[#E6F4EA] text-emerald-900 border-l-4 border-emerald-700";
  }
}
