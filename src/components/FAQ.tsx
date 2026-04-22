/**
 * FAQ — 6 perguntas em accordion usando <details>/<summary> nativos.
 * Zero JS, totalmente acessível. Paleta: fundo off-white, texto ink,
 * ícone "+" em vermelho institucional.
 */

const PERGUNTAS = [
  {
    q: "Esta calculadora garante que meu reajuste é abusivo?",
    a: "Não. Ela identifica indícios com base em regras públicas da ANS e da jurisprudência, mas a análise conclusiva só pode ser feita por um advogado que leia seu contrato individualmente. O resultado aqui é sempre preliminar.",
  },
  {
    q: "Meus dados ficam armazenados?",
    a: "Somente os dados que você informa na etapa final (nome, e-mail e WhatsApp) são usados para retomar contato, se você autorizar. Não compartilhamos com terceiros. A política de privacidade detalha todos os usos.",
  },
  {
    q: "Qual a diferença entre plano individual e coletivo?",
    a: "Planos individuais/familiares são regulados diretamente pela ANS, que define o teto de reajuste anual. Planos coletivos (empresariais ou por adesão) seguem o que está no contrato com a pessoa jurídica contratante — e é aí que moram boa parte dos abusos.",
  },
  {
    q: "Posso contestar reajuste de anos anteriores?",
    a: "Sim, desde que respeitado o prazo prescricional. O STJ (Tema 610) fixou em 3 anos o prazo para cobrança de parcelas pagas indevidamente em planos de saúde. Por isso, quanto antes você analisa, melhor.",
  },
  {
    q: "Tenho 65 anos. Meu reajuste por idade é legal?",
    a: "Não. O Estatuto do Idoso (Lei 10.741/03) veda qualquer reajuste por mudança de faixa etária a partir dos 60 anos. Reajustes aplicados sob essa justificativa após os 60 costumam ser revertidos judicialmente.",
  },
  {
    q: "Preciso pagar para conversar com o escritório?",
    a: "A análise preliminar via calculadora é gratuita. A primeira conversa com a equipe Tayah Advogados pelo WhatsApp também. Se houver caso a ser levado adiante, os valores e o modelo de atuação são combinados antes de qualquer contratação.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-offwhite">
      <div className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-16 md:pb-24">
        <h2 className="font-black text-3xl md:text-5xl text-ink leading-tight mb-10 text-center">
          Perguntas frequentes
        </h2>
        <div className="space-y-3">
          {PERGUNTAS.map((p, i) => (
            <details
              key={i}
              className="group rounded-md border border-grey/40 bg-white px-5 py-4 open:border-bordo transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-ink">
                <span className="pr-4">{p.q}</span>
                <span
                  className="text-bordo text-xl transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink/80 leading-relaxed">{p.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
