/**
 * Hero — chamada principal com o vermelho institucional (cor dominante
 * do Manual de Identidade Visual Tayah). Sub-headline + CTA âncora.
 */
export default function Hero() {
  return (
    <section
      id="topo"
      className="relative bg-bordo text-offwhite scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-28 md:pb-32">
        <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-offwhite/80 mb-6 font-bold">
          Tayah Advogados · Direito da Saúde
        </p>
        <h1 className="font-black text-4xl md:text-6xl leading-[1.05] max-w-4xl">
          Seu plano de saúde subiu mais de 20%? O aumento pode não estar
          de acordo com a lei.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-offwhite/90 leading-relaxed max-w-2xl">
          Ferramenta informativa gratuita que analisa o reajuste do seu
          plano em 7 perguntas e aponta, em minutos, se há indícios de
          abusividade.
        </p>
        <div className="mt-10">
          <a
            href="#calculadora"
            className="inline-block px-7 py-4 rounded-md bg-ink text-offwhite font-bold uppercase tracking-wide text-sm shadow-md transition-colors hover:bg-offwhite hover:text-bordo"
          >
            Analisar meu reajuste agora
          </a>
        </div>
      </div>
    </section>
  );
}
