/**
 * Footer — identificação institucional Tayah Advogados.
 * Logo centralizado, dados de contato oficiais (Manual de Identidade
 * Visual) e disclaimer obrigatório do Provimento 205/2021 CFOAB.
 */
import Logo from "./Logo";

// Link externo Instagram — aberto em nova aba.
const INSTAGRAM_URL = "https://instagram.com/tayahadvogados";
const SITE_URL = "https://tayah.com.br";

export default function Footer() {
  const ano = 2026; // placeholder — ano fixo para não depender de runtime

  return (
    <footer className="bg-ink text-offwhite/85">
      <div className="max-w-5xl mx-auto px-6 py-14 md:py-16">
        {/* Logo centralizado */}
        <div className="flex justify-center mb-10">
          <Logo className="h-8 w-auto" variant="footer" />
        </div>

        {/* Dados de contato em grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed mb-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-offwhite/60 mb-2 font-bold">
              Endereço
            </div>
            <address className="not-italic">
              Av. Graça Aranha, 206 | 3º Andar
              <br />
              Centro | Rio de Janeiro – RJ
              <br />
              CEP 20.030-001
            </address>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-offwhite/60 mb-2 font-bold">
              Contato
            </div>
            <ul className="space-y-1">
              <li>
                Telefone:{" "}
                <a
                  href="tel:+552125447300"
                  className="hover:text-bordo transition-colors"
                >
                  +55 21 2544 7300
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/5521998917757"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bordo transition-colors"
                >
                  +55 21 99891-7757
                </a>
              </li>
              <li>
                E-mail:{" "}
                <a
                  href="mailto:atendimento1@tayah.com.br"
                  className="hover:text-bordo transition-colors"
                >
                  atendimento1@tayah.com.br
                </a>
              </li>
              <li>
                Site:{" "}
                <a
                  href={SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bordo transition-colors"
                >
                  tayah.com.br
                </a>
              </li>
              <li>
                Instagram:{" "}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bordo transition-colors"
                >
                  @tayahadvogados
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer obrigatório — Provimento 205/2021 CFOAB */}
        <p className="text-xs leading-relaxed text-offwhite/70 border-t border-offwhite/15 pt-8">
          Tayah Advogados — Dr. José Marco Tayah OAB/RJ nº 67.177. Este
          site tem finalidade meramente informativa, em conformidade com
          o Provimento nº 205/2021 do Conselho Federal da OAB. Não
          constitui oferta de serviços, captação de clientela, nem
          promessa de resultado. O conteúdo não substitui consulta
          jurídica individual.
        </p>

        <p className="mt-6 text-xs text-offwhite/50 text-center">
          © {ano} Tayah Advogados. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
