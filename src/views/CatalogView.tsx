"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PetCard } from "@/components/pets/PetCard";
import { Button } from "@/components/ui/button";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Heart,
  PawPrint,
  Loader2,
  AlertCircle
} from "lucide-react";

interface FilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  species: string;
  setSpecies: (val: string) => void;
  size: string;
  setSize: (val: string) => void;
  sex: string;
  setSex: (val: string) => void;
  ageCategory: string;
  setAgeCategory: (val: string) => void;
  guardianType: string;
  setGuardianType: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  onlyCastrated: boolean;
  setOnlyCastrated: (val: boolean) => void;
  onlyVaccinated: boolean;
  setOnlyVaccinated: (val: boolean) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: (val: boolean) => void;
  availableCities: string[];
  resetFilters: () => void;
}

function FilterPanel({
  species,
  setSpecies,
  size,
  setSize,
  sex,
  setSex,
  ageCategory,
  setAgeCategory,
  guardianType,
  setGuardianType,
  city,
  setCity,
  onlyCastrated,
  setOnlyCastrated,
  onlyVaccinated,
  setOnlyVaccinated,
  onlyFavorites,
  setOnlyFavorites,
  availableCities,
  resetFilters
}: Omit<FilterProps, 'searchQuery' | 'setSearchQuery'>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtros Acumulativos
        </h3>
        <button
          onClick={resetFilters}
          className="flex min-h-[44px] items-center gap-1 px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <RotateCcw className="w-3 h-3" /> Limpar
        </button>
      </div>

      {/* Somente Favoritos Switch */}
      <div className="min-h-[44px] p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
        <label htmlFor="onlyFavorites" className="flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-rose-700 cursor-pointer dark:text-rose-400">
          <Heart className="w-4 h-4 fill-current" /> Somente Meus Favoritos
        </label>
        <input
          id="onlyFavorites"
          type="checkbox"
          checked={onlyFavorites}
          onChange={(e) => setOnlyFavorites(e.target.checked)}
          className="w-4 h-4 rounded text-rose-500 accent-rose-500 cursor-pointer"
        />
      </div>

      {/* Espécie */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Espécie</label>
        <div className="grid grid-cols-3 gap-1.5">
          {["all", "dog", "cat"].map((item) => (
            <button
              key={item}
              onClick={() => setSpecies(item)}
              className={`flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                species === item
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item === "all" ? "Todos" : item === "dog" ? "Cachorro" : "Gato"}
            </button>
          ))}
        </div>
      </div>

      {/* Porte */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Porte</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: "all", label: "Todos" },
            { id: "small", label: "Pequeno" },
            { id: "medium", label: "Médio" },
            { id: "large", label: "Grande" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSize(item.id)}
              className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all min-h-[44px] flex items-center justify-center ${
                size === item.id
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sexo */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Sexo</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "all", label: "Todos" },
            { id: "male", label: "Macho" },
            { id: "female", label: "Fêmea" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSex(item.id)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center ${
                sex === item.id
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Faixa Etária */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Idade</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "all", label: "Todas" },
            { id: "puppy", label: "Filhote" },
            { id: "young", label: "Jovem" },
            { id: "adult", label: "Adulto" },
            { id: "senior", label: "Sênior (+7a)" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAgeCategory(item.id)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all min-h-[44px] flex items-center justify-center ${
                ageCategory === item.id
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de Protetor */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Doador Responsável</label>
        <select
          value={guardianType}
          onChange={(e) => setGuardianType(e.target.value)}
          className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="all">Todos os Doadores</option>
          <option value="ngo">Apenas ONGs</option>
          <option value="individual">Protetores Independentes</option>
        </select>
      </div>

      {/* Cidade Dinâmica */}
      {availableCities.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Cidade / Região</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="all">Todas as Cidades</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Checkboxes de Saúde */}
      <div className="space-y-2.5 pt-2 border-t border-border/50">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Saúde Veterinária</label>
        
        <label className="flex min-h-[44px] items-center gap-2 text-xs text-foreground font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={onlyCastrated}
            onChange={(e) => setOnlyCastrated(e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          Somente Animais Castrados
        </label>

        <label className="flex min-h-[44px] items-center gap-2 text-xs text-foreground font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={onlyVaccinated}
            onChange={(e) => setOnlyVaccinated(e.target.checked)}
            className="w-4 h-4 rounded text-primary accent-primary"
          />
          Somente Vacinação Completa
        </label>
      </div>

    </div>
  );
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const { pets, petsLoading, petsError, reloadPets, favorites, showFavoritesOnly, setShowFavoritesOnly, currentUser, requireAuth } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [species, setSpecies] = useState("all");
  const [size, setSize] = useState("all");
  const [sex, setSex] = useState("all");
  const [ageCategory, setAgeCategory] = useState("all");
  const [guardianType, setGuardianType] = useState("all");
  const [city, setCity] = useState("all");
  const [onlyCastrated, setOnlyCastrated] = useState(false);
  const [onlyVaccinated, setOnlyVaccinated] = useState(false);

  const isFavoritosUrl = searchParams.get("favoritos") === "true";
  const isAuthenticated = Boolean(currentUser);

  // Filtro de favoritos só pode ser ativado por usuários autenticados
  const handleSetOnlyFavorites = (value: boolean) => {
    if (value && !requireAuth("favorites", { redirectTo: "/pets?favoritos=true" })) return;
    setShowFavoritesOnly(value);
  };

  useEffect(() => {
    if (!isFavoritosUrl) return;
    if (isAuthenticated) {
      setShowFavoritesOnly(true);
    } else {
      requireAuth("favorites", { redirectTo: "/pets?favoritos=true" });
    }
  }, [isFavoritosUrl, isAuthenticated, requireAuth, setShowFavoritesOnly]);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Dynamic list of unique cities
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    pets.forEach((p) => {
      if (p.location?.city) {
        set.add(`${p.location.city}, ${p.location.state}`);
      }
    });
    return Array.from(set);
  }, [pets]);

  // Reset Filters
  const resetFilters = () => {
    setSearchQuery("");
    setSpecies("all");
    setSize("all");
    setSex("all");
    setAgeCategory("all");
    setGuardianType("all");
    setCity("all");
    setOnlyCastrated(false);
    setOnlyVaccinated(false);
    setShowFavoritesOnly(false);
  };

  // Filter computation
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = pet.name.toLowerCase().includes(q);
        const matchBreed = pet.breed.toLowerCase().includes(q);
        const matchCity = pet.location.city.toLowerCase().includes(q);
        const matchTemperament = pet.temperament.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchBreed && !matchCity && !matchTemperament) {
          return false;
        }
      }

      // Species
      if (species !== "all" && pet.species !== species) return false;

      // Size
      if (size !== "all" && pet.size !== size) return false;

      // Sex
      if (sex !== "all" && pet.sex !== sex) return false;

      // Age Category
      if (ageCategory !== "all" && pet.ageCategory !== ageCategory) return false;

      // Guardian Type
      if (guardianType !== "all" && pet.guardianType !== guardianType) return false;

      // City
      if (city !== "all") {
        const petCityKey = `${pet.location.city}, ${pet.location.state}`;
        if (petCityKey !== city) return false;
      }

      // Castrated
      if (onlyCastrated && !pet.castrated) return false;

      // Vaccinated
      if (onlyVaccinated && !pet.vaccinated) return false;

      // Favorites
      if (showFavoritesOnly && !favorites.includes(pet.id)) return false;

      return true;
    });
  }, [
    pets,
    searchQuery,
    species,
    size,
    sex,
    ageCategory,
    guardianType,
    city,
    onlyCastrated,
    onlyVaccinated,
    showFavoritesOnly,
    favorites
  ]);

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-16 min-h-screen space-y-6 sm:space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 sm:pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Adoção Responsável
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-1">
            Catálogo de Animais para Adoção
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {filteredPets.length} {filteredPets.length === 1 ? "animal encontrado" : "animais encontrados"} no catálogo de adoção responsável.
          </p>
        </div>

        {/* Search & Mobile Filter Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, raça, cidade..."
              className="w-full pl-10 pr-9 py-2.5 min-h-[44px] rounded-full border border-border bg-card text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden rounded-full shrink-0 flex items-center gap-2 min-h-[44px] px-4"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtros
          </Button>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
        
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 p-6 rounded-3xl bg-card border border-border/60 shadow-sm sticky top-28">
          <FilterPanel
            species={species}
            setSpecies={setSpecies}
            size={size}
            setSize={setSize}
            sex={sex}
            setSex={setSex}
            ageCategory={ageCategory}
            setAgeCategory={setAgeCategory}
            guardianType={guardianType}
            setGuardianType={setGuardianType}
            city={city}
            setCity={setCity}
            onlyCastrated={onlyCastrated}
            setOnlyCastrated={setOnlyCastrated}
            onlyVaccinated={onlyVaccinated}
            setOnlyVaccinated={setOnlyVaccinated}
            onlyFavorites={showFavoritesOnly}
            setOnlyFavorites={handleSetOnlyFavorites}
            availableCities={availableCities}
            resetFilters={resetFilters}
          />
        </aside>

        {/* Mobile Drawer */}
        {isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
            <div className="w-full max-w-xs sm:max-w-sm bg-card h-full p-5 sm:p-6 pb-12 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="font-bold text-lg text-foreground">Filtros</h3>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
                  aria-label="Fechar filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterPanel
                species={species}
                setSpecies={setSpecies}
                size={size}
                setSize={setSize}
                sex={sex}
                setSex={setSex}
                ageCategory={ageCategory}
                setAgeCategory={setAgeCategory}
                guardianType={guardianType}
                setGuardianType={setGuardianType}
                city={city}
                setCity={setCity}
                onlyCastrated={onlyCastrated}
                setOnlyCastrated={setOnlyCastrated}
                onlyVaccinated={onlyVaccinated}
                setOnlyVaccinated={setOnlyVaccinated}
                onlyFavorites={showFavoritesOnly}
                setOnlyFavorites={handleSetOnlyFavorites}
                availableCities={availableCities}
                resetFilters={resetFilters}
              />

              <Button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full rounded-full bg-primary min-h-[44px]"
              >
                Ver Resultados ({filteredPets.length})
              </Button>
            </div>
          </div>
        )}

        {/* Pet Cards Grid */}
        <section className="lg:col-span-3 space-y-6">
          {petsLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-border/60 bg-card">
              <div className="space-y-3 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                <p className="text-sm">Carregando animais...</p>
              </div>
            </div>
          ) : petsError ? (
            <div role="alert" className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-bold text-foreground">Catálogo indisponível</h3>
                <p className="mt-1 text-sm text-muted-foreground">{petsError}</p>
              </div>
              <Button onClick={() => void reloadPets()} variant="outline" className="min-h-[44px] rounded-full">Tentar novamente</Button>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="p-12 rounded-3xl bg-secondary/30 border border-border/60 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground mx-auto flex items-center justify-center">
                <PawPrint className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Nenhum animal encontrado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  {pets.length === 0
                    ? "Ainda não há animais publicados para adoção. Volte em breve."
                    : "Tente alterar seus termos de busca ou remover alguns filtros acumulativos para visualizar outros pets."}
                </p>
              </div>
              {pets.length > 0 && <Button onClick={resetFilters} variant="outline" className="min-h-[44px] rounded-full text-xs">Limpar Todos os Filtros</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPets.map((pet, index) => (
                <PetCard key={pet.id} pet={pet} priority={index < 3} />
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  );
}
