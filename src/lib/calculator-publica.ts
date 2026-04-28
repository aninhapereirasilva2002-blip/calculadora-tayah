/**
 * calculator-publica.ts — versão pública (landing) da calculadora.
 *
 * Estende o diagnóstico textual de calculator.ts com VALORES EM REAIS:
 *  - mensalidade que o cliente pagaria com reajuste "esperado"
 *  - diferença mensal estimada
 *  - total acumulado retroativo (com corte trienal — Tema 610/STJ)
 *  - detalhamento mês a mês para exibir em tabela
 *
 * Função pura, sem React/DOM/rede; testável e segura para chamar
 * tanto no client (event handler) quanto em um eventual SSR.
 *
 * Limitação consciente: a "mensalidade devida" usa apenas o reajuste
 * mais recente (o que o usuário informou no formulário). Não tenta
 * reconstruir histórico — para isso existe a calculadora interna
 * em /escritorio.
 */

import {
  calcularDiagnostico,
  TETOS_ANS,
  type DadosCalculadora,
  type Diagnostico,
} from "./calculator";

/**
 * Reajuste-esperado (proxy razoável) para planos coletivos.
 * IPCA da última década ~4,5% a.a. + margem técnica ~6,5% = 11%.
 * Documentado para a equipe poder ajustar quando a tese mudar.
 */
export const REAJUSTE_ESPERADO_COLETIVO = 11;

/** Limite de retroatividade para cobrança/restituição (Tema 610/STJ). */
export const LIMITE_MESES_PRESCRICAO = 36;

export interface DetalheMensal {
  rotulo: string; // "04/2025"
  ano: number;
  mes: number; // 1..12
  cobrada: number;
  devida: number;
  diferenca: number;
}

export interface ResultadoPublico extends Diagnostico {
  /** Mensalidade que o cliente paga hoje (entrada do formulário). */
  valorMensalidadeAtual: number;
  /** Mensalidade que ele pagaria com reajuste esperado. */
  valorMensalidadeDevida: number;
  /** Diferença mensal absoluta (atual - devida). 0 se atual ≤ devida. */
  diferencaMensal: number;
  /** % de reajuste considerado "esperado" para a comparação. */
  reajusteEsperado: number;
  /** Diferença em pontos percentuais entre aplicado e esperado. */
  reajusteExcessivoPercent: number;
  /** Quantos meses contados (≤ 36) entre o reajuste e hoje. */
  mesesConsiderados: number;
  /** Total retroativo estimado (diferencaMensal × mesesConsiderados). */
  totalAcumulado36meses: number;
  /** Linha a linha para a tabela "ver detalhes". */
  detalhesMensais: DetalheMensal[];
}

// ============================================================
// Utilidades públicas (também consumidas pelo Calculator.tsx)
// ============================================================

export function formatMoedaBR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPctBR(n: number, casas = 2): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

export function rotuloMM_AAAA(mes: number, ano: number): string {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

// ============================================================
// Núcleo
// ============================================================

/**
 * Define o reajuste "esperado" segundo o tipo de plano:
 *  - individual: teto ANS do ano informado (cai pra 0 se desconhecido)
 *  - coletivo (adesão ou empresarial): proxy fixo (11%)
 *  - "não sei": usa o teto ANS do ano se houver; senão, 11%
 *    (mais conservador para o cliente "não tirar zero")
 */
function reajusteEsperadoPara(dados: DadosCalculadora): number {
  if (dados.tipoPlano === "individual") {
    const teto = TETOS_ANS[dados.anoReajuste];
    return typeof teto === "number" ? teto : 0;
  }
  if (
    dados.tipoPlano === "coletivo_adesao" ||
    dados.tipoPlano === "coletivo_empresarial"
  ) {
    return REAJUSTE_ESPERADO_COLETIVO;
  }
  // tipoPlano === "nao_sei"
  const teto = TETOS_ANS[dados.anoReajuste];
  return typeof teto === "number" ? teto : REAJUSTE_ESPERADO_COLETIVO;
}

/**
 * Diferença em meses entre (mês/ano do reajuste) e a data corrente.
 * Limitado entre 0 e LIMITE_MESES_PRESCRICAO (36) — Tema 610/STJ.
 */
function mesesDesdeReajuste(
  mesReajuste: number,
  anoReajuste: number,
  agora = new Date(),
): number {
  const mesesBrutos =
    (agora.getFullYear() - anoReajuste) * 12 +
    (agora.getMonth() + 1 - mesReajuste);
  if (mesesBrutos <= 0) return 0;
  return Math.min(LIMITE_MESES_PRESCRICAO, mesesBrutos);
}

/**
 * Constrói o array de DetalheMensal cobrindo `meses` competências
 * a partir do mês/ano do reajuste, inclusive.
 *
 * Cada linha repete cobrada/devida porque modelamos como mensalidade
 * estável (não há novo reajuste no meio do período de 36 meses).
 */
function montarDetalhes(
  mesIni: number,
  anoIni: number,
  meses: number,
  cobrada: number,
  devida: number,
): DetalheMensal[] {
  const out: DetalheMensal[] = [];
  for (let i = 0; i < meses; i++) {
    const totalMes = mesIni + i;
    const ano = anoIni + Math.floor((totalMes - 1) / 12);
    const mes = ((totalMes - 1) % 12) + 1;
    const diferenca = Math.max(0, cobrada - devida);
    out.push({
      rotulo: rotuloMM_AAAA(mes, ano),
      ano,
      mes,
      cobrada,
      devida,
      diferenca,
    });
  }
  return out;
}

export function calcularResultadoPublico(
  dados: DadosCalculadora,
): ResultadoPublico {
  // 1) Diagnóstico textual reaproveita a lógica existente.
  const diagnostico = calcularDiagnostico(dados);

  // 2) Comparativo em R$.
  const reajusteEsperado = reajusteEsperadoPara(dados);
  const fatorAplicado = 1 + dados.reajustePercentual / 100;
  const fatorEsperado = 1 + reajusteEsperado / 100;

  const valorMensalidadeAtual = dados.mensalidade;
  // mensalidadeAntes (estimada, "desfazendo" o reajuste aplicado)
  const valorAntes =
    fatorAplicado > 0 ? dados.mensalidade / fatorAplicado : dados.mensalidade;
  const valorMensalidadeDevida = valorAntes * fatorEsperado;
  const diferencaMensal = Math.max(
    0,
    valorMensalidadeAtual - valorMensalidadeDevida,
  );

  const reajusteExcessivoPercent = Math.max(
    0,
    dados.reajustePercentual - reajusteEsperado,
  );

  // 3) Total retroativo limitado a 36 meses.
  const meses = mesesDesdeReajuste(dados.mesReajuste, dados.anoReajuste);
  const totalAcumulado36meses = diferencaMensal * meses;

  const detalhesMensais = montarDetalhes(
    dados.mesReajuste,
    dados.anoReajuste,
    meses,
    valorMensalidadeAtual,
    valorMensalidadeDevida,
  );

  return {
    ...diagnostico,
    valorMensalidadeAtual,
    valorMensalidadeDevida,
    diferencaMensal,
    reajusteEsperado,
    reajusteExcessivoPercent,
    mesesConsiderados: meses,
    totalAcumulado36meses,
    detalhesMensais,
  };
}
