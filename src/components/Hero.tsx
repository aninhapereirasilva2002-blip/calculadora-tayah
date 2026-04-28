/**
 * Hero — versão "forte" da chamada principal.
 *
 * Estrutura:
 *  - Coluna esquerda (60% no desktop): tag de credibilidade,
 *    headline com palavra-chave em vermelho, sub-headline,
 *    3 bullets verdes, 2 CTAs (analisar / falar conosco), prova social.
 *  - Coluna direita (40%, escondida no mobile): 3 cards de "dados duros"
 *    sobre reajustes — entram com slide-left escalonado.
 *
 * Animações declaradas em globals.css como --animate-slide-up e
 * --animate-slide-left. Os atrasos dos cards são aplicados via
 * inline style para escalonar 300/500/700ms.
 */
import { MENSAGEM_FLUTUANTE_PADRAO, linkWhatsapp } from "@/lib/contato";

export default function Hero() {
  const linkConsulta = linkWhatsapp(MENSAGEM_FLUTUANTE_PADRAO);

  return (
    <section
      id="topo"
      // Gradiente diagonal: off-white institucional → vermelho clarinho.
      // Mantém a paleta da marca sem precisar comprar imagem.
      className="relative bg-[linear-gradient(135deg,#FAFAF7_0%,#FAFAF7_45%,#F5E6E6_100%)] scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 min-h-[80vh] md:min-h-screen flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12 items-center w-full">
          {/* ─────────── Coluna esquerda (3/5 desktop) ─────────── */}
          <div className="md:col-span-3 animate-[var(--animate-slide-up)]">
            <span className="inline-block bg-bordo text-white text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] px-3 py-1.5 rounded">
              ⚖️ Direito da Saúde · 60 anos de tradição
            </span>

            <h1 className="mt-6 font-black text-[36px] md:text-[56px] leading-[1.05] text-ink">
              Seu plano subiu mais de 20%? Pode ser{" "}
              <span className="text-bordo">ABUSIVO.</span>
            </h1>

            <p className="mt-5 text-base md:text-xl text-[#555] leading-[1.4] max-w-2xl">
              Calculadora gratuita desenvolvida pela equipe Tayah Advogados.
              Em 2 minutos você descobre se o reajuste do seu plano de saúde
              está acima do permitido — e qual o valor estimado de
              restituição.
            </p>

            <ul className="mt-7 space-y-2.5">
              <BulletCheck texto="Análise técnica em minutos" />
              <BulletCheck texto="Cálculo de valores estimados de restituição" />
              <BulletCheck texto="Sem custo · Sem compromisso" />
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#calculadora"
                className="inline-block text-center px-8 py-5 rounded-md bg-bordo text-white font-bold text-base md:text-lg shadow-md hover:bg-bordo-dark transition-colors"
              >
                Analisar meu reajuste agora
              </a>
              <a
                href={linkConsulta}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center px-8 py-5 rounded-md border-2 border-bordo text-bordo font-bold text-base md:text-lg hover:bg-bordo hover:text-white transition-colors"
              >
                Falar com a equipe
              </a>
            </div>

            <p className="mt-6 text-sm text-grey">
              Tayah Advogados · OAB/RJ desde 1965 · Sede em Centro/RJ
            </p>
          </div>

          {/* ─────────── Coluna direita (2/5 desktop) ─────────── */}
          <div className="hidden md:flex md:col-span-2 flex-col gap-4">
            <CardDado
              numero="6,06%"
              rotulo="Teto ANS para individuais 2025-2026"
              delayMs={300}
            />
            <CardDado
              numero="Até 25%"
              rotulo="Reajuste médio em coletivos"
              delayMs={500}
            />
            <CardDado
              numero="+5.400"
              rotulo="Reclamações na ANS em 2024"
              delayMs={700}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BulletCheck({ texto }: { texto: string }) {
  return (
    <li className="flex items-start gap-3 text-ink">
      <CheckIcon />
      <span className="text-base md:text-lg leading-snug">{texto}</span>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="22"
      height="22"
      aria-hidden="true"
      className="mt-0.5 flex-shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill="#16A34A" />
      <path
        d="M5.5 10.5l3 3 6-6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CardDado({
  numero,
  rotulo,
  delayMs,
}: {
  numero: string;
  rotulo: string;
  delayMs: number;
}) {
  return (
    <div
      className="bg-white rounded-lg shadow-xl border border-grey/15 p-5 md:p-6 animate-[var(--animate-slide-left)]"
      // Atraso escalonado para criar a sensação de cards "caindo" em sequência.
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="font-black text-bordo text-3xl md:text-4xl leading-none">
        {numero}
      </div>
      <div className="mt-2 text-sm md:text-base text-grey font-bold leading-snug">
        {rotulo}
      </div>
    </div>
  );
}
