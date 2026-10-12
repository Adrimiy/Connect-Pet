"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pet } from "@/types";
import { useApp } from "@/context/AppContext";
import { PreAdoptionModal } from "@/components/adoption/PreAdoptionModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  montarLinkRedeSocial,
  obterPerfilPublicoGuardiao,
  PerfilPublicoGuardiao
} from "@/lib/perfilPublicoGuardiao";
import {
  Heart,
  ShieldCheck,
  Sparkles,
  MapPin,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Share2,
  Globe,
  CalendarHeart,
  PawPrint
} from "lucide-react";

interface PetDetailViewProps {
  pet: Pet;
}

export function PetDetailView({ pet }: PetDetailViewProps) {
  const router = useRouter();
  const { currentUser, isFavorite, toggleFavorite, showToast } = useApp();

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
  const [perfilGuardiao, setPerfilGuardiao] = useState<PerfilPublicoGuardiao | null>(null);
  const [apresentacaoExpandida, setApresentacaoExpandida] = useState(false);

  // Carrega a apresentação pública do responsável (história/missão, selo e redes)
  useEffect(() => {
    let cancelado = false;
    obterPerfilPublicoGuardiao(pet.guardianId).then((perfil) => {
      if (!cancelado) setPerfilGuardiao(perfil);
    });
    return () => {
      cancelado = true;
    };
  }, [pet.guardianId]);

  const apresentacaoGuardiao = perfilGuardiao?.apresentacao ?? null;
  const apresentacaoLonga = (apresentacaoGuardiao?.length ?? 0) > 180;
  const linkRedeSocial = perfilGuardiao?.redesSociais ? montarLinkRedeSocial(perfilGuardiao.redesSociais) : null;
  const membroDesdeTexto = perfilGuardiao?.membroDesde
    ? new Date(perfilGuardiao.membroDesde).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  const favorite = isFavorite(pet.id);
  const guardianPhoneDigits = pet.guardianPhone.replace(/\D/g, "");
  const locationText = [pet.location.neighborhood, pet.location.city, pet.location.state].filter(Boolean).join(", ") || "Localização não informada";

  const handleAdoptClick = () => {
    if (!currentUser) {
      showToast("Autenticação necessária", "Faça login ou cadastre-se para iniciar a pré-adoção.", "info");
      router.push("/login?redirect=" + encodeURIComponent(`/pets/${pet.id}`));
      return;
    }
    if (currentUser.role !== "adopter") {
      showToast("Perfil de gestão", "Use uma conta de adotante para enviar uma candidatura.", "info");
      return;
    }
    setIsAdoptionModalOpen(true);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${pet.name} no ConnectPet`,
          text: `Conheça ${pet.name}, disponível no ConnectPet.`,
          url: window.location.href
        });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copiado!", "Compartilhe para ajudar este animal a encontrar um lar.", "success");
        return;
      }
      throw new Error("Compartilhamento indisponível");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast("Não foi possível compartilhar", "Copie o endereço desta página diretamente do navegador.", "warning");
    }
  };

  const sizeLabels = {
    small: "Porte Pequeno",
    medium: "Porte Médio",
    large: "Porte Grande"
  };

  const sexLabels = {
    male: "Macho",
    female: "Fêmea"
  };

  const statusMap = {
    available: { label: "Disponível para Adoção", className: "bg-emerald-500 text-white" },
    in_process: { label: "Em Processo de Triagem", className: "bg-amber-500 text-white" },
    adopted: { label: "Adotado com Amor", className: "bg-stone-500 text-white" }
  };

  const currentStatus = statusMap[pet.status] || statusMap.available;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-16 min-h-screen space-y-6 sm:space-y-8 md:space-y-10">
      
      {/* Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="ghost" asChild className="rounded-full text-xs hover:bg-secondary min-h-[44px] justify-start sm:justify-center w-fit">
          <Link href="/pets">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Catálogo
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-full text-xs min-h-[44px] flex-1 sm:flex-none"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Compartilhar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFavorite(pet.id)}
            className={`rounded-full text-xs min-h-[44px] flex-1 sm:flex-none ${favorite ? "text-rose-500 border-rose-500/30 bg-rose-500/10" : ""}`}
          >
            <Heart className={`w-3.5 h-3.5 mr-1.5 ${favorite ? "fill-rose-500" : ""}`} />
            {favorite ? "Favoritado" : "Favoritar"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Gallery + Core Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
        
        {/* Left: Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main HD Image */}
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden border border-border shadow-md bg-secondary">
            <Image
              src={pet.photos[selectedPhotoIndex] || pet.photos[0]}
              alt={pet.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md ${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {pet.photos.length > 1 && (
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
              {pet.photos.map((photo, index) => (
                <button
                  key={photo}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={`relative w-20 sm:w-24 h-16 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedPhotoIndex === index ? "border-primary scale-95 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`${pet.name} miniatura ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Overview & CTA (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {pet.species === "dog" ? "Cão Resgatado" : "Gato Resgatado"} • {pet.breed}
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground mt-1">
                {pet.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{locationText}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
              <Badge variant="secondary" className="rounded-xl px-2.5 py-1 text-xs">
                {sizeLabels[pet.size]}
              </Badge>
              <Badge variant="secondary" className="rounded-xl px-2.5 py-1 text-xs">
                {sexLabels[pet.sex]}
              </Badge>
              <Badge variant="secondary" className="rounded-xl px-2.5 py-1 text-xs">
                {pet.approximateAge}
              </Badge>
            </div>

            {/* Headline */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-secondary/50 border border-border/60">
              <p className="text-xs sm:text-sm font-medium text-foreground italic leading-relaxed">
                &ldquo;{pet.headline}&rdquo;
              </p>
            </div>

            {/* Quick Health Status Highlights */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
              <div className={`p-2.5 sm:p-3 rounded-2xl border ${pet.vaccinated ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-secondary border-border text-muted-foreground"}`}>
                <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${pet.vaccinated ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                <span className="font-bold block text-[11px] sm:text-xs">{pet.vaccinated ? "Vacinado" : "Não vacinado"}</span>
              </div>

              <div className={`p-2.5 sm:p-3 rounded-2xl border ${pet.castrated ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                <Sparkles className={`w-4 h-4 mx-auto mb-1 ${pet.castrated ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-bold block text-[11px] sm:text-xs">{pet.castrated ? "Castrado" : "Não castrado"}</span>
              </div>

              <div className={`p-2.5 sm:p-3 rounded-2xl border ${pet.dewormed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-secondary border-border text-muted-foreground"}`}>
                <ShieldCheck className={`w-4 h-4 mx-auto mb-1 ${pet.dewormed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                <span className="font-bold block text-[11px] sm:text-xs">{pet.dewormed ? "Vermifugado" : "Não vermifugado"}</span>
              </div>
            </div>

          </div>

          {/* Action Button: Quero Adotar */}
          <div className="pt-3 sm:pt-4 border-t border-border/60 space-y-2.5 sm:space-y-3">
            <Button
              size="lg"
              onClick={handleAdoptClick}
              disabled={pet.status === "adopted"}
              className="w-full h-12 sm:h-14 rounded-full text-sm sm:text-base font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
            >
              <Heart className="w-5 h-5 mr-2 fill-current" />
              {pet.status === "adopted" ? "Animal Já Adotado" : `Quero Adotar ${pet.name}`}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Adoção consciente e gratuita. Exige preenchimento de dossiê e idade mínima de 21 anos.
            </p>
          </div>

        </div>

      </div>

      {/* Deep Details: Story, Medical Record, Behavior & Guardian Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 pt-4 sm:pt-6">
        
        {/* Story & Behavior (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {/* Rescue Story */}
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              História de Resgate
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {pet.story}
            </p>
          </div>

          {/* Behavior & Temperament */}
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Comportamento e Convivência
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {pet.temperamentDescription}
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs">
                <span className="font-semibold text-foreground">Nível de energia</span>
                <p className="mt-1 text-muted-foreground">{{ calm: "Calmo", moderate: "Moderado", high: "Alto" }[pet.energyLevel]}</p>
              </div>
              {[
                ["Crianças", pet.compatibleWithChildren],
                ["Cães", pet.compatibleWithDogs],
                ["Gatos", pet.compatibleWithCats]
              ].map(([rotulo, compatibilidade]) => (
                <div key={rotulo} className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs">
                  <span className="font-semibold text-foreground">Convivência com {rotulo.toLocaleLowerCase("pt-BR")}</span>
                  <p className="mt-1 text-muted-foreground">
                    {{ yes: "Boa convivência observada", no: "Não recomendada", unknown: "Ainda não avaliada" }[compatibilidade]}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Traços Marcantes:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {pet.temperament.map((trait) => (
                  <span
                    key={trait}
                    className="px-2.5 sm:px-3 py-1 rounded-xl bg-secondary font-semibold text-xs text-foreground"
                  >
                    #{trait}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Medical Record */}
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Ficha Médica & Cuidados Veterinários
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-foreground">Vacinação Aplicada:</span>
                <span className="text-muted-foreground">{pet.vaccinationDetails || "Detalhes não informados."}</span>
              </div>

              {pet.specialNeeds && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-start gap-2 text-foreground">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Observações e Necessidades Especiais:</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{pet.specialNeeds}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Guardian Institutional Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-secondary/30 border border-border/60 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-2xl after:rounded-2xl shrink-0">
                {perfilGuardiao?.avatar && (
                  <AvatarImage src={perfilGuardiao.avatar} alt={`Logo de ${pet.guardianName}`} className="rounded-2xl" />
                )}
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {pet.guardianType === "ngo" ? "ONG responsável" : "Protetor independente"}
                </span>
                <h4 className="font-bold text-lg text-foreground leading-tight break-words">
                  {pet.guardianName}
                </h4>
                {perfilGuardiao?.verificado && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Responsável verificado
                  </span>
                )}
              </div>
            </div>

            {/* História / missão cadastrada no perfil do responsável */}
            {apresentacaoGuardiao ? (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground">
                  {pet.guardianType === "ngo" ? "Nossa história e missão" : "Sobre o protetor"}
                </h5>
                <p
                  className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words ${
                    apresentacaoLonga && !apresentacaoExpandida ? "line-clamp-4" : ""
                  }`}
                >
                  {apresentacaoGuardiao}
                </p>
                {apresentacaoLonga && (
                  <button
                    type="button"
                    onClick={() => setApresentacaoExpandida((valorAtual) => !valorAtual)}
                    aria-expanded={apresentacaoExpandida}
                    className="min-h-[44px] -my-2 text-xs font-semibold text-primary hover:underline"
                  >
                    {apresentacaoExpandida ? "Ler menos" : "Ler mais"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Este responsável publicou o animal e recebe as candidaturas enviadas pela plataforma para análise e contato.
              </p>
            )}

            {perfilGuardiao && (membroDesdeTexto || perfilGuardiao.totalAnimaisDisponiveis > 0) && (
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-foreground">
                {membroDesdeTexto && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary">
                    <CalendarHeart className="w-3.5 h-3.5 text-primary" /> Na plataforma desde {membroDesdeTexto}
                  </span>
                )}
                {perfilGuardiao.totalAnimaisDisponiveis > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary">
                    <PawPrint className="w-3.5 h-3.5 text-primary" />
                    {perfilGuardiao.totalAnimaisDisponiveis === 1
                      ? "1 animal disponível"
                      : `${perfilGuardiao.totalAnimaisDisponiveis} animais disponíveis`}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{[pet.location.city, pet.location.state].filter(Boolean).join(", ") || "Localização não informada"}</span>
              </div>
              {perfilGuardiao?.redesSociais && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  {linkRedeSocial ? (
                    <a
                      href={linkRedeSocial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all min-h-[44px] inline-flex items-center hover:text-primary hover:underline"
                    >
                      {perfilGuardiao.redesSociais}
                    </a>
                  ) : (
                    <span className="break-all">{perfilGuardiao.redesSociais}</span>
                  )}
                </div>
              )}
              {pet.guardianEmail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="break-all">{pet.guardianEmail}</span>
                </div>
              )}
              {pet.guardianPhone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{pet.guardianPhone}</span>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Contact Button */}
            {guardianPhoneDigits.length >= 10 && (
            <div className="pt-2">
              <Button
                variant="outline"
                asChild
                className="w-full rounded-2xl text-xs font-semibold h-11 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <a
                  href={`https://wa.me/55${guardianPhoneDigits}?text=${encodeURIComponent(
                    `Olá! Encontrei o pet ${pet.name} no ConnectPet e gostaria de tirar dúvidas sobre o processo de adoção responsável.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Tirar Dúvidas no WhatsApp
                </a>
              </Button>
            </div>
            )}
          </div>
        </div>

      </div>

      {/* Pre-Adoption Modal Wizard */}
      <PreAdoptionModal
        key={`${pet.id}-${currentUser?.id ?? "visitante"}`}
        pet={pet}
        isOpen={isAdoptionModalOpen}
        onClose={() => setIsAdoptionModalOpen(false)}
      />

    </div>
  );
}
