/**
 * contato.ts — dados institucionais de contato do escritório.
 * Centralizar aqui evita números/textos duplicados pelo projeto.
 */

// WhatsApp INSTITUCIONAL do escritório Tayah Advogados.
// Formato internacional E.164 sem o "+" (só dígitos).
export const WHATSAPP_TAYAH = "5521998917757";

// Mensagem usada pelo botão flutuante (visitante anônimo, sem contexto).
export const MENSAGEM_FLUTUANTE_PADRAO =
  "Olá! Vim pelo site e gostaria de tirar uma dúvida sobre meu plano de saúde.";

/** Monta o link wa.me com mensagem opcional já encodada. */
export function linkWhatsapp(mensagem?: string): string {
  const base = `https://wa.me/${WHATSAPP_TAYAH}`;
  if (!mensagem) return base;
  return `${base}?text=${encodeURIComponent(mensagem)}`;
}
