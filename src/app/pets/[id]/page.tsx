"use client";

import React, { use } from "react";
import { notFound } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PetDetailView } from "@/views/PetDetailView";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

interface PetDetailsProps {
  params: Promise<{ id: string }>;
}

export default function PetDetailsPage({ params }: PetDetailsProps) {
  const { id } = use(params);
  const { pets, petsLoading, petsError, reloadPets } = useApp();

  const pet = pets.find((p) => p.id === id);

  if (petsLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando animal" /></div>;
  }

  if (petsError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-10 sm:px-6">
        <div role="alert" className="w-full space-y-4 rounded-3xl border border-destructive/30 bg-card p-6 text-center shadow-sm sm:p-8">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Não foi possível carregar este animal</h1>
            <p className="mt-1 text-sm text-muted-foreground">{petsError}</p>
          </div>
          <Button variant="outline" onClick={() => void reloadPets()} className="w-full rounded-full sm:w-auto">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!pet) {
    notFound();
  }

  return <PetDetailView pet={pet} />;
}
