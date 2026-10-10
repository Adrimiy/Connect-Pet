import React from "react";
import Link from "next/link";
import { PawPrint, Heart, ShieldAlert, CheckCircle, Scale } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#AEE0FF] text-slate-800 transition-colors duration-300 overflow-hidden">
      
      {/* Onda Superior Suave em Azul-Claro conectando com precisão absoluta ao fundo da página */}
      <div className="w-full overflow-hidden leading-none -mt-px">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 sm:h-12 text-background fill-current block transition-colors duration-300"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,25 C1100,55 860,10 520,40 C240,65 80,20 0,35 Z" />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-8 pt-4 pb-12 space-y-10">
        
        {/* Barra Superior do Rodapé (Logo e Links Estilo Canva) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-sky-300/60">
          
          {/* Logo ConnectPet com Patinha */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white text-sky-600 border border-sky-200/50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <PawPrint className="w-6 h-6 fill-current" />
            </div>
            <span className="font-serif font-extrabold text-2xl tracking-tight text-sky-950">
              ConnectPet
            </span>
          </Link>

          {/* Links Rápidos Estilo Referência Visual */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-bold text-sky-950">
            <Link href="/" className="hover:text-sky-700 transition-colors">
              Início
            </Link>
            <Link href="/pets" className="hover:text-sky-700 transition-colors">
              Catálogo
            </Link>
            <Link href="/pets?favoritos=true" className="hover:text-sky-700 transition-colors">
              Favoritos
            </Link>
            <Link href="/match" className="hover:text-sky-700 transition-colors">
              SmartMatch
            </Link>
            <Link href="/perfil" className="hover:text-sky-700 transition-colors">
              Perfil
            </Link>
          </nav>

        </div>

        {/* Conscientização Legal e Ética (Lei 9.605/98) */}
        <div className="rounded-3xl p-6 bg-white/85 backdrop-blur-sm border border-sky-200/80 text-slate-800 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-700" />
              Abandono e Maus-Tratos é Crime (Lei Federal nº 9.605/98 - Art. 32)
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Pena de reclusão de 2 a 5 anos, multa e proibição da guarda. Adotar é um compromisso vitalício de amor, segurança e dedicação integral.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> Posse Responsável
            </span>
          </div>
        </div>

        {/* Linha Inferior com Copyright */}
        <div className="pt-4 border-t border-sky-300/40 flex flex-col sm:flex-row items-center justify-between text-xs text-sky-950 font-medium gap-3">
          <p>© 2026 ConnectPet • Adoção Consciente e Responsável. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-[11px] text-sky-900/80">
            <span className="hover:text-sky-950 cursor-pointer transition-colors">Privacidade & LGPD</span>
            <span className="hover:text-sky-950 cursor-pointer transition-colors">Termos de Uso</span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Salve Vidas
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
