"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Heart,
  SlidersHorizontal,
  Sparkles,
  PawPrint,
  ArrowRight
} from "lucide-react";
import { PawWatermark } from "@/components/ui/PawWatermark";

export function HomeView() {
  const { pets, isFavorite, toggleFavorite, currentUser, requireAuth } = useApp();

  // 5 animais dinâmicos do catálogo real (Supabase / AppContext)
  const dynamicPets = pets.slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-sky-200 dark:selection:bg-sky-900 selection:text-sky-900 dark:selection:text-sky-100 transition-colors duration-300">

      {/* ========================================================================= */}
      {/* 1. SEÇÃO HERO (AZUL-CLARA COM ANIMAIS NAS LATERAIS E DIVISÃO EM ONDA)     */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-[#AEE0FF] pt-12 sm:pt-16 pb-0 overflow-hidden">
        {/* Patinhas Decorativas no Banner em tom de azul levemente mais escuro */}
        {/* Patinha Superior Esquerda (acima do Dálmata) */}
        <div className="absolute left-[10%] sm:left-[14%] md:left-[18%] lg:left-[21%] top-6 sm:top-8 md:top-10 z-0">
          <PawWatermark
            rotate={-20}
            className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-sky-600/55 dark:text-sky-600/55"
          />
        </div>

        {/* Nova Patinha Meio Esquerda (posicionada mais para baixo) */}
        <div className="absolute left-[19%] sm:left-[22%] md:left-[25%] lg:left-[27%] bottom-14 sm:bottom-18 md:bottom-22 z-0">
          <PawWatermark
            rotate={14}
            className="w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-sky-600/50 dark:text-sky-600/50"
          />
        </div>

        {/* Patinha Inferior Esquerda (próxima à lateral do Dálmata) */}
        <div className="absolute left-[4%] sm:left-[7%] lg:left-[9%] bottom-20 sm:bottom-24 z-0">
          <PawWatermark
            rotate={24}
            className="w-8 h-8 sm:w-11 sm:h-11 lg:w-13 lg:h-13 text-sky-600/45 dark:text-sky-600/45"
          />
        </div>

        {/* Patinha Lateral Direita (perto do Border Collie) */}
        <div className="absolute right-[10%] sm:right-[14%] md:right-[18%] lg:right-[19%] top-20 sm:top-24 md:top-50 z-0">
          <PawWatermark
            rotate={18}
            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-sky-600/55 dark:text-sky-600/55"
          />
        </div>

        {/* Patinha Suave Superior Direita */}
        <div className="absolute right-[32%] top-4 sm:top-6 z-0 hidden sm:block">
          <PawWatermark
            rotate={-12}
            className="w-7 h-7 sm:w-9 sm:h-9 text-sky-600/40 dark:text-sky-600/40"
          />
        </div>

        {/* Animal da Lateral Esquerda (Dálmata espiando no canto inferior esquerdo, apoiado na onda) */}
        <div className="absolute left-0 bottom-3 sm:bottom-5 md:bottom-8 lg:bottom-10 z-10 w-32 sm:w-44 md:w-56 lg:w-72 max-w-[34vw] sm:max-w-none select-none pointer-events-none transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/home/hero-dog-left.png"
            alt="Cachorro Dálmata espiando"
            width={1024}
            height={859}
            priority
            className="w-full h-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Animal da Lateral Direita (Border Collie espiando colado na borda direita com focinho 100% visível) */}
        <div className="absolute right-0 bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12 z-10 w-24 sm:w-32 md:w-44 lg:w-56 max-w-[28vw] sm:max-w-none select-none pointer-events-none transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/home/hero-dog-right.png"
            alt="Cachorro Border Collie espiando pela borda"
            width={601}
            height={1024}
            priority
            className="w-full h-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Conteúdo Central Exclusivo do Hero (100% livre e sem sobreposição com os mascotes) */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center justify-center pt-2 sm:pt-4 pb-20 sm:pb-28 md:py-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/90 dark:border-white/10 text-sky-900 dark:text-sky-200 text-xs sm:text-sm font-bold shadow-sm mb-3 sm:mb-4 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Acolhimento & Adoção Responsável
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-sky-950 dark:text-sky-950 tracking-tight max-w-xs sm:max-w-md md:max-w-2xl leading-tight drop-shadow-sm px-2">
            Encontre o novo membro da sua família
          </h1>
          <p className="text-sky-900/85 dark:text-sky-950/85 text-xs sm:text-sm md:text-base font-medium max-w-xs sm:max-w-sm md:max-w-lg mt-2.5 sm:mt-3 leading-relaxed px-2">
            Conectamos protetores e adotantes conscientes em uma jornada transparente e cheia de afeto.
          </p>
        </div>

        {/* Divisão Ondulada Suave para a próxima seção */}
        <div className="w-full overflow-hidden leading-none z-20 relative -mb-1">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-10 sm:h-14 md:h-24 lg:h-28 text-background fill-current block transition-colors duration-300"
            preserveAspectRatio="none"
          >
            <path d="M0,32 C280,105 480,15 760,65 C1040,115 1280,25 1440,45 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CARDS DE AÇÕES COM ANIMAIS NO TOPO                                    */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-background pt-4 pb-16 sm:pb-20 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16 sm:gap-y-20 pt-10 sm:pt-14">

            {/* Card 1: Encontre seu companheiro (Beagle) */}
            <Link
              href="/pets"
              className="group relative flex flex-col items-center justify-between bg-gradient-to-b from-[#BEE5FE]/90 to-[#BEE5FE]/50 hover:from-[#BAE6FD] hover:to-[#BEE5FE] dark:from-[#BEE5FE] dark:to-[#BAE6FD]/90 border-2 border-sky-200/90 hover:border-sky-400/80 dark:border-sky-300 dark:hover:border-sky-400 rounded-3xl pt-14 sm:pt-16 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-xl dark:shadow-[0_8px_25px_rgba(56,189,248,0.15)] hover:-translate-y-2 transition-all duration-300 text-center min-h-[290px] max-w-sm mx-auto sm:max-w-none w-full"
            >
              {/* Pet Sobreposto no Topo */}
              <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 w-32 sm:w-40 pointer-events-none select-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/home/card-beagle.png"
                  alt="Beagle com patinhas apoiadas"
                  width={1024}
                  height={524}
                  className="w-full h-auto object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-col items-center">
                {/* Ícone Estilizado: Filtros */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 border border-sky-300/40 flex items-center justify-center text-sky-700 mb-3.5 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all">
                  <SlidersHorizontal className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-sky-800" />
                </div>

                <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-sky-950 transition-colors">
                  Encontre seu companheiro
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2.5">
                  Use os filtros para encontrar pets de acordo com espécie, idade, porte e outras características.
                </p>
              </div>

              <div className="mt-4 pt-3 w-full border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>Ver catálogo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Conheça antes de adotar (Gatinho Laranja) */}
            <Link
              href="/#como-funciona"
              className="group relative flex flex-col items-center justify-between bg-gradient-to-b from-[#BEE5FE]/90 to-[#BEE5FE]/50 hover:from-[#BAE6FD] hover:to-[#BEE5FE] dark:from-[#BEE5FE] dark:to-[#BAE6FD]/90 border-2 border-sky-200/90 hover:border-sky-400/80 dark:border-sky-300 dark:hover:border-sky-400 rounded-3xl pt-14 sm:pt-16 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-xl dark:shadow-[0_8px_25px_rgba(56,189,248,0.15)] hover:-translate-y-2 transition-all duration-300 text-center min-h-[290px] max-w-sm mx-auto sm:max-w-none w-full"
            >
              {/* Pet Sobreposto no Topo */}
              <div className="absolute -top-14 sm:-top-20 left-1/2 -translate-x-1/2 w-32 sm:w-40 pointer-events-none select-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/home/card-cat-orange.png"
                  alt="Gatinho laranja com patinhas apoiadas"
                  width={1024}
                  height={726}
                  className="w-full h-auto object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-col items-center">
                {/* Ícone Estilizado: Sparkles */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 border border-sky-300/40 flex items-center justify-center text-sky-700 mb-3.5 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-sky-800" />
                </div>

                <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-sky-950 transition-colors">
                  Conheça antes de adotar
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2.5">
                  Veja informações sobre cada pet, conheça sua personalidade e descubra se vocês combinam.
                </p>
              </div>

              <div className="mt-4 pt-3 w-full border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>Como funciona</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Salve seus favoritos (Dachshund) */}
            <Link
              href="/pets?favoritos=true"
              onClick={(e) => {
                if (!currentUser) {
                  e.preventDefault();
                  requireAuth("favorites", { redirectTo: "/pets?favoritos=true" });
                }
              }}
              className="group relative flex flex-col items-center justify-between bg-gradient-to-b from-[#BEE5FE]/90 to-[#BEE5FE]/50 hover:from-[#BAE6FD] hover:to-[#BEE5FE] dark:from-[#BEE5FE] dark:to-[#BAE6FD]/90 border-2 border-sky-200/90 hover:border-sky-400/80 dark:border-sky-300 dark:hover:border-sky-400 rounded-3xl pt-14 sm:pt-16 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-xl dark:shadow-[0_8px_25px_rgba(56,189,248,0.15)] hover:-translate-y-2 transition-all duration-300 text-center min-h-[290px] max-w-sm mx-auto sm:max-w-none w-full"
            >
              {/* Pet Sobreposto no Topo */}
              <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 w-32 sm:w-44 pointer-events-none select-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/home/card-dachshund.png"
                  alt="Dachshund de pelo longo com patinhas apoiadas"
                  width={1024}
                  height={441}
                  className="w-full h-auto object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-col items-center">
                {/* Ícone Estilizado: Coração */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 border border-sky-300/40 flex items-center justify-center text-rose-500 mb-3.5 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-rose-500 fill-rose-100" />
                </div>

                <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-sky-950 transition-colors">
                  Salve seus favoritos
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2.5">
                  Encontrou um pet que chamou sua atenção? Salve seus favoritos para encontrá-los novamente depois.
                </p>
              </div>

              <div className="mt-4 pt-3 w-full border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>Ver favoritos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Seu próximo melhor amigo (Gatinho Rajado) */}
            <Link
              href="/pets"
              className="group relative flex flex-col items-center justify-between bg-gradient-to-b from-[#BEE5FE]/90 to-[#BEE5FE]/50 hover:from-[#BAE6FD] hover:to-[#BEE5FE] dark:from-[#BEE5FE] dark:to-[#BAE6FD]/90 border-2 border-sky-200/90 hover:border-sky-400/80 dark:border-sky-300 dark:hover:border-sky-400 rounded-3xl pt-14 sm:pt-16 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-xl dark:shadow-[0_8px_25px_rgba(56,189,248,0.15)] hover:-translate-y-2 transition-all duration-300 text-center min-h-[290px] max-w-sm mx-auto sm:max-w-none w-full"
            >
              {/* Pet Sobreposto no Topo */}
              <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 w-32 sm:w-40 pointer-events-none select-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/home/card-cat-tabby.png"
                  alt="Gatinho rajado com patinhas apoiadas"
                  width={1024}
                  height={512}
                  className="w-full h-auto object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-col items-center">
                {/* Ícone Estilizado: Patinha */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 border border-sky-300/40 flex items-center justify-center text-sky-700 mb-3.5 shadow-sm group-hover:bg-white group-hover:scale-110 transition-all">
                  <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] text-sky-800" />
                </div>

                <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug group-hover:text-sky-950 transition-colors">
                  Seu próximo melhor amigo
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2.5">
                  Explore os animais disponíveis e encontre aquele que pode fazer parte da sua família.
                </p>
              </div>

              <div className="mt-4 pt-3 w-full border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>Adotar agora</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEÇÃO: OS 3 PILARES DA ADOÇÃO NO CONNECTPET                            */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="relative w-full bg-background py-12 sm:py-16 overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">

          {/* Título Estilizado em Azul Celeste */}
          <h2 className="font-bold text-2xl sm:text-4xl text-[#38BDF8] tracking-tight leading-tight max-w-xl mx-auto drop-shadow-sm">
            Os 3 Pilares da Adoção<br />no ConnectPet
          </h2>

          {/* Ilustração Panorâmica da Trilha com Pins e Patinhas */}
          <div className="relative w-full max-w-4xl mx-auto my-6 sm:my-8 px-2">
            <Image
              src="/images/home/pillars-illustration.png"
              alt="Os 3 Pilares da Adoção no ConnectPet"
              width={1024}
              height={341}
              priority
              className="w-full h-auto object-contain select-none"
            />
          </div>

          {/* 3 Colunas de Texto com os Títulos e Descrições de Cada Pilar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-6 mt-4 text-center">
            {/* Pilar 1 */}
            <div className="flex flex-col items-center px-4 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 md:bg-transparent md:dark:bg-transparent">
              <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center mb-2">
                1
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Encontre seu Pet
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 max-w-xs">
                Navegue pelo catálogo com filtros inteligentes. Tudo em um só lugar, tornando o processo ágil e eficiente.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="flex flex-col items-center px-4 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 md:bg-transparent md:dark:bg-transparent">
              <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center mb-2">
                2
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Divulgue + Fácil
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 max-w-xs">
                Centralize a divulgação dos pets e alcance pessoas realmente interessadas. Simplificamos a busca pelo lar perfeito.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="flex flex-col items-center px-4 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 md:bg-transparent md:dark:bg-transparent">
              <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center mb-2">
                3
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Gestão e Triagem
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 max-w-xs">
                Organize os pedidos de adoção, utilize nosso formulário de pré-adoção e encontre lares seguros para os animais.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO: DICAS PARA CUIDAR DO SEU PET (AZUL COM ONDA EM NUVEM E DICAS)  */}
      {/* ========================================================================= */}
      <section id="dicas" className="relative w-full bg-[#AEE0FF] pt-12 sm:pt-16 pb-0 overflow-hidden">

        {/* Patinhas decorativas distribuídas organicamente e de forma assimétrica pelo fundo azul
        {/* 1. Esquerda alta, inclinada perto da curva da nuvem *
        <div className="absolute left-[7%] sm:left-[11%] lg:left-[13%] top-16 sm:top-20 z-10">
          <PawWatermark
            rotate={-32}
            className="w-12 h-12 sm:w-15 sm:h-15 lg:w-17 lg:h-17 text-sky-600/55 dark:text-sky-300/35"
          />
        </div>

        {/* 2. Esquerda intermediária mais interna 
        <div className="absolute left-[16%] sm:left-[20%] lg:left-[23%] top-36 sm:top-40 z-10 hidden sm:block">
          <PawWatermark
            rotate={14}
            className="w-8 h-8 sm:w-11 sm:h-11 text-sky-600/40 dark:text-sky-300/25"
          />
        </div>

        {/* 3. Esquerda na borda extrema média-baixa 
        <div className="absolute left-[2%] sm:left-[4%] lg:left-[6%] top-[56%] -translate-y-1/2 z-10">
          <PawWatermark
            rotate={-18}
            className="w-10 h-10 sm:w-13 sm:h-13 lg:w-15 lg:h-15 text-sky-600/50 dark:text-sky-300/30"
          />
        </div>

        {/* 4. Esquerda inferior caminhando para o centro 
        <div className="absolute left-[12%] sm:left-[15%] lg:left-[18%] bottom-20 sm:bottom-24 z-10">
          <PawWatermark
            rotate={26}
            className="w-9 h-9 sm:w-12 sm:h-12 text-sky-600/45 dark:text-sky-300/30"
          />
        </div>

        {/* 5. Canto inferior esquerdo perto da onda 
        <div className="absolute left-[4%] sm:left-[7%] bottom-8 sm:bottom-10 z-10">
          <PawWatermark
            rotate={-8}
            className="w-11 h-11 sm:w-14 sm:h-14 text-sky-600/45 dark:text-sky-300/25"
          />
        </div>

        {/* 6. Centro-topo suave esquerdo 
        <div className="absolute left-[33%] top-8 sm:top-12 z-10 hidden md:block">
          <PawWatermark
            rotate={-12}
            className="w-7 h-7 sm:w-9 sm:h-9 text-sky-600/35 dark:text-sky-300/20"
          />
        </div>

        {/* 7. Direita alta bem perto do topo 
        <div className="absolute right-[14%] sm:right-[18%] lg:right-[21%] top-12 sm:top-14 z-10">
          <PawWatermark
            rotate={20}
            className="w-9 h-9 sm:w-12 sm:h-12 text-sky-600/45 dark:text-sky-300/30"
          />
        </div>

        {/* 8. Direita externa superior 
        <div className="absolute right-[3%] sm:right-[5%] lg:right-[8%] top-28 sm:top-32 z-10">
          <PawWatermark
            rotate={-25}
            className="w-12 h-12 sm:w-15 sm:h-15 lg:w-17 lg:h-17 text-sky-600/55 dark:text-sky-300/35"
          />
        </div>

        {/* 9. Direita média mais recolhida para dentro 
        <div className="absolute right-[11%] sm:right-[14%] lg:right-[16%] top-[50%] -translate-y-1/2 z-10">
          <PawWatermark
            rotate={12}
            className="w-10 h-10 sm:w-13 sm:h-13 text-sky-600/45 dark:text-sky-300/30"
          />
        </div>

        {/* 10. Direita borda extrema inferior  
        <div className="absolute right-[2%] sm:right-[4%] lg:right-[6%] bottom-28 sm:bottom-32 z-10">
          <PawWatermark
            rotate={-16}
            className="w-8 h-8 sm:w-11 sm:h-11 text-sky-600/40 dark:text-sky-300/25"
          />
        </div>

        {/* 11. Direita inferior caminhando para a onda de baixo 
        <div className="absolute right-[18%] sm:right-[22%] lg:right-[25%] bottom-10 sm:bottom-14 z-10">
          <PawWatermark
            rotate={30}
            className="w-11 h-11 sm:w-14 sm:h-14 text-sky-600/50 dark:text-sky-300/30"
          />
        </div>

        {/* 12. Centro-inferior direito perto da borda da onda  
        <div className="absolute right-[34%] bottom-6 sm:bottom-8 z-10 hidden md:block">
          <PawWatermark
            rotate={16}
            className="w-8 h-8 sm:w-10 sm:h-10 text-sky-600/35 dark:text-sky-300/20"
          />
        </div>  */}
        
        {/* Onda Superior Estilo Nuvem Conectando 'Como Funciona' e 'Dicas' */}
        <div className="w-full overflow-hidden leading-none absolute top-0 left-0 right-0 z-10 -mt-0.5">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-20 md:h-28 text-background fill-current block transition-colors duration-300"
            preserveAspectRatio="none"
          >
            <path d="M 0,0 L 1440,0 L 1440,30 C 1370,90 1290,115 1200,115 C 1110,115 1030,90 960,25 C 890,90 810,120 720,120 C 630,120 550,90 480,25 C 410,90 330,115 240,115 C 150,115 70,90 0,30 Z" />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 relative z-20 max-w-4xl text-center">
          
          {/* Composição Ilustrada com Fundo Transparente (Dachshund, Setas e Dicas) */}
          <div className="relative w-full max-w-2xl mx-auto my-2 sm:my-4 px-2 select-none">
            <Image
              src="/images/home/dicas-composition.png"
              alt="Dicas Para Cuidar do Seu Pet: Ambiente seguro, alimentação, socialização, brincadeiras e treinamento"
              width={1024}
              height={906}
              priority
              className="w-full h-auto object-contain mx-auto drop-shadow-sm"
            />
          </div>

        </div>

        {/* Onda Inferior Transição Azul -> Seção Seguinte */}
        <div className="w-full overflow-hidden leading-none relative z-10 -mb-[1px] mt-8 sm:mt-12">
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-20 md:h-28 text-background fill-current block transition-colors duration-300"
            preserveAspectRatio="none"
          >
            <path d="M0,45 C280,0 520,85 860,35 C1180,0 1360,70 1440,50 L1440,90 L0,90 Z" />
          </svg>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEÇÃO: CATÁLOGO DINÂMICO DE ANIMAIS (SUPABASE)                         */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-background pt-4 pb-16 sm:pb-24 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          {/* Grade com Cards de Pets Reais (Consumidos do Supabase / AppContext) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {dynamicPets.map((pet) => {
              const favorite = isFavorite(pet.id);
              const mainPhoto =
                pet.photos && pet.photos.length > 0 && pet.photos[0]
                  ? pet.photos[0]
                  : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop";

              return (
                <div
                  key={pet.id}
                  className="group relative flex flex-col bg-white dark:bg-[#0D1726] border-[3px] border-[#BAE6FD] hover:border-sky-400 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 transition-all duration-300 max-w-sm mx-auto sm:max-w-none w-full"
                >
                  {/* Foto do Pet com Moldura Azul Estilo Canva */}
                  <Link href={`/pets/${pet.id}`} className="relative aspect-square w-full overflow-hidden bg-sky-50 dark:bg-sky-950/40 block">
                    <Image
                      src={mainPhoto}
                      alt={pet.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Botão de Favorito no Canto Superior Direito */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(pet.id);
                      }}
                      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/95 dark:bg-slate-900/90 border border-transparent dark:border-white/10 backdrop-blur-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-rose-500 shadow-md hover:scale-110 active:scale-95 transition-all"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          favorite ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </Link>

                  {/* Informações Resumidas do Pet */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white dark:bg-[#0D1726]">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <Link href={`/pets/${pet.id}`}>
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                            {pet.name}
                          </h3>
                        </Link>
                        <span className="text-[11px] font-bold text-sky-950 bg-[#BEE5FE] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {pet.approximateAge || "1 ano"}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                        {pet.breed || "SRD"} • {pet.species === "dog" ? "Cachorro" : "Gato"}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-sky-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span className="line-clamp-1 font-medium">
                        {pet.location?.city || "São Paulo"}, {pet.location?.state || "SP"}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          pet.status === "available" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        title={pet.status === "available" ? "Disponível" : "Em Processo"}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Central Estilo Pílula Azul: Acessar Catálogo Completo com Filtros */}
          <div className="flex justify-center mt-10 sm:mt-14">
            <Link
              href="/pets"
              className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#BEE5FE] hover:bg-[#BAE6FD] text-sky-950 font-extrabold text-sm sm:text-base border border-sky-300/80 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Search className="w-5 h-5 text-sky-700 stroke-[2.5]" />
              <span>Acessar Catálogo Completo</span>
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
