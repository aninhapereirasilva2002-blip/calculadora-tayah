/**
 * calculator-falso-coletivo.ts — lógica da calculadora pública de
 * identificação de indícios de FALSO COLETIVO.
 *
 * 4 perguntas de múltipla escolha → pontuação (máx. 12) → 3 cenários.
 * Sem valores em R$: a ferramenta só aponta INDÍCIOS (compliance OAB),
 * nunca promete resultado.
 *
 * Toda a regra fica aqui; Calculator.tsx é só apresentação e
 * /api/lead reutiliza os rótulos para montar o email.
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

export interface RespostasFalsoColetivo {
  tipoPlano: TipoPlanoFC;
  vidas: QtdVidas;
  entrada: FormaEntrada;
  reajuste: ReajusteAlto;
}

export type NivelIndicio = "fortes" | "alguns" | "nenhum";

// ─────────────── Opções (rótulo + pontos) ───────────────

export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
  desc?: string;
  pontos: number;
}

export const OPCOES_TIPO_PLANO: Opcao<TipoPlanoFC>[] = [
  {
    id: "coletivo_empresarial",
    rotulo: "Coletivo Empresarial",
    desc: "Contratado por uma empresa/CNPJ.",
    pontos: 3,
  },
  {
    id: "coletivo_adesao",
    rotulo: "Coletivo por Adesão",
    desc: "Por associação ou sindicato.",
    pontos: 2,
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
    pontos: 1,
  },
];

export const OPCOES_VIDAS: Opcao<QtdVidas>[] = [
  { id: "so_eu", rotulo: "Só eu", pontos: 3 },
  { id: "de_2_a_29", rotulo: "2 a 29 pessoas", pontos: 3 },
  { id: "30_ou_mais", rotulo: "30 ou mais", pontos: 0 },
];

export const OPCOES_ENTRADA: Opcao<FormaEntrada>[] = [
  {
    id: "clt",
    rotulo: "Pela empresa onde trabalho com carteira assinada",
    pontos: 0,
  },
  {
    id: "abriu_empresa",
    rotulo: "Abri uma empresa (MEI ou PJ) para conseguir o plano",
    pontos: 4,
  },
  {
    id: "associou_entidade",
    rotulo: "Me associei a uma entidade só para ter o plano",
    pontos: 3,
  },
  { id: "outro", rotulo: "Outro jeito", pontos: 2 },
];

export const OPCOES_REAJUSTE: Opcao<ReajusteAlto>[] = [
  { id: "sim", rotulo: "Sim", pontos: 2 },
  { id: "nao", rotulo: "Não", pontos: 0 },
  { id: "varia", rotulo: "Varia muito", pontos: 1 },
];

export const PONTUACAO_MAXIMA = 12;

// ─────────────── Textos dos 3 cenários ───────────────

export interface ApresentacaoNivel {
  emoji: string;
  rotulo: string;
  titulo: string;
  texto: string;
  cta: string;
}

export const APRESENTACAO: Record<NivelIndicio, ApresentacaoNivel> = {
  fortes: {
    emoji: "🔴",
    rotulo: "Fortes indícios de falso coletivo",
    titulo: "Seu contrato apresenta FORTES INDÍCIOS de falso coletivo",
    texto:
      "Pelos dados que você informou, seu contrato apresenta características típicas de falso coletivo — modalidade em que planos individuais são vendidos como empresariais para fugir das regras de reajuste da ANS. Se confirmado, você pode ter direito a reaver os valores pagos a mais nos últimos 36 meses.",
    cta: "Fale agora com nossa equipe no WhatsApp",
  },
  alguns: {
    emoji: "🟡",
    rotulo: "Apresenta alguns indícios",
    titulo: "Seu contrato apresenta ALGUNS INDÍCIOS que merecem análise",
    texto:
      "Alguns pontos do seu contrato chamam atenção e podem indicar irregularidades. Uma análise individual pode confirmar se há direito a revisão dos valores pagos.",
    cta: "Converse com nossa equipe",
  },
  nenhum: {
    emoji: "🟢",
    rotulo: "Não apresenta indícios claros",
    titulo: "Seu contrato não apresenta indícios claros de falso coletivo",
    texto:
      "Pelos dados informados, seu contrato não apresenta sinais típicos dessa irregularidade. Mas pode haver outros aspectos a analisar — reajustes abusivos, negativas indevidas, cláusulas desproporcionais. Nossa equipe pode fazer uma análise completa.",
    cta: "Fale com nossa equipe",
  },
};

// ─────────────── Cálculo ───────────────

export interface ResultadoFalsoColetivo {
  pontos: number;
  nivel: NivelIndicio;
}

function pontosDe<T extends string>(opcoes: Opcao<T>[], id: T): number {
  return opcoes.find((o) => o.id === id)?.pontos ?? 0;
}

export function rotuloDe<T extends string>(opcoes: Opcao<T>[], id: T): string {
  return opcoes.find((o) => o.id === id)?.rotulo ?? "—";
}

/** 8+ → fortes · 4 a 7 → alguns · 0 a 3 → nenhum. */
export function nivelPorPontos(pontos: number): NivelIndicio {
  if (pontos >= 8) return "fortes";
  if (pontos >= 4) return "alguns";
  return "nenhum";
}

export function calcularFalsoColetivo(
  r: RespostasFalsoColetivo,
): ResultadoFalsoColetivo {
  const pontos =
    pontosDe(OPCOES_TIPO_PLANO, r.tipoPlano) +
    pontosDe(OPCOES_VIDAS, r.vidas) +
    pontosDe(OPCOES_ENTRADA, r.entrada) +
    pontosDe(OPCOES_REAJUSTE, r.reajuste);
  return { pontos, nivel: nivelPorPontos(pontos) };
}
