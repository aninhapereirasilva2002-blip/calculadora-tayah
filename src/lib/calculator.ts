/**
 * Lógica pura de diagnóstico da calculadora de revisão de reajuste.
 *
 * Recebe os dados dos 7 passos e devolve { nivel, sinalizacoes } — sem
 * dependência de React, DOM ou rede, para ficar testável e reutilizável.
 */

// Tetos oficiais de reajuste da ANS para planos individuais/familiares,
// por período maio-abril. Fonte: reajustes anuais publicados pela ANS.
// (Mantido como dado embarcado; atualizar quando houver novo teto.)
export const TETOS_ANS: Record<number, number> = {
  2021: -8.19,
  2022: 15.5,
  2023: 9.63,
  2024: 6.91,
  2025: 6.06,
};

export type TipoPlano =
  | "individual"
  | "coletivo_adesao"
  | "coletivo_empresarial"
  | "nao_sei";

export interface DadosCalculadora {
  tipoPlano: TipoPlano;
  operadora: string;
  mensalidade: number;
  reajustePercentual: number;
  mesReajuste: number; // 1..12
  anoReajuste: number; // 2021..2026
  idadeTitular: number; // 0..100
  anoContratacao: number; // 1980..2026
}

export type Nivel = "forte" | "moderado" | "fraco";

export interface Diagnostico {
  nivel: Nivel;
  sinalizacoes: string[];
}

// Ano-alvo para a regra de prescrição (Tema 610 STJ — 3 anos).
// Em produção real, viria de new Date(); aqui fica fixo no ano corrente
// da aplicação para manter a função 100% pura.
const ANO_ATUAL = 2026;

/**
 * Calcula o diagnóstico preliminar a partir dos dados informados.
 * A regra final de nivel: se houver qualquer forte → forte;
 * senão, se houver moderado → moderado; senão → fraco.
 */
export function calcularDiagnostico(dados: DadosCalculadora): Diagnostico {
  const sinalizacoes: string[] = [];
  const niveis: Nivel[] = [];

  const isColetivo =
    dados.tipoPlano === "coletivo_adesao" ||
    dados.tipoPlano === "coletivo_empresarial";
  const isIndividual = dados.tipoPlano === "individual";

  // ---------- Regras por tipo de plano e teto ANS ----------
  if (isIndividual) {
    const teto = TETOS_ANS[dados.anoReajuste];
    if (typeof teto === "number") {
      if (dados.reajustePercentual > teto) {
        sinalizacoes.push(
          `Reajuste de ${formatarPct(dados.reajustePercentual)} acima do teto ANS de ${formatarPct(teto)} para ${dados.anoReajuste}.`,
        );
        niveis.push("forte");
      } else if (
        dados.reajustePercentual >= teto &&
        dados.reajustePercentual <= teto + 2
      ) {
        sinalizacoes.push(
          "Reajuste próximo do limite ANS — merece revisão detalhada.",
        );
        niveis.push("moderado");
      }
    }
  }

  if (isColetivo) {
    if (dados.reajustePercentual > 20) {
      sinalizacoes.push(
        "Reajuste acima da média de mercado para planos coletivos (17–22% em 2024/2025).",
      );
      niveis.push("forte");
    } else if (
      dados.reajustePercentual >= 10 &&
      dados.reajustePercentual <= 20
    ) {
      sinalizacoes.push(
        "Reajuste dentro da média, mas pode ser contestado caso a operadora não apresente nota técnica atuarial.",
      );
      niveis.push("moderado");
    }
  }

  // ---------- Regras por faixa etária ----------
  // Observação: 59 e 60 anos são tratados separadamente porque a
  // jurisprudência trata a transição dos 59/60 como a mais crítica,
  // e o Estatuto do Idoso veda qualquer reajuste por faixa >= 60.
  if (dados.idadeTitular >= 59) {
    sinalizacoes.push(
      "Idade em faixa crítica — reajustes por faixa etária aos 59/60 anos são os mais contestados judicialmente.",
    );
    niveis.push("forte");
  }
  if (dados.idadeTitular >= 60) {
    sinalizacoes.push(
      "Estatuto do Idoso (Lei 10.741/03) veda reajuste por faixa etária após os 60 anos.",
    );
    niveis.push("forte");
  }

  // ---------- Regra de contrato antigo (pré Lei 9.656/98) ----------
  if (dados.anoContratacao < 1999) {
    sinalizacoes.push(
      "Contrato anterior à Lei 9.656/98 — regras específicas, análise individual recomendada.",
    );
    niveis.push("moderado");
  }

  // ---------- Regra de prescrição (Tema 610 STJ — 3 anos) ----------
  if (dados.anoReajuste < ANO_ATUAL - 2) {
    sinalizacoes.push(
      "Parte das parcelas pode estar prescrita (Tema 610 STJ — 3 anos). Análise prioritária.",
    );
    niveis.push("moderado");
  }

  // ---------- Nível final ----------
  let nivel: Nivel;
  if (niveis.includes("forte")) {
    nivel = "forte";
  } else if (niveis.includes("moderado")) {
    nivel = "moderado";
  } else {
    nivel = "fraco";
  }

  // Sempre incluir pelo menos uma sinalização, mesmo em nível fraco.
  if (sinalizacoes.length === 0) {
    sinalizacoes.push(
      "Nenhum indício forte detectado pelas regras automáticas — ainda assim, a análise individual do contrato pode identificar outras questões.",
    );
  }

  return { nivel, sinalizacoes };
}

/** Formata um percentual numérico como "6,06%" (padrão brasileiro). */
function formatarPct(valor: number): string {
  return `${valor.toFixed(2).replace(".", ",")}%`;
}
