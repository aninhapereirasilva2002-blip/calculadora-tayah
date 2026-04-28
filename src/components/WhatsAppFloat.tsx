"use client";

/**
 * WhatsAppFloat — botão circular fixo no canto inferior direito que
 * abre o WhatsApp institucional do escritório com mensagem pré-preenchida.
 *
 * Característica visual: animação "neon" (anel verde pulsando) definida
 * em globals.css como --animate-neon-pulse. O tooltip "Fale conosco"
 * aparece e some em ciclo (visível 2s, escondido 4s) para atrair o
 * olhar sem ficar permanentemente competindo com o conteúdo.
 */

import { useEffect, useState } from "react";
import { MENSAGEM_FLUTUANTE_PADRAO, linkWhatsapp } from "@/lib/contato";

export default function WhatsAppFloat() {
  const [tooltipVisivel, setTooltipVisivel] = useState(false);

  // Ciclo do tooltip: aparece por 2s (visível), some por 4s (escondido),
  // repete. O "primeiro disparo" só acontece após 1,5s para o usuário ver
  // a página antes do balão aparecer. Um único timeout que se re-agenda
  // mantém o ciclo correto sem múltiplos timers concorrentes.
  useEffect(() => {
    const ON_MS = 2000;
    const OFF_MS = 4000;
    let id: number | undefined;
    let proximoVisivel = true;
    function tick() {
      setTooltipVisivel(proximoVisivel);
      const espera = proximoVisivel ? ON_MS : OFF_MS;
      proximoVisivel = !proximoVisivel;
      id = window.setTimeout(tick, espera);
    }
    id = window.setTimeout(tick, 1500);
    return () => {
      if (id !== undefined) window.clearTimeout(id);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip — balão branco com pontinha apontando pro botão */}
      <div
        aria-hidden="true"
        className={`relative bg-white text-ink font-bold text-sm px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 ${
          tooltipVisivel
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        Fale conosco
        {/* Pontinha do balão (quadradinho rotacionado) */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rotate-45" />
      </div>

      {/* Botão circular com animação neon.
          A animação é aplicada via inline style (não via classe Tailwind)
          para evitar qualquer indireção: `neon-pulse` é o keyframe declarado
          em globals.css ao nível do documento. O box-shadow do keyframe já
          inclui a profundidade — por isso NÃO usamos shadow-2xl aqui, que
          competiria pelo mesmo box-shadow durante a execução do keyframe. */}
      <a
        href={linkWhatsapp(MENSAGEM_FLUTUANTE_PADRAO)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar conosco pelo WhatsApp"
        style={{ animation: "neon-pulse 2s ease-in-out infinite" }}
        className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] hover:bg-[#20bd5a] transition-colors"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}

/**
 * Ícone WhatsApp em SVG inline. Caminho derivado do logo oficial,
 * monocromático branco para contrastar com o fundo verde.
 */
function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      fill="white"
      aria-hidden="true"
      className="md:w-8 md:h-8"
    >
      <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.378.7 4.59 1.9 6.452L4 29l7.728-1.866a11.94 11.94 0 0 0 4.275.79h.005C22.635 27.924 28 22.55 28 15.92 28 12.7 26.74 9.67 24.46 7.39A11.93 11.93 0 0 0 16.003 3Zm0 21.84h-.004a9.93 9.93 0 0 1-5.06-1.385l-.363-.215-4.586 1.107 1.124-4.467-.236-.376a9.92 9.92 0 0 1-1.518-5.5c.002-5.49 4.47-9.957 9.96-9.957 2.66 0 5.16 1.037 7.04 2.92a9.876 9.876 0 0 1 2.913 7.043c-.003 5.49-4.47 9.83-9.27 9.83Zm5.46-7.444c-.298-.15-1.766-.872-2.04-.972-.273-.1-.473-.15-.672.15-.198.298-.77.972-.945 1.172-.174.198-.348.223-.646.075-.298-.15-1.258-.464-2.396-1.479-.886-.79-1.484-1.766-1.658-2.064-.174-.298-.018-.46.13-.608.134-.133.298-.348.447-.522.149-.174.198-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.672-1.62-.92-2.218-.243-.583-.49-.504-.672-.513l-.572-.01a1.1 1.1 0 0 0-.795.373c-.273.298-1.044 1.02-1.044 2.49s1.069 2.888 1.218 3.087c.149.198 2.103 3.213 5.097 4.503.713.308 1.27.49 1.704.628.715.227 1.366.195 1.881.118.574-.085 1.766-.722 2.014-1.42.249-.696.249-1.292.174-1.42-.074-.124-.272-.198-.57-.348Z" />
    </svg>
  );
}
