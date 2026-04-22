"use client";

/**
 * Calculator.tsx — multi-step de 7 perguntas + captura de lead + resultado.
 *
 * Estado todo em useState (um objeto `dados` + o passo atual). Cada passo
 * é um pequeno componente inline que recebe apenas o que precisa, para
 * manter o arquivo auto-contido mas legível.
 *
 * Paleta (Manual de Identidade Visual Tayah):
 *  - bordo  #9E2A2B → CTAs, barra de progresso, destaques, semáforo forte
 *  - ink    #1A1A1A → títulos e texto principal
 *  - grey   #8A8D8F → bordas, textos auxiliares, placeholders
 *  - offwhite #FAFAF7 → fundo geral
 */

import { useState, useId, useMemo } from "react";
import {
  calcularDiagnostico,
  type DadosCalculadora,
  type Diagnostico,
  type TipoPlano,
} from "@/lib/calculator";

// ============================================================
// WhatsApp INSTITUCIONAL do escritório Tayah Advogados.
// Formato internacional E.164 sem o "+" (só dígitos). Este número
// está declarado no Manual de Identidade Visual do escritório.
// ============================================================
const WHATSAPP_TAYAH = "5521995322222";

const OPERADORAS = [
  "Amil",
  "Bradesco Saúde",
  "Unimed-Rio",
  "Unimed Nacional",
  "SulAmérica",
  "Porto Saúde",
  "Hapvida",
  "NotreDame Intermédica",
  "Golden Cross",
  "Outra",
] as const;

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Tipo que carrega os dados dos passos + os de contato (captura de lead).
interface EstadoForm extends Partial<DadosCalculadora> {
  nome?: string;
  email?: string;
  whatsapp?: string;
  aceitouPolitica?: boolean;
}

const ESTADO_INICIAL: EstadoForm = {
  idadeTitular: 50, // default sugerido pelo brief
};

const TOTAL_PASSOS = 8;

export default function Calculator() {
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<EstadoForm>(ESTADO_INICIAL);
  const [resultado, setResultado] = useState<Diagnostico | null>(null);

  // Atualiza um campo do estado (imutável).
  function atualizar<K extends keyof EstadoForm>(
    chave: K,
    valor: EstadoForm[K],
  ) {
    setDados((d) => ({ ...d, [chave]: valor }));
  }

  // Validação mínima por passo — controla o botão "Próximo".
  const podeAvancar = useMemo(() => {
    switch (passo) {
      case 1:
        return !!dados.tipoPlano;
      case 2:
        return !!dados.operadora;
      case 3:
        return (
          typeof dados.mensalidade === "number" &&
          dados.mensalidade >= 50 &&
          dados.mensalidade <= 50000
        );
      case 4:
        return (
          typeof dados.reajustePercentual === "number" &&
          dados.reajustePercentual >= 0 &&
          dados.reajustePercentual <= 100
        );
      case 5:
        return !!dados.mesReajuste && !!dados.anoReajuste;
      case 6:
        return (
          typeof dados.idadeTitular === "number" &&
          dados.idadeTitular >= 0 &&
          dados.idadeTitular <= 100
        );
      case 7:
        return !!dados.anoContratacao;
      case 8:
        return (
          !!dados.nome &&
          !!dados.email &&
          !!dados.whatsapp &&
          dados.whatsapp.replace(/\D/g, "").length >= 10 &&
          !!dados.aceitouPolitica
        );
      default:
        return false;
    }
  }, [passo, dados]);

  function avancar() {
    if (!podeAvancar) return;
    if (passo < TOTAL_PASSOS) {
      setPasso(passo + 1);
    } else {
      // Último passo: calcular diagnóstico e exibir resultado.
      const diag = calcularDiagnostico(dados as DadosCalculadora);
      setResultado(diag);
    }
  }

  function voltar() {
    if (passo > 1) setPasso(passo - 1);
  }

  function reiniciar() {
    setDados(ESTADO_INICIAL);
    setResultado(null);
    setPasso(1);
  }

  // -------- Renderização --------
  if (resultado) {
    return (
      <TelaResultado
        diagnostico={resultado}
        dados={dados as DadosCalculadora & { nome: string }}
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
          <Passo1TipoPlano
            valor={dados.tipoPlano}
            onChange={(v) => atualizar("tipoPlano", v)}
          />
        )}
        {passo === 2 && (
          <Passo2Operadora
            valor={dados.operadora}
            onChange={(v) => atualizar("operadora", v)}
          />
        )}
        {passo === 3 && (
          <Passo3Mensalidade
            valor={dados.mensalidade}
            onChange={(v) => atualizar("mensalidade", v)}
          />
        )}
        {passo === 4 && (
          <Passo4Reajuste
            valor={dados.reajustePercentual}
            onChange={(v) => atualizar("reajustePercentual", v)}
          />
        )}
        {passo === 5 && (
          <Passo5MesAno
            mes={dados.mesReajuste}
            ano={dados.anoReajuste}
            onMes={(v) => atualizar("mesReajuste", v)}
            onAno={(v) => atualizar("anoReajuste", v)}
          />
        )}
        {passo === 6 && (
          <Passo6Idade
            valor={dados.idadeTitular ?? 50}
            onChange={(v) => atualizar("idadeTitular", v)}
          />
        )}
        {passo === 7 && (
          <Passo7AnoContratacao
            valor={dados.anoContratacao}
            onChange={(v) => atualizar("anoContratacao", v)}
          />
        )}
        {passo === 8 && (
          <Passo8CapturaLead
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
   Passo 1 — Tipo de plano (4 cards radio)
   ============================================================ */
function Passo1TipoPlano({
  valor,
  onChange,
}: {
  valor?: TipoPlano;
  onChange: (v: TipoPlano) => void;
}) {
  const opcoes: { id: TipoPlano; titulo: string; desc: string }[] = [
    {
      id: "individual",
      titulo: "Individual / Familiar",
      desc: "Contratado diretamente com a operadora, em seu nome.",
    },
    {
      id: "coletivo_adesao",
      titulo: "Coletivo por Adesão",
      desc: "Contratado via associação, sindicato ou entidade de classe.",
    },
    {
      id: "coletivo_empresarial",
      titulo: "Coletivo Empresarial",
      desc: "Oferecido pela sua empresa como benefício.",
    },
    {
      id: "nao_sei",
      titulo: "Não tenho certeza",
      desc: "Tudo bem — seguiremos com uma análise genérica.",
    },
  ];
  return (
    <Pergunta titulo="Qual o tipo do seu plano de saúde?">
      <div
        role="radiogroup"
        aria-label="Tipo de plano"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {opcoes.map((op) => (
          <CardRadio
            key={op.id}
            selecionado={valor === op.id}
            onClick={() => onChange(op.id)}
            titulo={op.titulo}
            desc={op.desc}
          />
        ))}
      </div>
    </Pergunta>
  );
}

/* ============================================================
   Passo 2 — Operadora
   ============================================================ */
function Passo2Operadora({
  valor,
  onChange,
}: {
  valor?: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Pergunta titulo="Qual é a sua operadora?">
      <label htmlFor={id} className="sr-only">
        Operadora do plano
      </label>
      <select
        id={id}
        value={valor ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
      >
        <option value="">Selecione sua operadora…</option>
        {OPERADORAS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </Pergunta>
  );
}

/* ============================================================
   Passo 3 — Mensalidade atual (máscara R$)
   ============================================================ */
function Passo3Mensalidade({
  valor,
  onChange,
}: {
  valor?: number;
  onChange: (v: number | undefined) => void;
}) {
  const id = useId();
  // Formata 123456 → "1.234,56" (centavos implícitos).
  function formatar(centavos: number): string {
    const reais = centavos / 100;
    return reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const valorCentavos =
    typeof valor === "number" ? Math.round(valor * 100) : 0;
  const display = valor === undefined ? "" : formatar(valorCentavos);

  return (
    <Pergunta titulo="Qual o valor atual da sua mensalidade?">
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
          onChange={(e) => {
            const apenasDigitos = e.target.value.replace(/\D/g, "");
            if (apenasDigitos === "") {
              onChange(undefined);
              return;
            }
            const centavos = parseInt(apenasDigitos, 10);
            onChange(centavos / 100);
          }}
          placeholder="0,00"
          className="w-full pl-12 pr-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo text-lg"
        />
      </div>
      <p className="mt-2 text-xs text-grey">
        Valores aceitos entre R$ 50,00 e R$ 50.000,00.
      </p>
    </Pergunta>
  );
}

/* ============================================================
   Passo 4 — Percentual do último reajuste
   ============================================================ */
function Passo4Reajuste({
  valor,
  onChange,
}: {
  valor?: number;
  onChange: (v: number | undefined) => void;
}) {
  const id = useId();
  return (
    <Pergunta titulo="Qual o percentual do último reajuste aplicado?">
      <label htmlFor={id} className="sr-only">
        Percentual de reajuste
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          step={0.01}
          inputMode="decimal"
          value={valor ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? undefined : parseFloat(v));
          }}
          placeholder="Ex: 24,50"
          className="w-full pl-4 pr-12 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo text-lg"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-grey font-bold">
          %
        </span>
      </div>
      <p className="mt-2 text-xs text-grey">
        Você encontra esse valor no boleto ou no comunicado de reajuste.
      </p>
    </Pergunta>
  );
}

/* ============================================================
   Passo 5 — Mês e ano do reajuste
   ============================================================ */
function Passo5MesAno({
  mes,
  ano,
  onMes,
  onAno,
}: {
  mes?: number;
  ano?: number;
  onMes: (v: number) => void;
  onAno: (v: number) => void;
}) {
  const idMes = useId();
  const idAno = useId();
  const anos = [2021, 2022, 2023, 2024, 2025, 2026];
  return (
    <Pergunta titulo="Quando o reajuste foi aplicado?">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={idMes}
            className="block text-sm font-bold text-ink mb-1"
          >
            Mês
          </label>
          <select
            id={idMes}
            value={mes ?? ""}
            onChange={(e) => onMes(parseInt(e.target.value, 10))}
            className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
          >
            <option value="">Selecione…</option>
            {MESES.map((nome, i) => (
              <option key={nome} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={idAno}
            className="block text-sm font-bold text-ink mb-1"
          >
            Ano
          </label>
          <select
            id={idAno}
            value={ano ?? ""}
            onChange={(e) => onAno(parseInt(e.target.value, 10))}
            className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
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
    </Pergunta>
  );
}

/* ============================================================
   Passo 6 — Idade (slider + input espelhado)
   ============================================================ */
function Passo6Idade({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (v: number) => void;
}) {
  const idSlider = useId();
  const idInput = useId();

  function clampedSet(v: number) {
    if (Number.isNaN(v)) return;
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    onChange(clamped);
  }

  return (
    <Pergunta titulo="Qual a idade do titular do plano?">
      <div className="flex items-center gap-4">
        <label htmlFor={idSlider} className="sr-only">
          Idade (slider)
        </label>
        <input
          id={idSlider}
          type="range"
          min={0}
          max={100}
          value={valor}
          onChange={(e) => clampedSet(parseInt(e.target.value, 10))}
          className="flex-1 accent-bordo"
        />
        <label htmlFor={idInput} className="sr-only">
          Idade (número)
        </label>
        <input
          id={idInput}
          type="number"
          min={0}
          max={100}
          value={valor}
          onChange={(e) => clampedSet(parseInt(e.target.value, 10))}
          className="w-20 px-3 py-2 rounded-md border border-grey/50 bg-white text-ink text-center font-bold focus:border-bordo"
        />
        <span className="text-sm text-grey">anos</span>
      </div>
    </Pergunta>
  );
}

/* ============================================================
   Passo 7 — Ano de contratação
   ============================================================ */
function Passo7AnoContratacao({
  valor,
  onChange,
}: {
  valor?: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const anos: number[] = [];
  for (let a = 2026; a >= 1980; a--) anos.push(a);
  return (
    <Pergunta titulo="Em que ano você contratou o plano?">
      <label htmlFor={id} className="sr-only">
        Ano de contratação
      </label>
      <select
        id={id}
        value={valor ?? ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full px-4 py-3 rounded-md border border-grey/50 bg-white text-ink focus:border-bordo"
      >
        <option value="">Selecione o ano…</option>
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-grey">
        Contratos anteriores a 1999 (pré Lei 9.656/98) seguem regras
        específicas.
      </p>
    </Pergunta>
  );
}

/* ============================================================
   Passo 8 — Captura de lead
   ============================================================ */
function Passo8CapturaLead({
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
   Tela de resultado — semáforo, sinalizações, CTAs
   ============================================================ */
function TelaResultado({
  diagnostico,
  dados,
  onReiniciar,
}: {
  diagnostico: Diagnostico;
  dados: DadosCalculadora & { nome?: string };
  onReiniciar: () => void;
}) {
  const { nivel, sinalizacoes } = diagnostico;

  // Mapa de apresentação por nível. As cores do semáforo seguem a
  // convenção visual pedida (🟥/🟨/🟦 via emoji), mas os badges usam
  // a paleta institucional: vermelho Tayah para "forte", amarelo
  // com texto preto para "moderado", preto para "fraco".
  const apresentacao = {
    forte: {
      emoji: "🟥",
      titulo: "fortes",
      badge: "bg-bordo text-white",
    },
    moderado: {
      emoji: "🟨",
      titulo: "moderados",
      badge: "bg-yellow-500 text-ink",
    },
    fraco: {
      emoji: "🟦",
      titulo: "fracos",
      badge: "bg-ink text-offwhite",
    },
  }[nivel];

  // Monta mensagem pré-preenchida para o WhatsApp — tom institucional,
  // sem nome de pessoa física.
  const mensagemWpp = useMemo(() => {
    const linhas = [
      `Olá! Acabei de fazer a calculadora no site do Tayah Advogados e gostaria de conversar sobre o meu caso.`,
      ``,
      `Meu nome é ${dados.nome ?? "..."}.`,
      `O resultado indicou indícios *${apresentacao.titulo}* de abusividade.`,
      ``,
      `Dados do meu caso:`,
      `• Tipo de plano: ${rotuloTipo(dados.tipoPlano)}`,
      `• Operadora: ${dados.operadora}`,
      `• Último reajuste: ${dados.reajustePercentual}%`,
      `• Data do reajuste: ${String(dados.mesReajuste).padStart(2, "0")}/${dados.anoReajuste}`,
    ];
    return encodeURIComponent(linhas.join("\n"));
  }, [dados, apresentacao.titulo]);

  const linkWpp = `https://wa.me/${WHATSAPP_TAYAH}?text=${mensagemWpp}`;

  return (
    <div className="w-full max-w-2xl mx-auto animate-[var(--animate-fade-in)]">
      <div className="rounded-lg bg-white border border-grey/30 p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-5xl md:text-6xl leading-none" aria-hidden="true">
            {apresentacao.emoji}
          </div>
          <div>
            <span
              className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${apresentacao.badge}`}
            >
              Nível {nivel}
            </span>
            <h2 className="font-black text-2xl md:text-3xl text-ink mt-2 leading-tight">
              Detectamos indícios {apresentacao.titulo} de abusividade no seu
              caso.
            </h2>
          </div>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-grey mb-3">
          Sinalizações detectadas
        </h3>
        <ul className="space-y-3 mb-6">
          {sinalizacoes.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-bordo font-bold leading-6" aria-hidden="true">
                •
              </span>
              <span className="text-ink leading-6">{s}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-grey border-l-2 border-grey/40 pl-3 italic mb-6">
          Este diagnóstico é preliminar. A análise conclusiva depende de
          avaliação individual do contrato por advogado.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={linkWpp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-5 py-4 rounded-md bg-bordo text-white font-bold uppercase tracking-wide text-sm shadow-sm transition-colors hover:bg-bordo-dark"
          >
            Conversar pelo WhatsApp
          </a>
          <button
            type="button"
            onClick={onReiniciar}
            className="flex-1 px-5 py-4 rounded-md border-2 border-ink text-ink font-bold uppercase tracking-wide text-sm transition-colors hover:bg-ink hover:text-offwhite"
          >
            Refazer análise
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Componentes utilitários internos
   ============================================================ */
function Pergunta({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-black text-3xl md:text-4xl text-ink leading-tight mb-6">
        {titulo}
      </h2>
      {children}
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
  desc: string;
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
      <div className="font-bold text-ink mb-1">{titulo}</div>
      <div className="text-sm text-grey">{desc}</div>
    </button>
  );
}

function rotuloTipo(t: TipoPlano): string {
  switch (t) {
    case "individual":
      return "Individual / Familiar";
    case "coletivo_adesao":
      return "Coletivo por Adesão";
    case "coletivo_empresarial":
      return "Coletivo Empresarial";
    case "nao_sei":
      return "Não informado";
  }
}
