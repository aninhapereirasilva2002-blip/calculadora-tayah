/**
 * Header — barra superior fixa com o logo Tayah à esquerda.
 * Altura 64px no mobile, 80px no desktop (Manual de Identidade Visual).
 * Fundo branco com sombra sutil para destacar do conteúdo.
 */
import Logo from "./Logo";

export default function Header() {
  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 bg-white shadow-sm flex items-center px-6 md:px-10"
    >
      <a
        href="#topo"
        aria-label="Tayah Advogados — ir para o início"
        className="flex items-center"
      >
        <Logo className="h-10 md:h-12 w-auto" priority />
      </a>
    </header>
  );
}
