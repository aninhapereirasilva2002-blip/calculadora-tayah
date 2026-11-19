/**
 * /api/lead — recebe o preenchimento da calculadora pública de
 * FALSO COLETIVO (v3, teste dos 3 requisitos) e dispara uma notificação
 * por email para o endereço configurado em EMAIL_DESTINO via Resend.
 *
 * Fluxo:
 *  1. Cliente responde as 5 perguntas + dados de contato e clica
 *     "Ver meu diagnóstico"
 *  2. Calculator.tsx faz POST para esta rota com as respostas (ids)
 *  3. Aqui validamos com Zod, RECALCULAMOS o resultado no servidor
 *     (não confiamos em pontuação vinda do cliente) e enviamos via Resend
 *  4. A UX do cliente NÃO depende dessa chamada — falhas são logadas
 *     no console mas não bloqueiam a tela de resultado.
 *
 * Segurança: o endpoint é público. Para produção, considerar:
 *  - rate-limit por IP (KV/Redis ou middleware)
 *  - honeypot/captcha leve no formulário
 *  - validação de origem (Origin/Referer)
 */
import { z } from "zod";
import { Resend } from "resend";
import {
  APRESENTACAO,
  MENSALIDADE_MAX,
  MENSALIDADE_MIN,
  OPCOES_REAJUSTE,
  OPCOES_TEMPO,
  OPCOES_VIDAS,
  OPCOES_VINCULO,
  ROTULO_STATUS,
  calcularFalsoColetivo,
  formatMoedaBR,
  formatPontos,
  rotuloDe,
  type ResultadoFalsoColetivo,
  type StatusRequisito,
} from "@/lib/calculator-falso-coletivo";

// O SDK da Resend usa primitivos do Node; força o runtime correto.
export const runtime = "nodejs";

const PayloadSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  whatsapp: z.string().min(1),
  respostas: z.object({
    vinculo: z.enum([
      "clt",
      "socio_outras_atividades",
      "abriu_so_para_plano",
      "nao_sei",
    ]),
    vidas: z.enum(["so_eu", "de_2_a_29", "30_ou_mais", "nao_sei"]),
    reajuste: z.enum([
      "ate_6",
      "de_6_a_10",
      "de_10_a_20",
      "mais_20",
      "nao_lembro",
    ]),
    mensalidade: z.number().min(MENSALIDADE_MIN).max(MENSALIDADE_MAX),
    tempo: z.enum(["menos_1", "de_1_a_3", "de_3_a_5", "mais_5"]),
  }),
});

type Payload = z.infer<typeof PayloadSchema>;

export async function POST(request: Request) {
  console.log("[API/lead] Requisição recebida");
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Corpo da requisição inválido (JSON)." },
      { status: 400 },
    );
  }

  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "Payload inválido.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.EMAIL_DESTINO;
  if (!apiKey || !destino || apiKey === "PLACEHOLDER_TROCAR_DEPOIS") {
    console.error(
      "[/api/lead] RESEND_API_KEY ausente/placeholder ou EMAIL_DESTINO ausente.",
    );
    return Response.json(
      {
        success: false,
        error:
          "Configuração de email indisponível. Defina RESEND_API_KEY e EMAIL_DESTINO no .env.local.",
      },
      { status: 500 },
    );
  }

  const dados = parsed.data;
  const resultado = calcularFalsoColetivo(dados.respostas);
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      // Domínio padrão do Resend, funciona sem configuração de DNS.
      from: "onboarding@resend.dev",
      to: destino,
      subject: montarAssunto(dados, resultado),
      html: montarEmailHTML(dados, resultado),
    });
    if (error) {
      console.error("[/api/lead] Resend retornou erro:", error);
      return Response.json(
        { success: false, error: error.message ?? "Falha ao enviar email." },
        { status: 502 },
      );
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error("[/api/lead] Exceção ao enviar email:", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido.",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// Composição do email
// ============================================================

const COR_STATUS: Record<StatusRequisito, string> = {
  cumprido: "#16A34A",
  parcial: "#D97706",
  nao_cumprido: "#8A8D8F",
};

function montarAssunto(d: Payload, r: ResultadoFalsoColetivo): string {
  const a = APRESENTACAO[r.veredito];
  return `🔔 Novo lead (Falso Coletivo) — ${d.nome} — ${a.emoji} ${a.rotulo} ${r.percentual}%`;
}

function formatarDataHora(): string {
  return new Date().toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

/** Escape mínimo para impedir injeção de tags via dados do formulário. */
function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function montarLinkWhatsapp(d: Payload): string {
  const limpo = d.whatsapp.replace(/\D/g, "");
  const primeiroNome = d.nome.trim().split(/\s+/)[0];
  const mensagem =
    `Olá ${primeiroNome}, sou do escritório Tayah Advogados. ` +
    `Recebi suas respostas no nosso teste de falso coletivo ` +
    `e gostaria de conversar sobre o seu caso.`;
  return `https://wa.me/55${limpo}?text=${encodeURIComponent(mensagem)}`;
}

function montarEmailHTML(d: Payload, r: ResultadoFalsoColetivo): string {
  const ap = APRESENTACAO[r.veredito];
  const linkWpp = montarLinkWhatsapp(d);
  const dataHora = formatarDataHora();

  const linhasContato = [
    { rotulo: "Nome", valor: escapeHTML(d.nome) },
    {
      rotulo: "Email",
      valor: `<a href="mailto:${escapeHTML(d.email)}" style="color: #9E2A2B; text-decoration: none;">${escapeHTML(d.email)}</a>`,
    },
    {
      rotulo: "WhatsApp",
      valor: `<a href="${linkWpp}" style="color: #9E2A2B; text-decoration: none;">${escapeHTML(d.whatsapp)}</a>`,
    },
  ];

  const resp = d.respostas;
  const linhasCalculadora = [
    {
      rotulo: "1. Vínculo prévio",
      valor: escapeHTML(rotuloDe(OPCOES_VINCULO, resp.vinculo)),
    },
    {
      rotulo: "2. Pessoas no contrato",
      valor: escapeHTML(rotuloDe(OPCOES_VIDAS, resp.vidas)),
    },
    {
      rotulo: "3. Último reajuste",
      valor: escapeHTML(rotuloDe(OPCOES_REAJUSTE, resp.reajuste)),
    },
    {
      rotulo: "4. Mensalidade atual",
      valor: formatMoedaBR(resp.mensalidade),
    },
    {
      rotulo: "5. Tempo de contrato",
      valor: escapeHTML(rotuloDe(OPCOES_TEMPO, resp.tempo)),
    },
  ];

  const renderLinhas = (linhas: Array<{ rotulo: string; valor: string }>) =>
    linhas
      .map(
        (l) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; color: #8A8D8F; font-size: 13px; vertical-align: top; white-space: nowrap;">${l.rotulo}</td>
          <td style="padding: 6px 0; color: #1A1A1A; font-size: 14px; font-weight: 600;">${l.valor}</td>
        </tr>`,
      )
      .join("");

  const checklist = r.requisitos
    .map((req) => {
      const st = ROTULO_STATUS[req.status];
      return `
        <tr>
          <td style="padding: 6px 10px 6px 0; font-size: 16px; vertical-align: top; width: 24px;">${st.icone}</td>
          <td style="padding: 6px 12px 6px 0; color: #1A1A1A; font-size: 14px;"><strong>Requisito ${req.numero}</strong> — ${escapeHTML(req.nome)}</td>
          <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: ${COR_STATUS[req.status]}; white-space: nowrap; text-align: right;">${st.texto}</td>
        </tr>`;
    })
    .join("");

  const secao = (titulo: string, conteudo: string, margemBaixo = 24) => `
      <div style="margin: 0 32px ${margemBaixo}px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #8A8D8F; margin-bottom: 12px;">
          ${titulo}
        </div>
        <table style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
          ${conteudo}
        </table>
      </div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Novo lead — Tayah Advogados</title>
</head>
<body style="margin: 0; padding: 0; background: #FAFAF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1A1A1A;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <div style="background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

      <!-- Header vermelho -->
      <div style="background: #9E2A2B; padding: 28px 32px; color: #FFFFFF;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.85;">
          Tayah Advogados
        </div>
        <div style="font-size: 24px; font-weight: 900; margin-top: 6px; line-height: 1.2;">
          Novo lead recebido
        </div>
        <div style="font-size: 13px; margin-top: 8px; opacity: 0.85;">
          Teste dos 3 requisitos · Falso Coletivo · ${escapeHTML(dataHora)}
        </div>
      </div>

      <!-- Card destaque (veredito + porcentagem) -->
      <div style="margin: 24px 32px; padding: 20px 24px; background: #F5F5F5; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #8A8D8F;">
          Veredito
        </div>
        <div style="margin-top: 4px; font-size: 28px; font-weight: 900; color: ${ap.cor}; line-height: 1.15;">
          ${ap.emoji} ${escapeHTML(ap.rotulo)} · ${r.percentual}%
        </div>
        <div style="margin-top: 6px; font-size: 14px; color: #1A1A1A;">
          ${escapeHTML(ap.titulo)}
        </div>
        <div style="margin-top: 8px; font-size: 13px; color: #8A8D8F;">
          ${formatPontos(r.pontos)} de 3 pontos nos requisitos
        </div>
      </div>

      ${secao("Checklist dos 3 requisitos", checklist)}
      ${secao("Dados de contato", renderLinhas(linhasContato))}
      ${secao("Respostas da calculadora", renderLinhas(linhasCalculadora), 28)}

      <!-- CTA WhatsApp -->
      <div style="margin: 0 32px 32px; text-align: center;">
        <a href="${linkWpp}"
           style="display: inline-block; background: #25D366; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 28px; border-radius: 8px;">
          💬 Falar com este cliente no WhatsApp
        </a>
      </div>

    </div>
    <div style="margin-top: 16px; text-align: center; color: #8A8D8F; font-size: 12px;">
      Tayah Advogados · Notificação automática da calculadora pública
    </div>
  </div>
</body>
</html>`;
}
