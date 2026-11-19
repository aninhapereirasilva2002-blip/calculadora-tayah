"use client";

/**
 * Calculator.tsx — calculadora pública de indícios de FALSO COLETIVO.
 *
 * Fluxo: 4 perguntas de múltipla escolha → captura de lead → resultado
 * (3 cenários). Sem valores em R$ e sem promessa de resultado
 * (compliance OAB). Regra de pontuação em calculator-falso-coletivo.ts.
 *
 * Paleta (Manual de Identidade Visual Tayah):
 *  - bordo  #9E2A2B → CTAs, barra de progresso, destaques
 *  - ink    #1A1A1A → títulos e texto principal
 *  - grey   #8A8D8F → bordas, textos auxiliares, placeholders
 *  - offwhite #FAFAF7 → fundo geral
 */

import { useId, useMemo, useRef, useState } from "react";
import {
  APRESENTACAO,
  OPCOES_ENTRADA,
  OPCOES_REAJUSTE,
  OPCOES_TIPO_PLANO,
  OPCOES_VIDAS,
  calcularFalsoColetivo,
  rotuloDe,
  type FormaEntrada,
  type NivelIndicio,
  type Opcao,
  type QtdVidas,
  type ReajusteAlto,
  type RespostasFalsoColetivo,
  type ResultadoFalsoColetivo,
  type TipoPlanoFC,
} from "@/lib/calculator-falso-coletivo";
import { linkWhatsapp } from "@/lib/contato";

interface EstadoForm extends Partial<RespostasFalsoColetivo> {
  nome?: string;
  email?: string;
  whatsapp?: string;
  aceitouPolitica?: boolean;
}

const TOTAL_PASSOS = 5; // 4 perguntas + captura de lead

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
        return !!dados.tipoPlano;
      case 2:
        return !!dados.vidas;
      case 3:
        return !!dados.entrada;
      case 4:
        return !!dados.reajuste;
      case 5:
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
      <TelaResultado
        nivel={resultado.nivel}
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
          <PerguntaRadio<TipoPlanoFC>
            titulo="Qual o tipo do seu plano de saúde?"
            opcoes={OPCOES_TIPO_PLANO}
            valor={dados.tipoPlano}
            onChange={(v) => atualizar("tipoPlano", v)}
            colunas={2}
          />
        )}
        {passo === 2 && (
          <PerguntaRadio<QtdVidas>
            titulo="Quantas pessoas estão nesse contrato?"
            opcoes={OPCOES_VIDAS}
            valor={dados.vidas}
            onChange={(v) => atualizar("vidas", v)}
          />
        )}
        {passo === 3 && (
          <PerguntaRadio<FormaEntrada>
            titulo="Como você entrou nesse plano?"
            opcoes={OPCOES_ENTRADA}
            valor={dados.entrada}
            onChange={(v) => atualizar("entrada", v)}
          />
        )}
        {passo === 4 && (
          <PerguntaRadio<ReajusteAlto>
            titulo="O reajuste anual costuma ser acima de 15%?"
            opcoes={OPCOES_REAJUSTE}
            valor={dados.reajuste}
            onChange={(v) => atualizar("reajuste", v)}
          />
        )}
        {passo === 5 && (
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
   Pergunta genérica de múltipla escolha (cards radio).
   ============================================================ */
function PerguntaRadio<T extends string>({
  titulo,
  opcoes,
  valor,
  onChange,
  colunas = 1,
}: {
  titulo: string;
  opcoes: Opcao<T>[];
  valor?: T;
  onChange: (v: T) => void;
  colunas?: 1 | 2;
}) {
  return (
    <div>
      <h2 className="font-black text-3xl md:text-4xl text-ink leading-tight mb-6">
        {titulo}
      </h2>
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
            desc={op.desc}
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
  desc,
}: {
  selecionado: boolean;
  onClick: () => void;
  titulo: string;
  desc?: string;
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
      {desc && <div className="mt-1 text-sm text-grey">{desc}</div>}
    </button>
  );
}

/* ============================================================
   Passo 5 — Captura de lead
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

/* ============================================================
   Tela de resultado — 3 cenários. Tom cuidadoso (compliance OAB):
   sem R$, sem promessa de resultado.
   ============================================================ */
const ESTILO_NIVEL: Record<
  NivelIndicio,
  { fundo: string; borda: string; titulo: string }
> = {
  fortes: {
    fundo: "bg-[#FFF1F1]",
    borda: "border-bordo/60",
    titulo: "text-bordo",
  },
  alguns: {
    fundo: "bg-[#FFF8EB]",
    borda: "border-[#D97706]/60",
    titulo: "text-[#B45309]",
  },
  nenhum: {
    fundo: "bg-[#F0FAF3]",
    borda: "border-emerald-600/50",
    titulo: "text-emerald-800",
  },
};

function TelaResultado({
  nivel,
  dados,
  onReiniciar,
}: {
  nivel: NivelIndicio;
  dados: RespostasFalsoColetivo & { nome?: string };
  onReiniciar: () => void;
}) {
  const ap = APRESENTACAO[nivel];
  const estilo = ESTILO_NIVEL[nivel];

  // Mensagem pré-preenchida para o WhatsApp (sem valores, sem promessa).
  const linkWpp = useMemo(() => {
    const linhas = [
      `Olá! Fiz a calculadora de falso coletivo no site do Tayah Advogados e gostaria de uma análise do meu caso.`,
      ``,
      `Meu nome é ${dados.nome?.trim() || "..."}.`,
      `Resultado: *${ap.rotulo}*.`,
      ``,
      `Minhas respostas:`,
      `• Tipo de plano: ${rotuloDe(OPCOES_TIPO_PLANO, dados.tipoPlano)}`,
      `• Pessoas no contrato: ${rotuloDe(OPCOES_VIDAS, dados.vidas)}`,
      `• Como entrei no plano: ${rotuloDe(OPCOES_ENTRADA, dados.entrada)}`,
      `• Reajuste acima de 15%: ${rotuloDe(OPCOES_REAJUSTE, dados.reajuste)}`,
    ];
    return linkWhatsapp(linhas.join("\n"));
  }, [dados, ap.rotulo]);

  const ctaGrande = nivel === "fortes";

  return (
    <div className="w-full max-w-3xl mx-auto animate-[var(--animate-fade-in)] space-y-6">
      {/* Diagnóstico */}
      <div
        className={`rounded-xl border ${estilo.fundo} ${estilo.borda} p-6 md:p-8 shadow-sm`}
      >
        <div className="text-4xl md:text-5xl leading-none" aria-hidden="true">
          {ap.emoji}
        </div>
        <h3
          className={`mt-4 font-black text-2xl md:text-3xl leading-tight ${estilo.titulo}`}
        >
          {ap.titulo}
        </h3>
        <p className="mt-4 text-ink text-base md:text-lg leading-relaxed">
          {ap.texto}
        </p>

        <a
          href={linkWpp}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-6 block text-center rounded-md bg-[#25D366] text-white font-bold shadow-md hover:bg-[#20bd5a] transition-colors ${
            ctaGrande
              ? "px-6 py-6 text-lg md:text-xl"
              : "px-6 py-5 text-base md:text-lg"
          }`}
        >
          💬 {ap.cta}
        </a>
        <p className="mt-3 text-center text-sm text-grey">
          WhatsApp (21) 99891-7757
        </p>
      </div>

      {/* Por que falar com o Tayah */}
      <div className="rounded-xl bg-white border border-grey/30 p-6 md:p-8 shadow-sm">
        <h3 className="font-black text-xl md:text-2xl text-ink">
          Por que falar com o Tayah Advogados?
        </h3>
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ItemPorQue icone="⚖️" texto="60 anos de tradição" />
          <ItemPorQue icone="🩺" texto="Especialistas em Direito da Saúde" />
          <ItemPorQue icone="🤝" texto="Análise sem compromisso" />
        </ul>
      </div>

      <p className="text-xs text-grey leading-relaxed text-center max-w-2xl mx-auto">
        Este resultado é uma triagem preliminar e informativa, baseada apenas
        nas respostas fornecidas. Não constitui parecer jurídico nem garantia
        de resultado. A confirmação depende de análise individual do contrato
        e dos documentos.
      </p>

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

/**
 * Envia as respostas + contato para /api/lead, que recalcula a
 * pontuação no servidor e dispara o email para a equipe.
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
      tipoPlano: respostas.tipoPlano,
      vidas: respostas.vidas,
      entrada: respostas.entrada,
      reajuste: respostas.reajuste,
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
