"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import {
  PawPrint,
  Sparkles,
  Heart,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
  LogOut,
  ChevronDown,
  Compass,
  FileCheck2,
  LayoutDashboard,
  User,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    logout,
    favorites,
    pets,
    theme,
    setTheme,
    showFavoritesOnly,
    setShowFavoritesOnly,
    requireAuth
  } = useApp();

  const isCatalog = pathname === "/pets";

  const handleFavoritesClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      requireAuth("favorites", { redirectTo: "/pets?favoritos=true" });
      return;
    }
    if (isCatalog) {
      e.preventDefault();
      setShowFavoritesOnly((prev) => !prev);
    } else {
      setShowFavoritesOnly(true);
    }
  };

  const favoritesCount = pets.length > 0
    ? favorites.filter((favId) => pets.some((p) => p.id === favId)).length
    : favorites.filter((favId) => !favId.startsWith('pet-')).length;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const isAdopter = currentUser?.role === "adopter";
  const isGuardian = currentUser?.role === "guardian";

  const navLinks = [
    { label: "Início", href: "/", icon: null },
    { label: "Catálogo de Pets", href: "/pets", icon: PawPrint },
    { label: "Como Funciona", href: "/#como-funciona", icon: Compass },
    { label: "Smart Match", href: "/match", icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl transition-colors">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-8">
        
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl sm:text-2xl leading-none text-foreground tracking-tight">
              ConnectPet
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-secondary/40 border border-border/40 p-1.5 rounded-full">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Favorites, Theme & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Favorites Button */}
          <Link
            href="/pets?favoritos=true"
            onClick={handleFavoritesClick}
            className={`relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border transition-all ${
              isCatalog && showFavoritesOnly
                ? "bg-rose-500/15 border-rose-500/40 text-rose-500 shadow-sm"
                : "border-border/50 bg-card hover:bg-secondary/50 text-muted-foreground hover:text-rose-500"
            }`}
            title={isCatalog && showFavoritesOnly ? "Ver Todos os Pets" : "Ver Pets Favoritos"}
          >
            <Heart className={`w-5 h-5 ${favoritesCount > 0 || (isCatalog && showFavoritesOnly) ? "text-rose-500 fill-rose-500/20" : ""}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50">
                {favoritesCount}
              </span>
            )}
          </Link>

          {/* Theme Selector Button */}
          <div className="relative">
            <button
              onClick={() => {
                setThemeDropdownOpen(!themeDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border/50 bg-card hover:bg-secondary/50 text-muted-foreground transition-colors"
              title="Mudar Tema"
              aria-label="Mudar Tema"
            >
              {theme === "light" && <Sun className="w-5 h-5 text-amber-500" />}
              {theme === "dark" && <Moon className="w-5 h-5 text-indigo-400" />}
              {theme === "system" && <Laptop className="w-5 h-5 text-muted-foreground" />}
            </button>

            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-card border border-border/60 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setTheme("light");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                    theme === "light" ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" /> Claro
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                    theme === "dark" ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" /> Escuro
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                    theme === "system" ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <Laptop className="w-4 h-4 text-muted-foreground" /> Sistema
                </button>
              </div>
            )}
          </div>

          {/* User Account / Demo Profile Switcher */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setThemeDropdownOpen(false);
                }}
                className="flex items-center gap-2.5 p-1.5 pr-3 min-h-[44px] rounded-full border border-border/60 bg-card hover:border-primary/40 shadow-sm transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-primary/25 bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.avatar ? (
                    <Image
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-sky-700 dark:text-sky-300" />
                  )}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="max-w-32 truncate text-xs font-bold leading-tight text-foreground">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-medium text-primary leading-none">
                    {isAdopter ? "Adotante" : "ONG / Protetor"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2.5 border-b border-border/60 mb-2">
                    <p className="text-xs font-bold text-foreground">{currentUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                    <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      {isAdopter ? "Candidato a Tutor" : "ONG / Protetor"}
                    </span>
                  </div>

                  {/* Editar Perfil */}
                  <Link
                    href="/perfil"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-xl hover:bg-secondary transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-primary" /> Editar Perfil
                  </Link>

                  {/* Panel Shortcut */}
                  {isAdopter && (
                    <Link
                      href="/minhas-candidaturas"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-xl hover:bg-secondary transition-colors"
                    >
                      <FileCheck2 className="w-4 h-4 text-primary" /> Minhas Candidaturas
                    </Link>
                  )}

                  {isGuardian && (
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-xl hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" /> Painel da ONG
                    </Link>
                  )}



                  {/* Logout */}
                  <div className="border-t border-border/50 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-full text-xs min-h-[44px]">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full text-xs bg-primary hover:bg-primary/90 min-h-[44px]">
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-border/60 bg-card text-foreground"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background px-4 py-6 shadow-xl space-y-4 animate-in slide-in-from-top-4">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-primary" />}
                  {link.label}
                </Link>
              );
            })}

            {isAdopter && (
              <Link
                href="/minhas-candidaturas"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-secondary"
              >
                <FileCheck2 className="w-4 h-4 text-primary" /> Minhas Candidaturas
              </Link>
            )}

            {isGuardian && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-secondary"
              >
                <LayoutDashboard className="w-4 h-4 text-primary" /> Painel da ONG
              </Link>
            )}
          </nav>

          {/* Mobile User Actions */}
          <div className="pt-2 border-t border-border/50">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-2xl">
                  <div className="w-9 h-9 rounded-full overflow-hidden relative border border-primary/25 bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.avatar ? (
                      <Image
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-4.5 h-4.5 text-sky-700 dark:text-sky-300" />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-foreground">{currentUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-medium rounded-xl min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/perfil" className="flex items-center justify-center gap-2">
                    <UserCog className="w-3.5 h-3.5" /> Editar Perfil
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 rounded-xl min-h-[44px]"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" /> Sair da conta
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild className="rounded-xl text-xs min-h-[44px]" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl text-xs bg-primary hover:bg-primary/90 min-h-[44px]" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/cadastro">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
