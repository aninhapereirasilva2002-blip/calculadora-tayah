"use client";

/**
 * CalculadoraPro — orquestrador da calculadora técnica completa
 * (uso interno, /escritorio).
 *
 * Mantém todo o estado em useState (objeto único `caso`) e re-calcula
 * o Resultado via useMemo a cada mudança. Cada seção é um componente
 * controlado em src/components/escritorio/.
 *
 * Persistência local: rascunhos vão para localStorage com chave
 * `tayah:caso:<id>`. Sem backend; é apenas para a equipe não perder
 * dados ao recarregar a aba.
 */

import { useMemo, useState } from "react";
import {
  computeResultado,
  estadoInicial,
  novoId,
  type CasoEstado,
  type DadosCliente,
  type Mensalidade as MensalidadeT,
  type Pessoa,
  type Reajuste,
} from "@/lib/calculator-pro";
import DadosClienteSec from "./DadosCliente";
import TitularDependentes from "./TitularDependentes";
import Mensalidade from "./Mensalidade";
import HistoricoReajustes from "./HistoricoReajustes";
import ResultadoAnalise from "./ResultadoAnalise";

const STORAGE_KEY_PREFIX = "tayah:caso:";

export default function CalculadoraPro() {
  const [caso, setCaso] = useState<CasoEstado>(() => estadoInicial());
  const [toast, setToast] = useState<string | null>(null);

  const resultado = useMemo(() => computeResultado(caso), [caso]);

  function setCliente(v: DadosCliente) {
    setCaso((c) => ({ ...c, cliente: v }));
  }
  function setTitular(v: Pessoa) {
    setCaso((c) => ({ ...c, titular: v }));
  }
  function setDependentes(v: Pessoa[]) {
    setCaso((c) => ({ ...c, dependentes: v }));
  }
  function setMensalidade(v: MensalidadeT) {
    setCaso((c) => ({ ...c, mensalidade: v }));
  }
  function setReajustes(v: Reajuste[]) {
    setCaso((c) => ({ ...c, reajustes: v }));
  }

  function limparTudo() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Apagar todos os dados preenchidos? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }
    setCaso(estadoInicial());
    mostrarToast("Formulário limpo.");
  }

  function salvarCaso() {
    if (typeof window === "undefined") return;
    const id = novoId();
    const payload = {
      id,
      timestamp: new Date().toISOString(),
      caso,
    };
    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${id}`,
        JSON.stringify(payload),
      );
      const hh = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      mostrarToast(`Caso salvo às ${hh} (id ${id.slice(0, 8)}…).`);
    } catch {
      mostrarToast("Não foi possível salvar (localStorage indisponível).");
    }
  }

  function gerarPDF() {
    if (typeof window !== "undefined") {
      window.alert("Função do Sprint 4 — em breve.");
    }
  }

  function mostrarToast(texto: string) {
    setToast(texto);
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 md:px-0 py-10 md:py-14 space-y-6">
      <header className="mb-2">
        <h1 className="font-black text-3xl md:text-4xl text-ink leading-tight">
          Calculadora Técnica Completa
        </h1>
        <p className="mt-2 text-grey md:text-lg">
          Análise detalhada de reajustes para uso interno do escritório.
        </p>
      </header>

      <DadosClienteSec valor={caso.cliente} onChange={setCliente} />

      <TitularDependentes
        titular={caso.titular}
        dependentes={caso.dependentes}
        onTitular={setTitular}
        onDependentes={setDependentes}
      />

      <Mensalidade
        valor={caso.mensalidade}
        totalPessoas={1 + caso.dependentes.length}
        qtdDependentes={caso.dependentes.length}
        onChange={setMensalidade}
      />

      <HistoricoReajustes
        reajustes={caso.reajustes}
        onChange={setReajustes}
      />

      <ResultadoAnalise estado={caso} resultado={resultado} />

      {/* Seção 6 — Ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={limparTudo}
          className="px-5 py-3 rounded-md bg-grey/15 text-ink font-bold uppercase tracking-wide text-sm hover:bg-grey/25 transition-colors"
        >
          Limpar tudo
        </button>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <button
            type="button"
            onClick={salvarCaso}
            className="px-5 py-3 rounded-md bg-grey/15 text-ink font-bold uppercase tracking-wide text-sm hover:bg-grey/25 transition-colors"
          >
            Salvar caso (rascunho)
          </button>
          <button
            type="button"
            onClick={gerarPDF}
            className="px-6 py-3 rounded-md bg-bordo text-white font-bold uppercase tracking-wide text-sm shadow-sm hover:bg-bordo-dark transition-colors"
          >
            Gerar parecer em PDF
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-3 rounded-md shadow-lg text-sm z-50"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
