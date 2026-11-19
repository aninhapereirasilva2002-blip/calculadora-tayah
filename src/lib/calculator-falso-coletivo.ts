/**
 * calculator-falso-coletivo.ts — lógica da calculadora pública de
 * FALSO COLETIVO (v2: porcentagem de chance).
 *
 * 6 perguntas → pontos (soma máxima = 100) → porcentagem 0–100% →
 * 3 faixas (alta / moderada / baixa).
 *
 * A mensalidade (P5) tem peso 0: não afeta a porcentagem, só é
 * guardada para a análise interna da equipe (vai no email do lead).
 *
 * Compliance OAB: os textos falam em "chance", nunca em garantia, e
 * nunca citam valor em R$ a receber.
 *
 * Toda a regra fica aqui; Calculator.tsx é só apresentação e
 * /api/lead reutiliza os rótulos e recalcula a porcentagem no servidor.
 */

// ─────────────── Tipos das respostas ───────────────

export type TipoPlanoFC =
  | "coletivo_empresarial"
  | "coletivo_adesao"
  | "individual"
  | "nao_sei";

export type QtdVidas = "so_eu" | "de_2_a_29" | "30_ou_mais";

export type FormaEntrada =
  | "clt"
  | "abriu_empresa"
  | "associou_entidade"
  | "outro";

export type ReajusteAlto = "sim" | "nao" | "varia";

export type TempoPlano =
  | "menos_1"
  | "de_1_a_3"
  | "de_3_a_5"
  | "mais_5";

export interface RespostasFalsoColetivo {
  tipoPlano: TipoPlanoFC;
  vidas: QtdVidas;
  entrada: FormaEntrada;
  reajuste: ReajusteAlto;
  /** Em reais. Peso 0 — só para análise interna. */
  mensalidade: number;
  tempo: TempoPlano;
}

export type NivelChance = "alta" | "moderada" | "baixa";

// ─────────────── Opções (rótulo + pontos) ───────────────

export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
  desc?: string;
  pontos: number;
}

/** P1 — peso 25 */
export const OPCOES_TIPO_PLANO: Opcao<TipoPlanoFC>[] = [
  {
    id: "coletivo_empresarial",
    rotulo: "Coletivo Empresarial",
    desc: "Contratado por uma empresa/CNPJ.",
    pontos: 25,
  },
  {
    id: "coletivo_adesao",
    rotulo: "Coletivo por Adesão",
    desc: "Por associação ou sindicato.",
    pontos: 15,
  },
  {
    id: "individual",
    rotulo: "Individual/Familiar",
    desc: "Contratado diretamente com a operadora, em seu nome.",
    pontos: 0,
  },
  {
    id: "nao_sei",
    rotulo: "Não sei",
    desc: "Tudo bem — consideramos isso na análise.",
    pontos: 10,
  },
];

/** P2 — peso 25 */
export const OPCOES_VIDAS: Opcao<QtdVidas>[] = [
  { id: "so_eu", rotulo: "Só eu", pontos: 25 },
  { id: "de_2_a_29", rotulo: "2 a 29 pessoas", pontos: 20 },
  { id: "30_ou_mais", rotulo: "30 ou mais", pontos: 0 },
];

/** P3 — peso 30 */
export const OPCOES_ENTRADA: Opcao<FormaEntrada>[] = [
  {
    id: "clt",
    rotulo: "Pela empresa onde trabalho com carteira assinada",
    pontos: 0,
  },
  {
    id: "abriu_empresa",
    rotulo: "Abri uma empresa (MEI ou PJ) para conseguir o plano",
    pontos: 30,
  },
  {
    id: "associou_entidade",
    rotulo: "Me associei a uma entidade só para ter o plano",
    pontos: 25,
  },
  { id: "outro", rotulo: "Outro jeito", pontos: 15 },
];

/** P4 — peso 15 */
export const OPCOES_REAJUSTE: Opcao<ReajusteAlto>[] = [
  { id: "sim", rotulo: "Sim", pontos: 15 },
  { id: "nao", rotulo: "Não", pontos: 0 },
  { id: "varia", rotulo: "Varia muito", pontos: 8 },
];

/** P6 — peso 5 */
export const OPCOES_TEMPO: Opcao<TempoPlano>[] = [
  { id: "menos_1", rotulo: "Menos de 1 ano", pontos: 1 },
  { id: "de_1_a_3", rotulo: "1 a 3 anos", pontos: 3 },
  { id: "de_3_a_5", rotulo: "3 a 5 anos", pontos: 5 },
  { id: "mais_5", rotulo: "Mais de 5 anos", pontos: 5 },
];

/** Soma dos pesos (25 + 25 + 30 + 15 + 0 + 5). */
export const PONTUACAO_MAXIMA = 100;

/** P5 — limites aceitos para a mensalidade, em reais. */
export const MENSALIDADE_MIN = 100;
export const MENSALIDADE_MAX = 20000;

// ─────────────── Textos dos 3 cenários ───────────────

export interface ApresentacaoNivel {
  emoji: string;
  rotulo: string;
  titulo: string;
  texto: string;
  cta: string;
}

export const APRESENTACAO: Record<NivelChance, ApresentacaoNivel> = {
  alta: {
    emoji: "🔴",
    rotulo: "ALTA CHANCE",
    titulo: "ALTA CHANCE de o seu contrato ser um FALSO COLETIVO",
    texto:
      "Pelas suas respostas, seu contrato apresenta forte compatibilidade com o padrão de falso coletivo reconhecido pela Justiça. Nossa equipe pode fazer uma análise individual e detalhada do seu caso para confirmar e orientar os próximos passos.",
    cta: "Fale agora com nossa equipe no WhatsApp",
  },
  moderada: {
    emoji: "🟡",
    rotulo: "CHANCE MODERADA",
    titulo: "CHANCE MODERADA de o seu contrato ser um FALSO COLETIVO",
    texto:
      "Pelas suas respostas, alguns pontos do seu contrato merecem análise mais aprofundada. Nossa equipe pode esclarecer com precisão a sua situação.",
    cta: "Converse com nossa equipe",
  },
  baixa: {
    emoji: "🟢",
    rotulo: "CHANCE BAIXA",
    titulo: "BAIXA CHANCE de falso coletivo pelo que informou",
    texto:
      "Pelas suas respostas, não há sinais fortes de falso coletivo. Mas existem outras possibilidades de revisão (reajustes excessivos, negativas indevidas, cláusulas desproporcionais). Nossa equipe pode fazer uma análise completa.",
    cta: "Fale com nossa equipe",
  },
};

// ─────────────── Cálculo ───────────────

export interface ResultadoFalsoColetivo {
  pontos: number;
  /** 0–100, inteiro. */
  percentual: number;
  nivel: NivelChance;
}

function pontosDe<T extends string>(opcoes: Opcao<T>[], id: T): number {
  return opcoes.find((o) => o.id === id)?.pontos ?? 0;
}

export function rotuloDe<T extends string>(opcoes: Opcao<T>[], id: T): string {
  return opcoes.find((o) => o.id === id)?.rotulo ?? "—";
}

/** 70%+ → alta · 40% a 69% → moderada · abaixo de 40% → baixa. */
export function nivelPorPercentual(pct: number): NivelChance {
  if (pct >= 70) return "alta";
  if (pct >= 40) return "moderada";
  return "baixa";
}

export function calcularFalsoColetivo(
  r: RespostasFalsoColetivo,
): ResultadoFalsoColetivo {
  // Mensalidade (P5) tem peso 0 e não entra na soma.
  const pontos =
    pontosDe(OPCOES_TIPO_PLANO, r.tipoPlano) +
    pontosDe(OPCOES_VIDAS, r.vidas) +
    pontosDe(OPCOES_ENTRADA, r.entrada) +
    pontosDe(OPCOES_REAJUSTE, r.reajuste) +
    pontosDe(OPCOES_TEMPO, r.tempo);
  const percentual = Math.max(
    0,
    Math.min(100, Math.round((pontos / PONTUACAO_MAXIMA) * 100)),
  );
  return { pontos, percentual, nivel: nivelPorPercentual(percentual) };
}

/** 1500 → "R$ 1.500,00" */
export function formatMoedaBR(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
