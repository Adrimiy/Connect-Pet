"use client";

import React, { use } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PetForm } from "@/components/pets/PetForm";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";

interface EditPetPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPetPage({ params }: EditPetPageProps) {
  const { id } = use(params);
  const { pets, petsLoading, petsError, reloadPets, authLoading, currentUser } = useApp();
  const pet = pets.find((p) => p.id === id);
  const podeEditar = !!pet && !!currentUser && pet.guardianId === currentUser.id;

  if (petsLoading || authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando edição" /></div>;
  }

  if (petsError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-10 sm:px-6">
        <div role="alert" className="w-full space-y-4 rounded-3xl border border-destructive/30 bg-card p-6 text-center shadow-sm sm:p-8">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Não foi possível carregar o animal</h1>
          <p className="text-sm text-muted-foreground">{petsError}</p>
          <Button variant="outline" onClick={() => void reloadPets()} className="min-h-[44px] w-full sm:w-auto">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!podeEditar) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Pet indisponível para edição</h1>
            <p className="text-sm text-muted-foreground">Este animal não pertence ao perfil conectado ou não foi encontrado.</p>
          </div>
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <Link href="/dashboard">Voltar ao painel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Pet</h1>
        <p className="text-muted-foreground">Atualize as informações de {pet.name}.</p>
      </div>

      <PetForm initialData={pet} isEditing />
    </div>
  );
}
