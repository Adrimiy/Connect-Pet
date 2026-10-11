"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Pet } from "@/types";
import { useApp } from "@/context/AppContext";
import { Heart, MapPin, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PetCardProps {
  pet: Pet;
  priority?: boolean;
}

export function PetCard({ pet, priority = false }: PetCardProps) {
  const { isFavorite, toggleFavorite } = useApp();
  const favorite = isFavorite(pet.id);

  const statusMap = {
    available: { label: "Disponível", className: "bg-emerald-500/90 text-white" },
    in_process: { label: "Em Processo", className: "bg-amber-500/90 text-white" },
    adopted: { label: "Adotado com Amor", className: "bg-stone-500/90 text-white" }
  };

  const currentStatus = statusMap[pet.status] || statusMap.available;

  const sizeLabels = {
    small: "Porte Pequeno",
    medium: "Porte Médio",
    large: "Porte Grande"
  };

  const sexLabels = {
    male: "Macho",
    female: "Fêmea"
  };

  const mainPhoto =
    pet.photos && pet.photos.length > 0 && pet.photos[0]
      ? pet.photos[0]
      : "/images/pet-placeholder.svg";

  const temperamentList = Array.isArray(pet.temperament) ? pet.temperament : [];
  const cityText = [pet.location?.city, pet.location?.state].filter(Boolean).join(", ") || "Localização não informada";

  return (
    <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 max-w-md mx-auto sm:max-w-none w-full">

      {/* Top Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        <Image
          src={mainPhoto}
          alt={pet.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Status Badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md shadow-sm ${currentStatus.className}`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pet.id);
          }}
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-foreground hover:scale-110 active:scale-95 transition-all shadow-md"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${favorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-rose-500"
              }`}
          />
        </button>

        {/* Pet Name and Headline on image bottom */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              {pet.name}
            </h3>
            <span className="text-xs font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {pet.approximateAge || "Idade não informada"}
            </span>
          </div>
          <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-medium">
            {pet.breed || "SRD"}
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3.5 sm:space-y-4">

        {/* Attributes row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-lg text-[11px] font-medium">
            {sizeLabels[pet.size] || "Porte Médio"}
          </Badge>
          <Badge variant="secondary" className="rounded-lg text-[11px] font-medium">
            {sexLabels[pet.sex] || "Macho"}
          </Badge>
          {pet.vaccinated && (
            <Badge variant="outline" className="rounded-lg text-[11px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Vacinado
            </Badge>
          )}
          {pet.castrated && (
            <Badge variant="outline" className="rounded-lg text-[11px] text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" /> Castrado
            </Badge>
          )}
        </div>

        {/* Headline text */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          &ldquo;{pet.headline || "Informações em atualização."}&rdquo;
        </p>

        {/* Temperament tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {temperamentList.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
          {temperamentList.length > 3 && (
            <span className="text-[10px] text-muted-foreground px-1 py-0.5">
              +{temperamentList.length - 3}
            </span>
          )}
        </div>

        {/* Footer info: Location, Guardian & Action Link */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between mt-auto text-xs">
          <div className="flex max-w-40 items-center gap-1 truncate text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{cityText}</span>
          </div>

          <Link
            href={`/pets/${pet.id}`}
            className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-0.5 transition-transform hover:underline min-h-[44px] py-2"
          >
            Ver Detalhes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
