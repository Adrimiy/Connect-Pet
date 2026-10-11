"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash, Loader2, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ManagePetsPage() {
  const { currentUser, authLoading, pets, petsLoading, petsError, deletePet } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [estaExcluindo, setEstaExcluindo] = useState(false);

  const myPets = pets.filter((p) => {
    if (!currentUser) return false;
    return p.guardianId === currentUser.id;
  });

  const handleDelete = async () => {
    if (!deleteId || estaExcluindo) return;
    setEstaExcluindo(true);
    if (await deletePet(deleteId)) setDeleteId(null);
    setEstaExcluindo(false);
  };

  const statusLabel = {
    available: "Disponível",
    in_process: "Em Processo",
    adopted: "Adotado"
  };

  if (authLoading || petsLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando animais" /></div>;
  }

  if (currentUser?.role !== "guardian") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4">
        <div className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-serif text-2xl font-bold">Gestão restrita</h1>
          <p className="text-sm text-muted-foreground">Entre com um perfil de ONG ou doador para gerenciar animais.</p>
          <Button asChild className="w-full rounded-full"><Link href="/login?redirect=/dashboard/pets">Entrar</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Pets</h1>
          <p className="text-muted-foreground">Gerencie os animais que você disponibilizou para adoção.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pets/novo">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Pet
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Pets</CardTitle>
          <CardDescription>Visualize, edite ou remova os animais do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {petsError ? (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center text-sm text-destructive">
              {petsError}
            </div>
          ) : myPets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Você ainda não tem nenhum pet cadastrado.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/pets/novo">Comece adicionando o primeiro</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myPets.map((pet) => (
                <article key={pet.id} className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-foreground">{pet.name}</h2>
                      <p className="text-xs text-muted-foreground">{pet.species === "dog" ? "Cachorro" : "Gato"} • {pet.size}</p>
                    </div>
                    <Badge variant={pet.status === "available" ? "default" : "secondary"} className="shrink-0">
                      {statusLabel[pet.status] || pet.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                    <Button variant="outline" size="sm" asChild className="w-full text-xs">
                      <Link href={`/dashboard/pets/${pet.id}/editar`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      onClick={() => setDeleteId(pet.id)}
                    >
                      <Trash className="mr-1 h-3.5 w-3.5" /> Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-foreground">Excluir este animal?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Essa ação não pode ser desfeita. O pet será removido permanentemente da base de dados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={estaExcluindo} onClick={() => setDeleteId(null)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={estaExcluindo} className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                {estaExcluindo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</> : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
