/**
 * calculator-publica.ts — versão pública (landing) da calculadora.
 *
 * Em Sprint 5 a tela de resultado virou um "dashboard de planilha":
 * cards agregados no topo, restituição em destaque, tabela mensal de
 * 36 linhas com diferença acumulada e memória de cálculo formatada.
 *
 * Função pura, sem React/DOM/rede. Devolve um único objeto Resultado
 * que a UI consome integralmente; nenhuma regra de cálculo vive na
 * camada visual.
 *
 * Modelagem de "permitido":
 *  - Individual / Familiar (e "não sei"): teto ANS do período
 *  - Coletivo (Adesão / Empresarial): IPCA estimado (4,5% a.a.) como
 *    referência alternativa, já que a ANS não publica teto.
 */

import {
  calcularDiagnostico,
  TETOS_ANS,
  type DadosCalculadora,
  type Diagnostico,
  type Nivel,
} from "./calculator";

/** Limite de retroatividade para cobrança/restituição. */
export const LIMITE_MESES_PRESCRICAO = 36;

/** IPCA estimado a.a. (proxy "se fosse só inflação" para coletivos). */
export const IPCA_AA_ESTIMADO = 4.5;

// ============================================================
// Tabela ANS exposta para outros consumidores (mantida para futuro)
// ============================================================

export interface PeriodoANS {
  /** Ano de início da vigência (chave em TETOS_ANS). */
  anoInicio: number;
  /** Rótulo legível do período. */
  rotuloPeriodo: string;
  /** Teto percentual (pode ser negativo). */
  teto: number;
}

export const PERIODOS_ANS: readonly PeriodoANS[] = (
  Object.keys(TETOS_ANS)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b)
).map((ano) => ({
  anoInicio: ano,
  rotuloPeriodo: `Mai/${String(ano).slice(2)} a Abr/${String(ano + 1).slice(2)}`,
  teto: TETOS_ANS[ano],
}));

// ============================================================
// Tipos do dashboard
// ============================================================

export type StatusDashboard = "Abusivo" | "Moderado" | "Regular";

/** "ANS" → header diz "% Permitido (ANS)"; "referencia" → "(referência)". */
export type TipoReferencia = "ANS" | "referencia";

export interface LinhaTabelaMensal {
  mesAno: string; // "MM/AAAA"
  ano: number;
  mes: number; // 1..12
  valorCobrado: number;
  valorDevido: number;
  percentAplicado: number;
  percentPermitido: number;
  diferencaMensal: number;
  diferencaAcumulada: number;
  status: "ok" | "abusivo";
}

export interface MemoriaCalculo {
  reajusteAplicado: number;
  /**
   * % considerado "permitido" — para individuais é o teto ANS,
   * para coletivos é o IPCA estimado.
   * Mantemos o nome `tetoANS` para compatibilidade com o spec do Sprint 5.
   */
  tetoANS: number;
  excesso: number;
  formulaMensalidadeJusta: string;
  mensalidadeJusta: number;
  diferencaMensal: number;
  diferenca12Meses: number;
  diferenca36Meses: number;
}

export interface ResultadoPublico extends Diagnostico {
  // ──────── Cards do topo (BLOCO 2) ────────
  valorTotalPago: number; // mensalidade × 36
  valorTotalDevido: number;
  valorRevisaoTotal: number;
  status: StatusDashboard;
  numReajustesAbusivos: number;

  // ──────── Card de restituição (BLOCO 3) ────────
  valorRestituicaoTrienal: number;
  mesInicioRestituicao: string; // "MM/AAAA"
  numMesesRestituicao: number;

  // ──────── Tabela mensal (BLOCO 4 aba 1) ────────
  tabelaMensal: LinhaTabelaMensal[];
  tipoReferencia: TipoReferencia;

  // ──────── Memória de cálculo (BLOCO 4 aba 2) ────────
  memoriaCalculo: MemoriaCalculo;

  // ──────── Contexto para CTA / mensagem WhatsApp ────────
  valorMensalidadeAtual: number;
  mensalidadeJusta: number;
  diferencaMensal: number;
  reajusteAplicado: number;
  percentReferencia: number;
  /** Ano de início da vigência ANS aplicada (para auditoria). */
  anoVigenciaANS: number;
}

// ============================================================
// Formatação
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

export function formatDecimalPctBR(pct: number, casas = 4): string {
  if (!Number.isFinite(pct)) return "—";
  return (pct / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatNumeroBR(n: number, casas = 4): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function rotuloMM_AAAA(mes: number, ano: number): string {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

// ============================================================
// Vigência ANS, prescrição
// ============================================================

/**
 * Teto ANS aplicável ao reajuste em (mes, ano).
 * Vigência: mai/X a abr/X+1. Reajuste em jan-abr cai no índice X-1.
 * Devolve { teto: NaN } se o ano necessário não estiver na tabela.
 */
export function tetoAnsParaPeriodo(
  mes: number,
  ano: number,
): { teto: number; anoInicio: number } {
  const anoInicio = mes >= 5 ? ano : ano - 1;
  const teto = TETOS_ANS[anoInicio];
  return {
    teto: typeof teto === "number" ? teto : NaN,
    anoInicio,
  };
}

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

const STATUS_POR_NIVEL: Record<Nivel, StatusDashboard> = {
  forte: "Abusivo",
  moderado: "Moderado",
  fraco: "Regular",
};

// ============================================================
// Função principal
// ============================================================

export function calcularResultadoPublico(
  dados: DadosCalculadora,
): ResultadoPublico {
  // 1) Diagnóstico textual reaproveita a lógica existente.
  const diagnostico = calcularDiagnostico(dados);

  // 2) % permitido + tipo de referência ("ANS" vs "referencia").
  let percentReferencia: number;
  let tipoReferencia: TipoReferencia;

  const { teto: tetoAns, anoInicio } = tetoAnsParaPeriodo(
    dados.mesReajuste,
    dados.anoReajuste,
  );
  const anoVigenciaANS = anoInicio;

  if (dados.tipoPlano === "individual" || dados.tipoPlano === "nao_sei") {
    percentReferencia = Number.isFinite(tetoAns) ? tetoAns : 0;
    tipoReferencia = "ANS";
  } else {
    // coletivo_adesao | coletivo_empresarial
    percentReferencia = IPCA_AA_ESTIMADO;
    tipoReferencia = "referencia";
  }

  // 3) Mensalidades.
  const fatorAplicado = 1 + dados.reajustePercentual / 100;
  const fatorReferencia = 1 + percentReferencia / 100;
  const valorMensalidadeAtual = dados.mensalidade;
  const valorAntes =
    fatorAplicado > 0 ? dados.mensalidade / fatorAplicado : dados.mensalidade;
  const mensalidadeJusta = valorAntes * fatorReferencia;
  const diferencaMensal = Math.max(
    0,
    valorMensalidadeAtual - mensalidadeJusta,
  );

  // 4) Status do dashboard.
  const status = STATUS_POR_NIVEL[diagnostico.nivel];
  const numReajustesAbusivos = status === "Abusivo" ? 1 : 0;

  // 5) Restituição trienal.
  const numMesesRestituicao = mesesDesdeReajuste(
    dados.mesReajuste,
    dados.anoReajuste,
  );
  const valorRestituicaoTrienal = diferencaMensal * numMesesRestituicao;
  const mesInicioRestituicao = rotuloMM_AAAA(
    dados.mesReajuste,
    dados.anoReajuste,
  );

  // 6) Agregados (modelados sobre 36 meses para o "what-if" do dashboard).
  const valorTotalPago = valorMensalidadeAtual * 36;
  const valorTotalDevido = mensalidadeJusta * 36;
  const valorRevisaoTotal = Math.max(0, valorTotalPago - valorTotalDevido);

  // 7) Tabela mensal de 36 linhas a partir do mês do reajuste.
  const tabelaMensal: LinhaTabelaMensal[] = [];
  let acumulado = 0;
  for (let i = 0; i < 36; i++) {
    const totalMes = dados.mesReajuste + i;
    const ano = dados.anoReajuste + Math.floor((totalMes - 1) / 12);
    const mes = ((totalMes - 1) % 12) + 1;
    const dif = diferencaMensal;
    acumulado += dif;
    tabelaMensal.push({
      mesAno: rotuloMM_AAAA(mes, ano),
      ano,
      mes,
      valorCobrado: valorMensalidadeAtual,
      valorDevido: mensalidadeJusta,
      percentAplicado: dados.reajustePercentual,
      percentPermitido: percentReferencia,
      diferencaMensal: dif,
      diferencaAcumulada: acumulado,
      status: dif > 0 ? "abusivo" : "ok",
    });
  }

  // 8) Memória de cálculo.
  const excesso = Math.max(0, dados.reajustePercentual - percentReferencia);
  const formulaMensalidadeJusta = `${formatMoedaBR(
    valorMensalidadeAtual,
  )} ÷ (1 + ${formatDecimalPctBR(
    dados.reajustePercentual,
  )}) × (1 + ${formatDecimalPctBR(percentReferencia)})`;

  const memoriaCalculo: MemoriaCalculo = {
    reajusteAplicado: dados.reajustePercentual,
    tetoANS: percentReferencia,
    excesso,
    formulaMensalidadeJusta,
    mensalidadeJusta,
    diferencaMensal,
    diferenca12Meses: diferencaMensal * 12,
    diferenca36Meses: diferencaMensal * 36,
  };

  return {
    ...diagnostico,
    valorTotalPago,
    valorTotalDevido,
    valorRevisaoTotal,
    status,
    numReajustesAbusivos,
    valorRestituicaoTrienal,
    mesInicioRestituicao,
    numMesesRestituicao,
    tabelaMensal,
    tipoReferencia,
    memoriaCalculo,
    valorMensalidadeAtual,
    mensalidadeJusta,
    diferencaMensal,
    reajusteAplicado: dados.reajustePercentual,
    percentReferencia,
    anoVigenciaANS,
  };
}

// Helper exportado para a UI montar fórmulas (quando precisar)
export { formatNumeroBR };
