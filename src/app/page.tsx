/**
 * Landing page única da calculadora de revisão de reajuste.
 * Composição de seções; o único trecho client é a própria calculadora.
 */
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PainSection from "@/components/PainSection";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Calculator from "@/components/Calculator";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <PainSection />

      {/* Calculadora — ID âncora usado pelo CTA do hero. */}
      <section
        id="calculadora"
        className="bg-white scroll-mt-24"
        aria-label="Calculadora de revisão de reajuste"
      >
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-grey mb-3 font-bold">
              Análise preliminar em 7 passos
            </p>
            <h2 className="font-black text-3xl md:text-5xl text-ink leading-tight">
              Vamos analisar o seu reajuste.
            </h2>
            <p className="mt-4 text-grey">
              Leva cerca de 2 minutos. Nenhum dado é enviado antes da
              última etapa.
            </p>
          </div>
          <Calculator />
        </div>
      </section>

      <FAQ />
      <Footer />

      {/* Botão flutuante: fixo, visível em qualquer scroll. */}
      <WhatsAppFloat />
    </>
  );
}
