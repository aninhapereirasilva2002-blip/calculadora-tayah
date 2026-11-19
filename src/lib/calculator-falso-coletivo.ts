/**
 * calculator-falso-coletivo.ts — lógica da calculadora pública de
 * FALSO COLETIVO (v3: teste dos 3 requisitos).
 *
 * As 3 primeiras perguntas testam os 3 requisitos objetivos usados pela
 * jurisprudência do STJ para caracterizar o falso coletivo:
 *   R1 — ausência de vínculo prévio com a empresa/entidade titular
 *   R2 — contrato com menos de 30 vidas
 *   R3 — reajuste incompatível com o teto da ANS para individuais
 *
 * Cada requisito recebe CUMPRIDO (1), PARCIAL (0,5) ou NÃO CUMPRIDO (0).
 * A soma (0 a 3, em passos de 0,5) define veredito e porcentagem.
 *
 * As perguntas 4 (mensalidade) e 5 (tempo de contrato) não afetam o
 * resultado: são guardadas para a análise interna (vão no email do lead).
 *
 * Compliance OAB: os textos falam em "chance"/"possibilidade", nunca em
 * garantia, e nunca citam valor de restituição em R$.
 *
 * Toda a regra fica aqui; os componentes só apresentam e /api/lead
 * recalcula o resultado no servidor.
 */

// ─────────────── Tipos das respostas ───────────────

export type Vinculo =
  | "clt"
  | "socio_outras_atividades"
  | "abriu_so_para_plano"
  | "nao_sei";

export type QtdVidas = "so_eu" | "de_2_a_29" | "30_ou_mais" | "nao_sei";

export type FaixaReajuste =
  | "ate_6"
  | "de_6_a_10"
  | "de_10_a_20"
  | "mais_20"
  | "nao_lembro";

export type TempoPlano = "menos_1" | "de_1_a_3" | "de_3_a_5" | "mais_5";

export interface RespostasFalsoColetivo {
  vinculo: Vinculo;
  vidas: QtdVidas;
  reajuste: FaixaReajuste;
  /** Em reais. Não afeta o resultado — só para análise interna. */
  mensalidade: number;
  tempo: TempoPlano;
}

export type StatusRequisito = "cumprido" | "parcial" | "nao_cumprido";

export type Veredito = "sim" | "provavelmente" | "dificilmente" | "nao";

// ─────────────── Opções das perguntas ───────────────

export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
}

/** P1 — Requisito 1 (vínculo prévio) */
export const OPCOES_VINCULO: Opcao<Vinculo>[] = [
  { id: "clt", rotulo: "Sim, trabalho lá com carteira assinada" },
  {
    id: "socio_outras_atividades",
    rotulo: "Sim, sou sócio dessa empresa (que tem outras atividades)",
  },
  {
    id: "abriu_so_para_plano",
    rotulo: "Não, abri a empresa/me associei só para conseguir o plano",
  },
  { id: "nao_sei", rotulo: "Não sei" },
];

/** P2 — Requisito 2 (vidas) */
export const OPCOES_VIDAS: Opcao<QtdVidas>[] = [
  { id: "so_eu", rotulo: "Só eu" },
  { id: "de_2_a_29", rotulo: "2 a 29 pessoas" },
  { id: "30_ou_mais", rotulo: "30 ou mais" },
  { id: "nao_sei", rotulo: "Não sei" },
];

/** P3 — Requisito 3 (reajuste) */
export const OPCOES_REAJUSTE: Opcao<FaixaReajuste>[] = [
  { id: "ate_6", rotulo: "Até 6%" },
  { id: "de_6_a_10", rotulo: "Entre 6% e 10%" },
  { id: "de_10_a_20", rotulo: "Entre 10% e 20%" },
  { id: "mais_20", rotulo: "Mais de 20%" },
  { id: "nao_lembro", rotulo: "Não lembro" },
];

/** P5 — tempo de contrato (não pontua) */
export const OPCOES_TEMPO: Opcao<TempoPlano>[] = [
  { id: "menos_1", rotulo: "Menos de 1 ano" },
  { id: "de_1_a_3", rotulo: "1 a 3 anos" },
  { id: "de_3_a_5", rotulo: "3 a 5 anos" },
  { id: "mais_5", rotulo: "Mais de 5 anos" },
];

/** P4 — limites aceitos para a mensalidade, em reais. */
export const MENSALIDADE_MIN = 100;
export const MENSALIDADE_MAX = 20000;

// ─────────────── Avaliação de cada requisito ───────────────

const STATUS_VINCULO: Record<Vinculo, StatusRequisito> = {
  abriu_so_para_plano: "cumprido",
  nao_sei: "parcial",
  clt: "nao_cumprido",
  socio_outras_atividades: "nao_cumprido",
};

const STATUS_VIDAS: Record<QtdVidas, StatusRequisito> = {
  so_eu: "cumprido",
  de_2_a_29: "cumprido",
  nao_sei: "parcial",
  "30_ou_mais": "nao_cumprido",
};

const STATUS_REAJUSTE: Record<FaixaReajuste, StatusRequisito> = {
  mais_20: "cumprido",
  de_10_a_20: "cumprido",
  de_6_a_10: "parcial",
  nao_lembro: "parcial",
  ate_6: "nao_cumprido",
};

export const PONTOS_STATUS: Record<StatusRequisito, number> = {
  cumprido: 1,
  parcial: 0.5,
  nao_cumprido: 0,
};

export const ROTULO_STATUS: Record<
  StatusRequisito,
  { icone: string; texto: string }
> = {
  cumprido: { icone: "✅", texto: "CUMPRIDO" },
  parcial: { icone: "⚠️", texto: "PARCIAL" },
  nao_cumprido: { icone: "❌", texto: "NÃO CUMPRIDO" },
};

/** Nome curto de cada requisito, usado no checklist. */
export const NOMES_REQUISITOS = [
  "Vínculo prévio ausente",
  "Menos de 30 vidas",
  "Reajuste incompatível",
] as const;

// ─────────────── Veredito e textos ───────────────

/**
 * Porcentagem por pontuação. Índice = pontos × 2 (0, 0,5, …, 3,0).
 *   0,0 → 5% · 0,5 → 20% · 1,0 → 35% · 1,5 → 60%
 *   2,0 → 70% · 2,5 → 85% · 3,0 → 90%
 */
const PERCENTUAL_POR_MEIO_PONTO = [5, 20, 35, 60, 70, 85, 90] as const;

export function vereditoPorPontos(pontos: number): Veredito {
  if (pontos >= 2.5) return "sim";
  if (pontos >= 1.5) return "provavelmente";
  if (pontos >= 0.5) return "dificilmente";
  return "nao";
}

export interface ApresentacaoVeredito {
  /** Palavra curta: SIM / PROVAVELMENTE / DIFICILMENTE / NÃO */
  rotulo: string;
  titulo: string;
  texto: string;
  cta: string;
  /** Cor da faixa (círculo, título). */
  cor: string;
  emoji: string;
}

export const APRESENTACAO: Record<Veredito, ApresentacaoVeredito> = {
  sim: {
    rotulo: "SIM",
    titulo: "SIM, seu plano é um FALSO COLETIVO",
    texto:
      "Pelas suas respostas, seu contrato apresenta os 3 requisitos reconhecidos pelo STJ para caracterização de falso coletivo. Nossa equipe pode fazer a análise jurídica individual e orientar como buscar a revisão dos valores pagos a maior nos últimos 3 anos.",
    cta: "FALE AGORA com nossa equipe para a análise jurídica",
    cor: "#9E2A2B",
    emoji: "🔴",
  },
  provavelmente: {
    rotulo: "PROVAVELMENTE",
    titulo: "PROVAVELMENTE seu plano é um FALSO COLETIVO",
    texto:
      "Seu contrato cumpre parcialmente os requisitos do falso coletivo. Uma análise jurídica individual pode confirmar o enquadramento e indicar o melhor caminho.",
    cta: "Converse com nossa equipe",
    cor: "#D97706",
    emoji: "🟡",
  },
  dificilmente: {
    rotulo: "DIFICILMENTE",
    titulo: "DIFICILMENTE seu plano é um FALSO COLETIVO",
    texto:
      "Seu contrato não apresenta os requisitos principais do falso coletivo. Mas podem existir outras irregularidades a serem analisadas — reajustes abusivos, negativas indevidas, cláusulas desproporcionais.",
    cta: "Converse com nossa equipe",
    cor: "#16A34A",
    emoji: "🟢",
  },
  nao: {
    rotulo: "NÃO",
    titulo: "NÃO há indicação de falso coletivo",
    texto:
      "Pelas suas respostas, seu plano não apresenta os requisitos do falso coletivo. Ainda assim, nossa equipe pode avaliar outras possibilidades de revisão do seu contrato.",
    cta: "Fale com nossa equipe para outras análises",
    cor: "#8A8D8F",
    emoji: "⚪",
  },
};

export const DISCLAIMER =
  "Este diagnóstico é preliminar e baseado apenas nas informações informadas. Não substitui análise jurídica individual.";

// ─────────────── Cálculo ───────────────

export interface RequisitoAvaliado {
  numero: 1 | 2 | 3;
  nome: string;
  status: StatusRequisito;
}

export interface ResultadoFalsoColetivo {
  requisitos: [RequisitoAvaliado, RequisitoAvaliado, RequisitoAvaliado];
  /** 0 a 3, em passos de 0,5. */
  pontos: number;
  /** 5 a 90. */
  percentual: number;
  veredito: Veredito;
}

export function calcularFalsoColetivo(
  r: Pick<RespostasFalsoColetivo, "vinculo" | "vidas" | "reajuste">,
): ResultadoFalsoColetivo {
  const requisitos: ResultadoFalsoColetivo["requisitos"] = [
    { numero: 1, nome: NOMES_REQUISITOS[0], status: STATUS_VINCULO[r.vinculo] },
    { numero: 2, nome: NOMES_REQUISITOS[1], status: STATUS_VIDAS[r.vidas] },
    {
      numero: 3,
      nome: NOMES_REQUISITOS[2],
      status: STATUS_REAJUSTE[r.reajuste],
    },
  ];
  const pontos = requisitos.reduce(
    (soma, req) => soma + PONTOS_STATUS[req.status],
    0,
  );
  return {
    requisitos,
    pontos,
    percentual: PERCENTUAL_POR_MEIO_PONTO[Math.round(pontos * 2)],
    veredito: vereditoPorPontos(pontos),
  };
}

// ─────────────── Utilitários ───────────────

export function rotuloDe<T extends string>(opcoes: Opcao<T>[], id: T): string {
  return opcoes.find((o) => o.id === id)?.rotulo ?? "—";
}

/** 1500 → "R$ 1.500,00" */
export function formatMoedaBR(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** 2.5 → "2,5" */
export function formatPontos(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
