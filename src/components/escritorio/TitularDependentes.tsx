"use client";

/**
 * TitularDependentes — Seção 2.
 * Card do titular + lista dinâmica de dependentes (adicionar/remover).
 * Mostra avisos por idade: amarelo (>=59) e vermelho (>=60).
 */

import { useId } from "react";
import {
  novoId,
  parseDecimalBR,
  rotuloParentesco,
  type Parentesco,
  type Pessoa,
} from "@/lib/calculator-pro";

interface Props {
  titular: Pessoa;
  dependentes: Pessoa[];
  onTitular: (p: Pessoa) => void;
  onDependentes: (lista: Pessoa[]) => void;
}

const ROTULO = "block text-sm font-bold text-ink mb-1.5";
const INPUT =
  "w-full px-3.5 py-2.5 rounded-md border border-grey/40 bg-white text-ink focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

export default function TitularDependentes({
  titular,
  dependentes,
  onTitular,
  onDependentes,
}: Props) {
  function adicionarDependente() {
    onDependentes([
      ...dependentes,
      { id: novoId(), nome: "", idade: "", parentesco: "filho" },
    ]);
  }

  function atualizarDependente(id: string, parcial: Partial<Pessoa>) {
    onDependentes(
      dependentes.map((d) => (d.id === id ? { ...d, ...parcial } : d)),
    );
  }

  function removerDependente(id: string) {
    onDependentes(dependentes.filter((d) => d.id !== id));
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-grey/20 p-6 md:p-8">
      <h2 className="font-black text-xl md:text-2xl text-ink mb-1">
        2. Titular e dependentes
      </h2>
      <p className="text-sm text-grey mb-6">
        Idades importam para checagem do Estatuto do Idoso e Tema 952/STJ.
      </p>

      <CardPessoa
        pessoa={titular}
        titulo="Titular"
        onChange={(p) => onTitular(p)}
      />

      <div className="mt-4 space-y-4">
        {dependentes.map((d, i) => (
          <CardPessoa
            key={d.id}
            pessoa={d}
            titulo={`Dependente ${i + 1}`}
            permiteParentesco
            onChange={(p) => atualizarDependente(d.id, p)}
            onRemover={() => removerDependente(d.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={adicionarDependente}
        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-bordo hover:text-bordo-dark"
      >
        + Adicionar dependente
      </button>
    </section>
  );
}

function CardPessoa({
  pessoa,
  titulo,
  permiteParentesco = false,
  onChange,
  onRemover,
}: {
  pessoa: Pessoa;
  titulo: string;
  permiteParentesco?: boolean;
  onChange: (p: Pessoa) => void;
  onRemover?: () => void;
}) {
  const idNome = useId();
  const idIdade = useId();
  const idParent = useId();
  const idadeN = parseDecimalBR(pessoa.idade);

  function set<K extends keyof Pessoa>(chave: K, v: Pessoa[K]) {
    onChange({ ...pessoa, [chave]: v });
  }

  return (
    <div className="rounded-md border border-grey/30 bg-offwhite p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-ink text-sm uppercase tracking-wider">
          {titulo}
        </h3>
        {onRemover && (
          <button
            type="button"
            onClick={onRemover}
            className="text-xs font-bold text-grey hover:text-bordo uppercase tracking-wider"
          >
            Remover
          </button>
        )}
      </div>

      <div
        className={`grid grid-cols-1 ${
          permiteParentesco ? "md:grid-cols-3" : "md:grid-cols-2"
        } gap-3`}
      >
        <div>
          <label htmlFor={idNome} className={ROTULO}>
            Nome
          </label>
          <input
            id={idNome}
            type="text"
            value={pessoa.nome}
            onChange={(e) => set("nome", e.target.value)}
            className={INPUT}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={idIdade} className={ROTULO}>
            Idade
          </label>
          <input
            id={idIdade}
            type="number"
            min={0}
            max={120}
            inputMode="numeric"
            value={pessoa.idade}
            onChange={(e) => set("idade", e.target.value)}
            className={INPUT}
            placeholder="Anos"
          />
        </div>
        {permiteParentesco && (
          <div>
            <label htmlFor={idParent} className={ROTULO}>
              Parentesco
            </label>
            <select
              id={idParent}
              value={pessoa.parentesco ?? "outro"}
              onChange={(e) =>
                set("parentesco", e.target.value as Parentesco)
              }
              className={INPUT}
            >
              {(["conjuge", "filho", "pai", "mae", "outro"] as Parentesco[]).map(
                (p) => (
                  <option key={p} value={p}>
                    {rotuloParentesco(p)}
                  </option>
                ),
              )}
            </select>
          </div>
        )}
      </div>

      {Number.isFinite(idadeN) && idadeN >= 60 && (
        <div className="mt-3 rounded-md bg-[#F5E6E6] text-bordo px-3 py-2 text-sm font-bold">
          🟥 Estatuto do Idoso (Lei 10.741/03) veda reajuste por faixa
          etária após 60 anos.
        </div>
      )}
      {Number.isFinite(idadeN) && idadeN >= 59 && idadeN < 60 && (
        <div className="mt-3 rounded-md bg-[#FFF8DC] text-amber-900 px-3 py-2 text-sm font-bold">
          ⚠️ Faixa etária crítica — verificar se houve reajuste por mudança
          de faixa.
        </div>
      )}
    </div>
  );
}
