/**
 * Logo — logotipo oficial Tayah Advogados.
 *
 * Usa next/image carregando /public/logo-tayah.png. A altura é controlada
 * por `className` (Tailwind: h-10, h-12, h-8…) e a largura fica em auto
 * para preservar a proporção do arquivo original.
 *
 * Props:
 *  - className: classes de dimensionamento (ex: "h-10 md:h-12 w-auto")
 *  - variant:   "default" (sobre fundo claro) | "footer" (sobre fundo escuro)
 *               O variant "footer" aplica filtro para exibir a logo em branco.
 */
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "default" | "footer";
  priority?: boolean;
}

export default function Logo({
  className = "h-10 w-auto",
  variant = "default",
  priority = false,
}: LogoProps) {
  // Dimensões intrínsecas declaradas ao next/image apenas para o cálculo
  // interno de layout. A renderização usa a altura do className e w-auto.
  const intrinsicWidth = 480;
  const intrinsicHeight = 120;

  // No rodapé o logo aparece sobre fundo escuro (#1A1A1A). Aplicamos um
  // filtro que converte o logo em branco — funciona para logotipos
  // predominantemente escuros, que é o caso padrão do Manual.
  const filterClass = variant === "footer" ? "brightness-0 invert" : "";

  return (
    <Image
      src="/logo-tayah.png"
      alt="Tayah Advogados"
      width={intrinsicWidth}
      height={intrinsicHeight}
      priority={priority}
      className={`${className} ${filterClass}`.trim()}
    />
  );
}
