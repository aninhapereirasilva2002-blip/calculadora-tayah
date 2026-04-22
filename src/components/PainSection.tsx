/**
 * PainSection — narrativa em 2ª pessoa + 3 cards de dados.
 * Paleta: fundo off-white, títulos em preto institucional, número
 * de destaque em vermelho Tayah.
 */

const CARDS = [
  {
    numero: "6,06%",
    titulo: "é o teto ANS para 2025",
    descricao:
      "Percentual máximo autorizado pela ANS para reajuste anual de planos individuais/familiares no período maio/2025–abril/2026.",
  },
  {
    numero: "17% a 25%",
    titulo: "é a faixa comum em planos coletivos",
    descricao:
      "Operadoras têm aplicado reajustes bem acima da inflação em contratos coletivos, muitas vezes sem apresentar a memória de cálculo exigida pela ANS.",
  },
  {
    numero: "5.400+",
    titulo: "reclamações na ANS em 2024",
    descricao:
      "Só no ano passado, milhares de consumidores registraram queixa contra reajustes considerados abusivos — e boa parte vira ação judicial.",
  },
];

export default function PainSection() {
  return (
    <section className="bg-offwhite">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <h2 className="font-black text-3xl md:text-5xl text-ink leading-tight">
            Você abriu o boleto, viu o novo valor e ficou sem fôlego.
          </h2>
          <div className="mt-6 space-y-4 text-lg text-ink/80 leading-relaxed">
            <p>
              Entre os contratos analisados pela equipe da Tayah Advogados
              em 2025, mais da metade tinha reajuste acima do autorizado
              pela ANS — e muitos consumidores nem sabiam que podiam
              contestar.
            </p>
            <p>
              Antes de aceitar o aumento, vale entender se ele cabe dentro
              do que a lei permite. É exatamente isso que esta calculadora
              faz.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div
              key={c.numero}
              className="rounded-lg bg-white border border-grey/30 p-6 shadow-sm"
            >
              <div className="font-black text-4xl md:text-5xl text-bordo leading-none mb-3">
                {c.numero}
              </div>
              <div className="font-bold text-ink mb-2">{c.titulo}</div>
              <p className="text-sm text-grey leading-relaxed">
                {c.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
