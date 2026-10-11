"use client";

import Link from "next/link";
import { PetForm } from "@/components/pets/PetForm";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Building2, Loader2 } from "lucide-react";

export default function NovoPetPage() {
  const { currentUser, authLoading } = useApp();

  if (authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando cadastro" /></div>;
  }

  if (currentUser?.role !== "guardian") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4">
        <div className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <Building2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-serif text-2xl font-bold">Cadastro restrito</h1>
          <p className="text-sm text-muted-foreground">Entre com um perfil de ONG ou doador para publicar animais.</p>
          <Button asChild className="w-full rounded-full"><Link href="/login?redirect=/dashboard/pets/novo">Entrar</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Novo Pet</h1>
        <p className="text-muted-foreground">Preencha as informações do animal para disponibilizá-lo para adoção.</p>
      </div>

      <PetForm />
    </div>
  );
}
