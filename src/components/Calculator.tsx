"use client";

/**
 * Calculator.tsx — calculadora pública de FALSO COLETIVO (v3).
 *
 * Fluxo: 5 perguntas → captura de lead → resultado.
 *  - P1, P2, P3 testam os 3 requisitos do falso coletivo
 *  - P4 (mensalidade) e P5 (tempo) são dados adicionais para a equipe
 *
 * Regra em calculator-falso-coletivo.ts; tela final em
 * ResultadoFalsoColetivo.tsx. Aqui ficam só as perguntas e o lead.
 *
 * Paleta (Manual de Identidade Visual Tayah):
 *  - bordo  #9E2A2B → CTAs, barra de progresso, destaques
 *  - ink    #1A1A1A → títulos e texto principal
 *  - grey   #8A8D8F → bordas, textos auxiliares, placeholders
 *  - offwhite #FAFAF7 → fundo geral
 */

import { useId, useMemo, useRef, useState } from "react";
import {
  MENSALIDADE_MAX,
  MENSALIDADE_MIN,
  OPCOES_REAJUSTE,
  OPCOES_TEMPO,
  OPCOES_VIDAS,
  OPCOES_VINCULO,
  calcularFalsoColetivo,
  formatMoedaBR,
  type FaixaReajuste,
  type Opcao,
  type QtdVidas,
  type RespostasFalsoColetivo,
  type ResultadoFalsoColetivo,
  type TempoPlano,
  type Vinculo,
} from "@/lib/calculator-falso-coletivo";
import ResultadoFalsoColetivoTela from "@/components/ResultadoFalsoColetivo";

interface EstadoForm extends Partial<RespostasFalsoColetivo> {
  nome?: string;
  email?: string;
  whatsapp?: string;
  aceitouPolitica?: boolean;
}

const TOTAL_PASSOS = 6; // 5 perguntas + captura de lead

export default function Calculator() {
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<EstadoForm>({});
  const [resultado, setResultado] = useState<ResultadoFalsoColetivo | null>(
    null,
  );

  function atualizar<K extends keyof EstadoForm>(
    chave: K,
    valor: EstadoForm[K],
  ) {
    setDados((d) => ({ ...d, [chave]: valor }));
  }

  const podeAvancar = useMemo(() => {
    switch (passo) {
      case 1:
        return !!dados.vinculo;
      case 2:
        return !!dados.vidas;
      case 3:
        return !!dados.reajuste;
      case 4:
        return (
          typeof dados.mensalidade === "number" &&
          dados.mensalidade >= MENSALIDADE_MIN &&
          dados.mensalidade <= MENSALIDADE_MAX
        );
      case 5:
        return !!dados.tempo;
      case 6:
        return (
          !!dados.nome?.trim() &&
          !!dados.email?.trim() &&
          !!dados.whatsapp &&
          dados.whatsapp.replace(/\D/g, "").length >= 10 &&
          !!dados.aceitouPolitica
        );
      default:
        return false;
    }
  }, [passo, dados]);

  // Guarda contra duplo-disparo da notificação de lead. Resetado em
  // reiniciar() para que um novo preenchimento também notifique.
  const leadEnviadoRef = useRef(false);

  function avancar() {
    if (!podeAvancar) return;
    if (passo < TOTAL_PASSOS) {
      setPasso(passo + 1);
      return;
    }
    const respostas = dados as RespostasFalsoColetivo;
    const res = calcularFalsoColetivo(respostas);
    // Fire-and-forget: a UX do cliente não depende do envio do email.
    if (!leadEnviadoRef.current) {
      leadEnviadoRef.current = true;
      enviarLead(dados, respostas).catch((err) => {
        console.error("Falha ao notificar lead:", err);
      });
    }
    setResultado(res);
  }

  function voltar() {
    if (passo > 1) setPasso(passo - 1);
  }

  function reiniciar() {
    setDados({});
    setResultado(null);
    setPasso(1);
    leadEnviadoRef.current = false;
  }

  if (resultado) {
    return (
      <ResultadoFalsoColetivoTela
        resultado={resultado}
        dados={dados as RespostasFalsoColetivo & { nome?: string }}
        onReiniciar={reiniciar}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <BarraProgresso passoAtual={passo} total={TOTAL_PASSOS} />

      {/* key força remontagem para disparar a animação fade entre passos */}
      <div
        key={passo}
        className="mt-8 animate-[var(--animate-fade-in)]"
        role="region"
        aria-label={`Passo ${passo} de ${TOTAL_PASSOS}`}
      >
        {passo === 1 && (
          <PerguntaRadio<Vinculo>
            rotuloVisual="Vínculo com a empresa"
            titulo="Você já tinha vínculo com a empresa titular do plano antes de contratá-lo?"
            opcoes={OPCOES_VINCULO}
            valor={dados.vinculo}
            onChange={(v) => atualizar("vinculo", v)}
          />
        )}
        {passo === 2 && (
          <PerguntaRadio<QtdVidas>
            rotuloVisual="Tamanho do contrato"
            titulo="Quantas pessoas estão nesse contrato?"
            opcoes={OPCOES_VIDAS}
            valor={dados.vidas}
            onChange={(v) => atualizar("vidas", v)}
            colunas={2}
          />
        )}
        {passo === 3 && (
          <PerguntaRadio<FaixaReajuste>
            rotuloVisual="Percentual do reajuste"
            titulo="Qual o percentual do último reajuste anual aplicado?"
            opcoes={OPCOES_REAJUSTE}
            valor={dados.reajuste}
            onChange={(v) => atualizar("reajuste", v)}
          />
        )}
        {passo === 4 && (
          <PassoMensalidade
            valor={dados.mensalidade}
            onChange={(v) => atualizar("mensalidade", v)}
          />
        )}
        {passo === 5 && (
          <PerguntaRadio<TempoPlano>
            rotuloVisual="Tempo de contrato"
            titulo="Há quanto tempo você tem esse plano?"
            opcoes={OPCOES_TEMPO}
            valor={dados.tempo}
            onChange={(v) => atualizar("tempo", v)}
            colunas={2}
          />
        )}
        {passo === 6 && (
          <PassoCapturaLead
            dados={dados}
            onNome={(v) => atualizar("nome", v)}
            onEmail={(v) => atualizar("email", v)}
            onWhatsapp={(v) => atualizar("whatsapp", v)}
            onAceite={(v) => atualizar("aceitouPolitica", v)}
          />
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={voltar}
          disabled={passo === 1}
          className="px-5 py-3 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={avancar}
          disabled={!podeAvancar}
          className="px-6 py-3 rounded-md bg-bordo text-white font-bold uppercase tracking-wide text-sm shadow-sm transition-colors hover:bg-bordo-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {passo === TOTAL_PASSOS ? "Ver meu diagnóstico" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Barra de progresso — trilho cinza, preenchimento vermelho Tayah.
   ============================================================ */
function BarraProgresso({
  passoAtual,
  total,
}: {
  passoAtual: number;
  total: number;
}) {
  const pct = Math.round((passoAtual / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-grey mb-2">
        <span>
          Passo {passoAtual} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-grey/25 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-bordo transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Cabeçalho de pergunta: rótulo visual (caixa alta, vermelho) +
   pergunta em destaque.
   ============================================================ */
function CabecalhoPergunta({
  rotuloVisual,
  titulo,
}: {
  rotuloVisual: string;
  titulo: string;
}) {
  return (
    <>
      <p className="text-xs md:text-sm uppercase tracking-[0.18em] font-bold text-bordo mb-2">
        {rotuloVisual}
      </p>
      <h2 className="font-black text-2xl md:text-4xl text-ink leading-tight mb-6">
        {titulo}
      </h2>
    </>
  );
}

/* ============================================================
   Pergunta genérica de múltipla escolha (cards radio).
   ============================================================ */
function PerguntaRadio<T extends string>({
  rotuloVisual,
  titulo,
  opcoes,
  valor,
  onChange,
  colunas = 1,
}: {
  rotuloVisual: string;
  titulo: string;
  opcoes: Opcao<T>[];
  valor?: T;
  onChange: (v: T) => void;
  colunas?: 1 | 2;
}) {
  return (
    <div>
      <CabecalhoPergunta rotuloVisual={rotuloVisual} titulo={titulo} />
      <div
        role="radiogroup"
        aria-label={titulo}
        className={`grid grid-cols-1 gap-3 ${
          colunas === 2 ? "md:grid-cols-2" : ""
        }`}
      >
        {opcoes.map((op) => (
          <CardRadio
            key={op.id}
            selecionado={valor === op.id}
            onClick={() => onChange(op.id)}
            titulo={op.rotulo}
          />
        ))}
      </div>
    </div>
  );
}

function CardRadio({
  selecionado,
  onClick,
  titulo,
}: {
  selecionado: boolean;
  onClick: () => void;
  titulo: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={onClick}
      className={`text-left p-4 rounded-md border-2 transition-all ${
        selecionado
          ? "border-bordo bg-bordo/5"
          : "border-grey/40 bg-white hover:border-bordo/60"
      }`}
    >
      <div className="font-bold text-ink">{titulo}</div>
    </button>
  );
}

/* ============================================================
   Passo 4 — Mensalidade (máscara R$ em tempo real, centavos
   implícitos: digitar 150000 → R$ 1.500,00)
   ============================================================ */
function PassoMensalidade({
  valor,
  onChange,
}: {
  valor?: number;
  onChange: (v: number | undefined) => void;
}) {
  const id = useId();
  const idAjuda = useId();
  const display =
    valor === undefined
      ? ""
      : valor.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const foraDaFaixa =
    typeof valor === "number" &&
    (valor < MENSALIDADE_MIN || valor > MENSALIDADE_MAX);

  return (
    <div>
      <CabecalhoPergunta
        rotuloVisual="Mensalidade atual"
        titulo="Qual o valor atual da sua mensalidade?"
      />
      <label htmlFor={id} className="sr-only">
        Valor da mensalidade em reais
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grey font-bold">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          aria-describedby={idAjuda}
          aria-invalid={foraDaFaixa}
          onChange={(e) => {
            // Aceita só dígitos; limita a 9 para não estourar a máscara.
            const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
            onChange(digitos === "" ? undefined : parseInt(digitos, 10) / 100);
          }}
          placeholder="0,00"
          className={`w-full pl-12 pr-4 py-3 rounded-md border bg-white text-ink text-lg focus:border-bordo ${
            foraDaFaixa ? "border-bordo" : "border-grey/50"
          }`}
        />
      </div>
      <p
        id={idAjuda}
        className={`mt-2 text-xs ${foraDaFaixa ? "text-bordo font-bold" : "text-grey"}`}
      >
        Valores aceitos entre {formatMoedaBR(MENSALIDADE_MIN)} e{" "}
        {formatMoedaBR(MENSALIDADE_MAX)}.
      </p>
    </div>
  );
}

/* ============================================================
   Passo 6 — Captura de lead
   ============================================================ */
function PassoCapturaLead({
  dados,
  onNome,
  onEmail,
  onWhatsapp,
  onAceite,
}: {
  dados: EstadoForm;
  onNome: (v: string) => void;
  onEmail: (v: string) => void;
  onWhatsapp: (v: string) => void;
  onAceite: (v: boolean) => void;
}) {
  const idNome = useId();
  const idEmail = useId();
  const idWpp = useId();
  const idAceite = useId();

  function mascararWhatsapp(valor: string): string {
    const d = valor.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  return (
    <div>
      <h2 className="font-black text-3xl md:text-4xl text-ink leading-tight mb-2">
        Para ver seu diagnóstico preliminar, informe seus dados:
      </h2>
      <p className="text-grey mb-6">
        Usamos apenas para enviar sua análise e retomar contato, se você
        autorizar. Nada de spam.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor={idNome} className="block text-sm font-bold text-ink mb-1">
            Nome completo
          </label>
          <input
            id={idNome}
            type="text"
            value={dados.nome ?? ""}
            onChange={(e) => onNome(e.target.value)}
            className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor={idEmail} className="block text-sm font-bold text-ink mb-1">
            E-mail
          </label>
          <input
            id={idEmail}
            type="email"
            value={dados.email ?? ""}
            onChange={(e) => onEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor={idWpp} className="block text-sm font-bold text-ink mb-1">
            WhatsApp (com DDD)
          </label>
          <input
            id={idWpp}
            type="tel"
            value={dados.whatsapp ?? ""}
            onChange={(e) => onWhatsapp(mascararWhatsapp(e.target.value))}
            placeholder="(21) 99999-9999"
            className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
            autoComplete="tel"
          />
        </div>
        <div className="flex items-start gap-2 pt-2">
          <input
            id={idAceite}
            type="checkbox"
            checked={!!dados.aceitouPolitica}
            onChange={(e) => onAceite(e.target.checked)}
            className="mt-1 w-4 h-4 accent-bordo"
          />
          <label htmlFor={idAceite} className="text-sm text-grey">
            Li e aceito a{" "}
            <a href="#" className="text-bordo underline">
              Política de Privacidade
            </a>{" "}
            e autorizo o contato pela Tayah Advogados.
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Envia as respostas + contato para /api/lead, que recalcula o
 * resultado no servidor e dispara o email para a equipe.
 * Fire-and-forget: falhas só vão pro console.
 */
async function enviarLead(
  form: EstadoForm,
  respostas: RespostasFalsoColetivo,
): Promise<void> {
  const payload = {
    nome: form.nome?.trim() ?? "",
    email: form.email?.trim() ?? "",
    whatsapp: form.whatsapp ?? "",
    respostas: {
      vinculo: respostas.vinculo,
      vidas: respostas.vidas,
      reajuste: respostas.reajuste,
      mensalidade: respostas.mensalidade,
      tempo: respostas.tempo,
    },
  };

  const res = await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // Mantém pendente mesmo se a aba ficar em background.
    keepalive: true,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`POST /api/lead falhou (${res.status}): ${txt}`);
  }
}
