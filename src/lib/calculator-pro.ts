/**
 * calculator-pro.ts — núcleo de cálculo da calculadora técnica
 * (área privada do escritório, /escritorio).
 *
 * Funções puras, sem React e sem efeitos colaterais. Toda a UI consome
 * computeResultado(estado) e renderiza o objeto Resultado retornado.
 *
 * Convenções:
 *  - percentuais são números na escala 0-100 (ex.: 19,2 = 19,2%, não 0,192).
 *  - valores monetários são números em REAIS (ex.: 850,55), nunca centavos.
 *  - meses são 1-12; anos são inteiros de 4 dígitos.
 *
 * Toda fórmula de acumulado usa a expressão multiplicativa do Tema 1016/STJ:
 *   acumulado = ((1 + r1) × (1 + r2) × ... × (1 + rn)) - 1
 */

// ============================================================
// TETOS_ANS — Reajuste máximo autorizado pela ANS para planos
// individuais/familiares por ciclo (mai/aaaa → abr/aaaa+1).
// Atualizar anualmente quando a ANS divulgar o novo índice.
// Fonte: ANS — Notas Técnicas Atuariais.
// ============================================================
export const TETOS_ANS: Record<number, number> = {
  2021: -8.19,
  2022: 15.5,
  2023: 9.63,
  2024: 6.91,
  2025: 6.06,
};

// Estimativas grosseiras para comparativo informativo. O resultado final
// (parecer) deve usar o índice oficial publicado por IBGE/FGV.
export const IPCA_AA_ESTIMADO = 4.5; // % a.a.
export const IGPM_AA_ESTIMADO = 5.5; // % a.a.

// ============================================================
// Tipos do estado do formulário
// ============================================================

export type Operadora =
  | "Amil"
  | "Bradesco Saúde"
  | "Hapvida NotreDame Intermédica"
  | "Unimed-Rio"
  | "Unimed Nacional"
  | "SulAmérica"
  | "Porto Saúde"
  | "Golden Cross"
  | "Assim Saúde"
  | "Outra";

export const OPERADORAS: readonly Operadora[] = [
  "Amil",
  "Bradesco Saúde",
  "Hapvida NotreDame Intermédica",
  "Unimed-Rio",
  "Unimed Nacional",
  "SulAmérica",
  "Porto Saúde",
  "Golden Cross",
  "Assim Saúde",
  "Outra",
] as const;

export type TipoPlano = "individual" | "adesao" | "empresarial";

export type Parentesco = "conjuge" | "filho" | "pai" | "mae" | "outro";

export interface DadosCliente {
  nome: string;
  contrato: string;
  operadora: Operadora | "";
  tipoPlano: TipoPlano | "";
  /** Apenas para tipoPlano === "empresarial". Vazio se não preenchido. */
  beneficiarios: string;
  /** Ano de contratação. Vazio se não preenchido. */
  anoContratacao: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  /** Idade em anos como string para tolerar input vazio sem quebrar tipos. */
  idade: string;
  /** Indefinido para o titular; preenchido para dependentes. */
  parentesco?: Parentesco;
}

export interface Mensalidade {
  /** Em reais, como string para preservar a edição com máscara. */
  atual: string;
  /** Em reais, opcional. Se vazia, é estimada como atual ÷ (1 + acumulado). */
  anterior: string;
}

export interface Reajuste {
  id: string;
  mes: number; // 1-12
  ano: number; // ex.: 2025
  pctFinanceiro: string;
  pctTecnico: string;
  pctAplicado: string;
  observacao: string;
}

export interface CasoEstado {
  cliente: DadosCliente;
  titular: Pessoa;
  dependentes: Pessoa[];
  mensalidade: Mensalidade;
  reajustes: Reajuste[];
}

// ============================================================
// Tipos do resultado calculado
// ============================================================

export type NivelAviso = "red" | "amber" | "green";

export interface Aviso {
  nivel: NivelAviso;
  texto: string;
}

export interface PassoMemoria {
  ordem: number;
  rotulo: string; // ex.: "Reajuste 1 (Abril/2025): 19,20%"
  baseAntes: number;
  pctAplicado: number;
  baseDepois: number;
}

export interface ComparativoLinha {
  indicador: string;
  periodo: string;
  variacaoPct: number | null; // null quando não calculável
  variacaoTexto: string; // texto formatado para a célula
  status: string; // ex.: "1,8× o teto" / "Dentro do teto" / "Referência"
  destaque: NivelAviso | null;
}

export interface Resultado {
  preenchido: boolean; // false se não há dados suficientes para calcular nada
  acumuladoCasoPct: number; // ex.: 37.29
  acumuladoCasoFator: number; // ex.: 1.3729
  qtdReajustes: number;
  primeiroReajuste: { mes: number; ano: number } | null;
  ultimoReajuste: { mes: number; ano: number } | null;
  duracaoMeses: number; // entre primeiro e último reajuste
  baseUsada: number; // mensalidade base (informada ou estimada)
  baseEstimada: boolean; // true se usamos atual ÷ (1+acumulado)
  passosMemoria: PassoMemoria[];
  comparativos: ComparativoLinha[];
  avisos: Aviso[];
}

// ============================================================
// Utilitários numéricos / parsing
// ============================================================

/** Converte "19,20" ou "19.20" em 19.2; retorna NaN se vazio/inválido. */
export function parseDecimalBR(s: string): number {
  if (s === undefined || s === null) return NaN;
  const limpo = String(s).trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return NaN;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : NaN;
}

/** Aplica máscara monetária BR a partir de uma string crua de dígitos. */
export function mascaraMoeda(raw: string): string {
  const digitos = raw.replace(/\D/g, "");
  if (digitos === "") return "";
  const cents = parseInt(digitos, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "1.234,56" → 1234.56; vazio → NaN. */
export function parseMoeda(s: string): number {
  return parseDecimalBR(s);
}

export function formatPctBR(n: number, casas = 2): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

export function formatMoedaBR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export const NOMES_MESES = [
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
] as const;

export function rotuloMesAno(mes: number, ano: number): string {
  const i = Math.max(1, Math.min(12, Math.trunc(mes))) - 1;
  return `${NOMES_MESES[i]}/${ano}`;
}

export function rotuloTipoPlano(t: TipoPlano | ""): string {
  switch (t) {
    case "individual":
      return "Individual/Familiar";
    case "adesao":
      return "Coletivo por Adesão";
    case "empresarial":
      return "Coletivo Empresarial";
    default:
      return "—";
  }
}

export function rotuloParentesco(p: Parentesco): string {
  switch (p) {
    case "conjuge":
      return "Cônjuge";
    case "filho":
      return "Filho(a)";
    case "pai":
      return "Pai";
    case "mae":
      return "Mãe";
    case "outro":
      return "Outro";
  }
}

/** Cria um id estável e único o suficiente para chaves de lista. */
export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Núcleo: ordenação, filtragem e cálculos
// ============================================================

/** Reajustes válidos: mês/ano definidos e pctAplicado parseável e finito. */
export function reajustesValidos(reajustes: Reajuste[]): Array<
  Reajuste & { aplicadoNum: number }
> {
  return reajustes
    .map((r) => ({ ...r, aplicadoNum: parseDecimalBR(r.pctAplicado) }))
    .filter(
      (r) =>
        Number.isInteger(r.mes) &&
        r.mes >= 1 &&
        r.mes <= 12 &&
        Number.isInteger(r.ano) &&
        r.ano > 1900 &&
        Number.isFinite(r.aplicadoNum),
    )
    .sort((a, b) => a.ano - b.ano || a.mes - b.mes);
}

/** Acumulado multiplicativo em percentual: ((1+r1)(1+r2)...) - 1 ; em %. */
export function acumuladoMultiplicativo(percentuais: number[]): {
  fator: number;
  pct: number;
} {
  const fator = percentuais.reduce((acc, p) => acc * (1 + p / 100), 1);
  return { fator, pct: (fator - 1) * 100 };
}

function diffMeses(
  a: { mes: number; ano: number },
  b: { mes: number; ano: number },
): number {
  return (b.ano - a.ano) * 12 + (b.mes - a.mes);
}

function tetoAnsAcumuladoNoPeriodo(anoIni: number, anoFim: number): {
  fator: number;
  pct: number;
  anosUsados: number[];
} {
  const anosUsados: number[] = [];
  let fator = 1;
  for (let a = anoIni; a <= anoFim; a++) {
    const teto = TETOS_ANS[a];
    if (typeof teto === "number") {
      fator *= 1 + teto / 100;
      anosUsados.push(a);
    }
  }
  return { fator, pct: (fator - 1) * 100, anosUsados };
}

function indiceAcumuladoEstimado(taxaAA: number, meses: number): {
  fator: number;
  pct: number;
} {
  const anos = meses / 12;
  const fator = Math.pow(1 + taxaAA / 100, anos);
  return { fator, pct: (fator - 1) * 100 };
}

/** Idade numérica saneada (NaN se inválida). */
function idadeNum(p: Pessoa): number {
  const n = parseDecimalBR(p.idade);
  return Number.isFinite(n) ? n : NaN;
}

// ============================================================
// computeResultado — entrada principal
// ============================================================

export function computeResultado(estado: CasoEstado): Resultado {
  const validos = reajustesValidos(estado.reajustes);
  const qtdReajustes = validos.length;

  // Acumulado do caso
  const acumulado = acumuladoMultiplicativo(
    validos.map((r) => r.aplicadoNum),
  );

  const primeiro = validos[0]
    ? { mes: validos[0].mes, ano: validos[0].ano }
    : null;
  const ultimo = validos[validos.length - 1]
    ? {
        mes: validos[validos.length - 1].mes,
        ano: validos[validos.length - 1].ano,
      }
    : null;
  const duracao = primeiro && ultimo ? diffMeses(primeiro, ultimo) : 0;

  // Base usada para a memória de cálculo
  const atualNum = parseMoeda(estado.mensalidade.atual);
  const anteriorNum = parseMoeda(estado.mensalidade.anterior);

  let baseUsada = NaN;
  let baseEstimada = false;
  if (Number.isFinite(anteriorNum) && anteriorNum > 0) {
    baseUsada = anteriorNum;
  } else if (Number.isFinite(atualNum) && atualNum > 0 && acumulado.fator > 0) {
    baseUsada = atualNum / acumulado.fator;
    baseEstimada = true;
  }

  // Passos da memória
  const passosMemoria: PassoMemoria[] = [];
  if (Number.isFinite(baseUsada) && validos.length > 0) {
    let corrente = baseUsada;
    validos.forEach((r, i) => {
      const baseAntes = corrente;
      const baseDepois = baseAntes * (1 + r.aplicadoNum / 100);
      passosMemoria.push({
        ordem: i + 1,
        rotulo: `Reajuste ${i + 1} (${rotuloMesAno(r.mes, r.ano)}): ${formatPctBR(
          r.aplicadoNum,
        )}`,
        baseAntes,
        pctAplicado: r.aplicadoNum,
        baseDepois,
      });
      corrente = baseDepois;
    });
  }

  // Comparativos
  const comparativos: ComparativoLinha[] = [];
  const periodoTexto =
    primeiro && ultimo
      ? `${rotuloMesAno(primeiro.mes, primeiro.ano)} a ${rotuloMesAno(
          ultimo.mes,
          ultimo.ano,
        )}`
      : "—";

  // 1) Caso (referência)
  comparativos.push({
    indicador: "Reajuste aplicado (caso)",
    periodo: periodoTexto,
    variacaoPct: qtdReajustes > 0 ? acumulado.pct : null,
    variacaoTexto:
      qtdReajustes > 0 ? formatPctBR(acumulado.pct) : "—",
    status: "Referência",
    destaque: null,
  });

  // 2) Teto ANS individuais
  let tetoAnsPct: number | null = null;
  if (primeiro && ultimo) {
    const ans = tetoAnsAcumuladoNoPeriodo(primeiro.ano, ultimo.ano);
    if (ans.anosUsados.length > 0) {
      tetoAnsPct = ans.pct;
    }
    comparativos.push({
      indicador: "Teto ANS individuais",
      periodo: periodoTexto,
      variacaoPct: tetoAnsPct,
      variacaoTexto:
        tetoAnsPct !== null
          ? `${formatPctBR(tetoAnsPct)} (anos: ${ans.anosUsados.join(", ")})`
          : "Sem teto publicado no período",
      status: comparaCasoVs(acumulado.fator, ans.fator),
      destaque: destaqueComparativo(acumulado.fator, ans.fator),
    });
  } else {
    comparativos.push({
      indicador: "Teto ANS individuais",
      periodo: "—",
      variacaoPct: null,
      variacaoTexto: "—",
      status: "—",
      destaque: null,
    });
  }

  // 3) IPCA estimado
  if (primeiro && ultimo) {
    const ipca = indiceAcumuladoEstimado(IPCA_AA_ESTIMADO, duracao);
    comparativos.push({
      indicador: `IPCA acumulado (estimativa ${IPCA_AA_ESTIMADO}% a.a.)`,
      periodo: periodoTexto,
      variacaoPct: ipca.pct,
      variacaoTexto: formatPctBR(ipca.pct),
      status: comparaCasoVs(acumulado.fator, ipca.fator),
      destaque: destaqueComparativo(acumulado.fator, ipca.fator),
    });

    // 4) IGP-M estimado
    const igpm = indiceAcumuladoEstimado(IGPM_AA_ESTIMADO, duracao);
    comparativos.push({
      indicador: `IGP-M acumulado (estimativa ${IGPM_AA_ESTIMADO}% a.a.)`,
      periodo: periodoTexto,
      variacaoPct: igpm.pct,
      variacaoTexto: formatPctBR(igpm.pct),
      status: comparaCasoVs(acumulado.fator, igpm.fator),
      destaque: destaqueComparativo(acumulado.fator, igpm.fator),
    });
  } else {
    comparativos.push(
      {
        indicador: `IPCA acumulado (estimativa ${IPCA_AA_ESTIMADO}% a.a.)`,
        periodo: "—",
        variacaoPct: null,
        variacaoTexto: "—",
        status: "—",
        destaque: null,
      },
      {
        indicador: `IGP-M acumulado (estimativa ${IGPM_AA_ESTIMADO}% a.a.)`,
        periodo: "—",
        variacaoPct: null,
        variacaoTexto: "—",
        status: "—",
        destaque: null,
      },
    );
  }

  // 5) Média de mercado coletivos (texto contextual fixo)
  comparativos.push({
    indicador: "Média mercado — coletivos",
    periodo: "2024-2026",
    variacaoPct: null,
    variacaoTexto: "17% a 25% a.a.",
    status: "Referência de mercado",
    destaque: null,
  });

  // Avisos / indícios de abusividade
  const avisos = montarAvisos(estado, {
    acumuladoFator: acumulado.fator,
    acumuladoPct: acumulado.pct,
    tetoAnsPct,
    duracaoMeses: duracao,
    primeiro,
  });

  const preenchido = qtdReajustes > 0 || temAlgumDadoCliente(estado);

  return {
    preenchido,
    acumuladoCasoPct: acumulado.pct,
    acumuladoCasoFator: acumulado.fator,
    qtdReajustes,
    primeiroReajuste: primeiro,
    ultimoReajuste: ultimo,
    duracaoMeses: duracao,
    baseUsada,
    baseEstimada,
    passosMemoria,
    comparativos,
    avisos,
  };
}

function temAlgumDadoCliente(estado: CasoEstado): boolean {
  const c = estado.cliente;
  if (c.nome.trim() || c.contrato.trim() || c.operadora || c.tipoPlano) {
    return true;
  }
  if (estado.titular.nome.trim() || estado.titular.idade.trim()) return true;
  if (estado.dependentes.length > 0) return true;
  if (estado.mensalidade.atual.trim() || estado.mensalidade.anterior.trim()) {
    return true;
  }
  return false;
}

function comparaCasoVs(fatorCaso: number, fatorInd: number): string {
  if (!Number.isFinite(fatorInd) || fatorInd <= 0) {
    return "Indicador não calculável";
  }
  const razao = fatorCaso / fatorInd;
  if (razao >= 1) {
    return `Supera em ${razao.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}× o indicador`;
  }
  return "Dentro do indicador";
}

function destaqueComparativo(
  fatorCaso: number,
  fatorInd: number,
): NivelAviso | null {
  if (!Number.isFinite(fatorInd) || fatorInd <= 0) return null;
  const razao = fatorCaso / fatorInd;
  if (razao >= 2) return "red";
  if (razao >= 1) return "amber";
  return "green";
}

// ============================================================
// Avisos / indícios de abusividade
// ============================================================

function montarAvisos(
  estado: CasoEstado,
  ctx: {
    acumuladoFator: number;
    acumuladoPct: number;
    tetoAnsPct: number | null;
    duracaoMeses: number;
    primeiro: { mes: number; ano: number } | null;
  },
): Aviso[] {
  const avisos: Aviso[] = [];

  // Estatuto do Idoso (≥60) e faixa crítica (==59)
  const todasPessoas = [estado.titular, ...estado.dependentes];
  const idades = todasPessoas
    .map((p) => idadeNum(p))
    .filter((n) => Number.isFinite(n));
  const tem60Mais = idades.some((n) => n >= 60);
  const tem59 = idades.some((n) => n >= 59 && n < 60);
  if (tem60Mais) {
    avisos.push({
      nivel: "red",
      texto:
        "🟥 Estatuto do Idoso (Lei 10.741/03) veda reajuste por faixa etária após 60 anos",
    });
  }
  if (tem59) {
    avisos.push({
      nivel: "amber",
      texto:
        "🟨 Faixa crítica (59 anos) para reajuste por mudança de faixa etária — Tema 952/STJ",
    });
  }

  // Falso coletivo (empresarial < 30 vidas)
  if (estado.cliente.tipoPlano === "empresarial") {
    const benef = parseDecimalBR(estado.cliente.beneficiarios);
    if (Number.isFinite(benef) && benef > 0 && benef < 30) {
      avisos.push({
        nivel: "red",
        texto:
          "🟥 Falso coletivo (RN 309/ANS) — equiparar a individual na revisão",
      });
    }
  }

  // Acumulado > IPCA estimado × 2 (no período)
  if (ctx.duracaoMeses > 0 && ctx.acumuladoFator > 0) {
    const ipcaFator = Math.pow(
      1 + IPCA_AA_ESTIMADO / 100,
      ctx.duracaoMeses / 12,
    );
    const igpmFator = Math.pow(
      1 + IGPM_AA_ESTIMADO / 100,
      ctx.duracaoMeses / 12,
    );
    if (ctx.acumuladoFator >= 2 * ipcaFator) {
      avisos.push({
        nivel: "red",
        texto:
          "🟥 Reajuste acumulado mais que dobra o IPCA estimado do período",
      });
    }
    if (ctx.acumuladoFator >= 2 * igpmFator) {
      avisos.push({
        nivel: "red",
        texto:
          "🟥 Reajuste acumulado mais que dobra o IGP-M estimado do período",
      });
    }
  }

  // Acumulado > teto ANS × 2
  if (ctx.tetoAnsPct !== null) {
    const ansFator = 1 + ctx.tetoAnsPct / 100;
    if (ansFator > 0 && ctx.acumuladoFator >= 2 * ansFator) {
      avisos.push({
        nivel: "red",
        texto: "🟥 Reajuste acumulado mais que dobra o teto ANS do período",
      });
    }
  }

  // Inconsistência entre componentes (financeiro + técnico vs aplicado)
  for (const r of estado.reajustes) {
    const fin = parseDecimalBR(r.pctFinanceiro);
    const tec = parseDecimalBR(r.pctTecnico);
    const apl = parseDecimalBR(r.pctAplicado);
    if (
      Number.isFinite(fin) &&
      Number.isFinite(tec) &&
      Number.isFinite(apl) &&
      apl > fin + tec + 0.5
    ) {
      avisos.push({
        nivel: "amber",
        texto: `🟨 Inconsistência em ${rotuloMesAno(
          r.mes,
          r.ano,
        )}: aplicado ${formatPctBR(apl)} > financeiro ${formatPctBR(
          fin,
        )} + técnico ${formatPctBR(tec)}`,
      });
      break; // basta uma; senão polui a lista
    }
  }

  // Contrato anterior à Lei 9.656/98
  const ano = parseDecimalBR(estado.cliente.anoContratacao);
  if (Number.isFinite(ano) && ano > 0 && ano < 1999) {
    avisos.push({
      nivel: "amber",
      texto:
        "🟨 Contrato anterior à Lei 9.656/98 — regras específicas se aplicam",
    });
  }

  // Possível prescrição (Tema 610/STJ — 3 anos)
  if (ctx.primeiro) {
    const hoje = new Date();
    const mesesAtras =
      (hoje.getFullYear() - ctx.primeiro.ano) * 12 +
      (hoje.getMonth() + 1 - ctx.primeiro.mes);
    if (mesesAtras > 36) {
      avisos.push({
        nivel: "amber",
        texto:
          "🟨 Parcelas mais antigas podem estar prescritas (Tema 610/STJ — 3 anos)",
      });
    }
  }

  // Sempre listar pelo menos uma sinalização
  if (avisos.length === 0) {
    avisos.push({
      nivel: "green",
      texto:
        "🟩 Nenhum indício automático identificado com os dados fornecidos. Avaliar manualmente.",
    });
  }

  return avisos;
}

// ============================================================
// Memória de cálculo formatada (para a área expansível)
// ============================================================

export function montarMemoriaCalculo(
  estado: CasoEstado,
  resultado: Resultado,
): string {
  const linhas: string[] = [];
  if (resultado.passosMemoria.length === 0) {
    return "Preencha mensalidade e ao menos um reajuste para ver a memória de cálculo.";
  }
  const baseLabel = resultado.baseEstimada
    ? `Mensalidade base estimada (atual ÷ acumulado): ${formatMoedaBR(
        resultado.baseUsada,
      )}`
    : `Mensalidade base informada: ${formatMoedaBR(resultado.baseUsada)}`;
  linhas.push(baseLabel);
  linhas.push("");

  for (const passo of resultado.passosMemoria) {
    linhas.push(passo.rotulo);
    const fator = (1 + passo.pctAplicado / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
    linhas.push(
      `Após reajuste: ${formatMoedaBR(passo.baseAntes)} × (1 + ${(
        passo.pctAplicado / 100
      ).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })}) = ${formatMoedaBR(passo.baseAntes)} × ${fator} = ${formatMoedaBR(
        passo.baseDepois,
      )}`,
    );
    linhas.push("");
  }

  // Expansão da fórmula multiplicativa
  const validos = reajustesValidos(estado.reajustes);
  const fatoresFmt = validos.map((r) =>
    (1 + r.aplicadoNum / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }),
  );
  const decimaisFmt = validos.map((r) =>
    (r.aplicadoNum / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }),
  );
  linhas.push("Acumulado:");
  linhas.push(`(${decimaisFmt.map((d) => `1 + ${d}`).join(") × (")}) - 1`);
  linhas.push(`= ${fatoresFmt.join(" × ")} - 1`);
  linhas.push(
    `= ${resultado.acumuladoCasoFator.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })} - 1`,
  );
  linhas.push(
    `= ${(resultado.acumuladoCasoFator - 1).toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}`,
  );
  linhas.push(`= ${formatPctBR(resultado.acumuladoCasoPct)}`);

  return linhas.join("\n");
}

// ============================================================
// Estado inicial
// ============================================================

export function estadoInicial(): CasoEstado {
  return {
    cliente: {
      nome: "",
      contrato: "",
      operadora: "",
      tipoPlano: "",
      beneficiarios: "",
      anoContratacao: "",
    },
    titular: {
      id: "titular",
      nome: "",
      idade: "",
    },
    dependentes: [],
    mensalidade: { atual: "", anterior: "" },
    reajustes: [],
  };
}
