"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ApplicationStatus,
  PetAdoptionStatus
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  FileCheck2,
  BarChart3,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Building2,
  Loader2,
  AlertCircle,
  Pencil
} from "lucide-react";

export function GuardianDashboardView() {
  const {
    currentUser,
    authLoading,
    pets,
    petsLoading,
    petsError,
    reloadPets,
    updatePet,
    deletePet,
    applications,
    applicationsLoading,
    applicationsError,
    reloadApplications,
    updateApplicationStatus,
    updateGuardianNotes,
    sendApplicationMessage
  } = useApp();

  const isGuardian = currentUser?.role === "guardian";

  const guardianPets = useMemo(() => {
    if (!currentUser) return [];
    return pets.filter((pet) => pet.guardianId === currentUser.id);
  }, [pets, currentUser]);

  const guardianPetIds = useMemo(() => new Set(guardianPets.map((p) => p.id)), [guardianPets]);

  const guardianApplications = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter(
      (a) => a.guardianId === currentUser.id || guardianPetIds.has(a.petId)
    );
  }, [applications, currentUser, guardianPetIds]);

  const [activeTab, setActiveTab] = useState<"animals" | "applications" | "metrics">("animals");
  const [searchAnimal, setSearchAnimal] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [petIdParaExcluir, setPetIdParaExcluir] = useState<string | null>(null);
  const [estaExcluindoPet, setEstaExcluindoPet] = useState(false);

  const selectedApplication = useMemo(() => {
    if (guardianApplications.length === 0) return null;
    if (selectedApplicationId) {
      const found = guardianApplications.find((a) => a.id === selectedApplicationId);
      if (found) return found;
    }
    return guardianApplications[0] || null;
  }, [guardianApplications, selectedApplicationId]);

  const [chatMessage, setChatMessage] = useState("");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const activeNote = selectedApplication
    ? (editingNotes[selectedApplication.id] ?? selectedApplication.guardianNotes ?? "")
    : "";
  const petParaExcluir = guardianPets.find((pet) => pet.id === petIdParaExcluir) || null;

  // Filtered animals
  const filteredPets = guardianPets.filter((p) =>
    p.name.toLowerCase().includes(searchAnimal.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchAnimal.toLowerCase())
  );

  // Status badges config
  const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    under_review: { label: "Em Avaliação", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
    approved: { label: "Aprovada", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Não Aprovada", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" },
    completed: { label: "Adoção Concluída", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication || !chatMessage.trim()) return;
    if (await sendApplicationMessage(selectedApplication.id, chatMessage)) setChatMessage("");
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;
    await updateGuardianNotes(selectedApplication.id, activeNote);
  };

  const handleDeletePet = async () => {
    if (!petIdParaExcluir || estaExcluindoPet) return;
    setEstaExcluindoPet(true);
    if (await deletePet(petIdParaExcluir)) setPetIdParaExcluir(null);
    setEstaExcluindoPet(false);
  };

  if (authLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando painel" /></div>;
  }

  if (!currentUser || !isGuardian) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-[70vh] flex items-center justify-center">
        <div className="p-10 rounded-3xl bg-card border border-border text-center space-y-4 max-w-md shadow-xl">
          <Building2 className="w-12 h-12 text-primary mx-auto" />
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-foreground">Acesso ao Painel da ONG</h2>
            <p className="text-xs text-muted-foreground">
              Você precisa estar conectado com uma conta de ONG ou doador para gerenciar animais e candidaturas.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild variant="outline" className="rounded-full w-full">
              <Link href="/login?redirect=/dashboard">Fazer Login com E-mail e Senha</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Metrics computation
  const totalPets = guardianPets.length;
  const inProcessPets = guardianPets.filter((p) => p.status === "in_process").length;
  const adoptedPets = guardianPets.filter((p) => p.status === "adopted").length;
  const pendingApps = guardianApplications.filter((a) => a.status === "pending").length;
  const now = new Date();
  const petsThisMonth = guardianPets.filter((pet) => {
    const createdAt = new Date(pet.createdAt);
    return !Number.isNaN(createdAt.getTime())
      && createdAt.getMonth() === now.getMonth()
      && createdAt.getFullYear() === now.getFullYear();
  }).length;
  const adoptionRate = totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : null;
  const petsWithRegisteredCare = guardianPets.filter((pet) => pet.vaccinated && pet.castrated).length;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10 md:py-16 min-h-screen space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Painel de Gestão e Triagem
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              {isGuardian ? "ONG / Protetor" : "Usuário"}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-1">
            {currentUser?.name || "Painel da Instituição"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie seus animais resgatados, avalie dossiês de candidatos e converse via chat integrado.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button asChild className="rounded-full text-xs font-bold bg-primary hover:bg-primary/90 shadow-md min-h-[44px] w-full sm:w-auto">
            <Link href="/dashboard/pets/novo">
              <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Novo Pet
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 gap-4 overflow-x-auto whitespace-nowrap no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 min-h-[44px] shrink-0 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "applications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileCheck2 className="w-4 h-4" /> Triagem de Candidaturas ({guardianApplications.length})
        </button>

        <button
          onClick={() => setActiveTab("animals")}
          className={`pb-3 min-h-[44px] shrink-0 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "animals"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <PawPrint className="w-4 h-4" /> Gestão de Animais ({guardianPets.length})
        </button>

        <button
          onClick={() => setActiveTab("metrics")}
          className={`pb-3 min-h-[44px] shrink-0 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "metrics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <BarChart3 className="w-4 h-4" /> Métricas e Indicadores
        </button>
      </div>

      {/* TAB 1: TRIAGEM DE CANDIDATURAS */}
      {activeTab === "applications" && applicationsLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando candidaturas" />
        </div>
      )}

      {activeTab === "applications" && !applicationsLoading && applicationsError && (
        <div role="alert" className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-bold text-foreground">Candidaturas indisponíveis</h3>
            <p className="mt-1 text-sm text-muted-foreground">{applicationsError}</p>
          </div>
          <Button variant="outline" onClick={reloadApplications} className="rounded-full">Tentar novamente</Button>
        </div>
      )}

      {activeTab === "applications" && !applicationsLoading && !applicationsError && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Applications List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Formulários Recebidos ({guardianApplications.length})
            </h3>

            <div className="space-y-3">
              {guardianApplications.length === 0 ? (
                <div className="p-8 rounded-3xl border border-dashed border-border/80 bg-card/60 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Nenhuma candidatura recebida</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quando interessados preencherem formulários para adotar seus animais, as candidaturas aparecerão aqui para triagem.
                    </p>
                  </div>
                </div>
              ) : (
                guardianApplications.map((app) => {
                  const isSelected = selectedApplication?.id === app.id;
                  const statusInfo = statusConfig[app.status];

                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApplicationId(app.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border/60 bg-card hover:border-border hover:bg-secondary/40"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-foreground block">
                            {app.candidate.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Pretende adotar: <strong>{app.petName}</strong>
                          </span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{new Date(app.createdAt).toLocaleDateString("pt-BR")}</span>
                        {app.automatedAnalysis && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {app.automatedAnalysis.suitabilityScore}% Aptidão
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Dossier & Chat Viewer (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedApplication ? (
              <div className="p-4 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-5 sm:space-y-6">

                {/* Application Header with Status Changer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-border/60">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Dossiê de Pré-Adoção #{selectedApplication.id}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                      {selectedApplication.candidate.name} &bull; {selectedApplication.petName}
                    </h2>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                    <select
                      value={selectedApplication.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as ApplicationStatus;
                        updateApplicationStatus(selectedApplication.id, newStatus);
                      }}
                      className="px-3 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="pending">Pendente</option>
                      <option value="under_review">Em Avaliação</option>
                      <option value="approved">Aprovada</option>
                      <option value="rejected">Não Aprovada</option>
                      <option value="completed">Adoção Concluída</option>
                    </select>
                  </div>
                </div>

                {/* Automated Analysis Box */}
                {selectedApplication.automatedAnalysis && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-bold text-sm text-foreground">
                          Análise Automática do Dossiê ({selectedApplication.automatedAnalysis.verdict})
                        </h4>
                      </div>
                      <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                        {selectedApplication.automatedAnalysis.suitabilityScore}/100 Pontos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                          Pontos Fortes Identificados:
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {selectedApplication.automatedAnalysis.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                          Pontos de Atenção para a Entrevista:
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {selectedApplication.automatedAnalysis.attentionPoints.map((a, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {selectedApplication.automatedAnalysis.suggestedQuestions.length > 0 && (
                      <div className="pt-2 border-t border-emerald-500/20 text-xs">
                        <span className="font-bold text-foreground block mb-1">
                          Perguntas Sugeridas para Fazer ao Adotante:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                          {selectedApplication.automatedAnalysis.suggestedQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate Core Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                  {/* Personal */}
                  <div className="p-4 rounded-2xl bg-secondary/30 space-y-2 border border-border/50">
                    <span className="font-bold text-foreground uppercase tracking-wider block">
                      Dados Pessoais
                    </span>
                    <p><strong>Nome:</strong> {selectedApplication.candidate.name}</p>
                    <p><strong>Nascimento:</strong> {selectedApplication.candidate.birthDate}</p>
                    <p><strong>Profissão:</strong> {selectedApplication.candidate.profession}</p>
                    <p><strong>WhatsApp:</strong> {selectedApplication.candidate.primaryPhone}</p>
                    <p><strong>E-mail:</strong> {selectedApplication.candidate.email}</p>
                    <p><strong>Redes Sociais:</strong> {selectedApplication.candidate.socialMedia}</p>
                  </div>

                  {/* Housing & Family */}
                  <div className="p-4 rounded-2xl bg-secondary/30 space-y-2 border border-border/50">
                    <span className="font-bold text-foreground uppercase tracking-wider block">
                      Habitação e Família
                    </span>
                    <p><strong>Imóvel:</strong> {selectedApplication.housingType} ({selectedApplication.housingStatus})</p>
                    <p>
                      <strong>Proteção Física:</strong>{" "}
                      {selectedApplication.hasProtection ? (
                        <span className="text-emerald-600 font-bold">Sim (Telas/Muros Altos)</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Não possui telas</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground italic">
                      {selectedApplication.protectionDetails}
                    </p>
                    <p><strong>Adultos:</strong> {selectedApplication.adultsCount} | <strong>Crianças:</strong> {selectedApplication.childrenCount}</p>
                    <p><strong>Tempo sozinho:</strong> {selectedApplication.hoursAlone} horas/dia</p>
                    <p><strong>Plano de viagens:</strong> {selectedApplication.travelCarePlan}</p>
                  </div>

                </div>

                {/* Internal Guardian Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Anotações Internas da ONG (Confidencial)
                    </label>
                    <button
                      onClick={handleSaveNotes}
                      className="min-h-[44px] px-2 text-xs font-bold text-primary hover:underline"
                    >
                      Salvar Nota
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={activeNote}
                    onChange={(e) => {
                      if (selectedApplication) {
                        setEditingNotes((prev) => ({
                          ...prev,
                          [selectedApplication.id]: e.target.value
                        }));
                      }
                    }}
                    placeholder="Adicione observações da entrevista, impressões da visita ou histórico..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Integrated Direct Chat */}
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Chat com o Adotante
                  </h4>

                  <div className="h-56 overflow-y-auto p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
                    {selectedApplication.messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Nenhuma mensagem trocada ainda. Inicie o contato com o candidato!
                      </p>
                    ) : (
                      selectedApplication.messages.map((msg) => {
                        const isSystem = msg.senderRole === "system";
                        const isNGO = msg.senderRole === "guardian";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="text-center py-1">
                              <span className="text-[10px] text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isNGO ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                              {msg.senderName} &bull; {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div
                              className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${isNGO
                                  ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                                  : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
                                }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Escreva uma mensagem para combinar visita ou tirar dúvidas..."
                      className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button type="submit" className="rounded-full px-5 text-xs bg-primary hover:bg-primary/90">
                      <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                    </Button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground bg-secondary/20 rounded-3xl border border-border">
                {guardianApplications.length === 0
                  ? "Sua instituição ainda não possui candidaturas registradas para triagem."
                  : "Selecione uma candidatura na coluna lateral para visualizar o dossiê."}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: GESTÃO DE ANIMAIS */}
      {activeTab === "animals" && petsLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando animais" />
        </div>
      )}

      {activeTab === "animals" && !petsLoading && petsError && (
        <div role="alert" className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-bold text-foreground">Animais indisponíveis</h3>
            <p className="mt-1 text-sm text-muted-foreground">{petsError}</p>
          </div>
          <Button variant="outline" onClick={() => void reloadPets()} className="rounded-full">Tentar novamente</Button>
        </div>
      )}

      {activeTab === "animals" && !petsLoading && !petsError && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAnimal}
                onChange={(e) => setSearchAnimal(e.target.value)}
                placeholder="Buscar animal por nome ou raça..."
                className="min-h-[44px] w-full rounded-full border border-border bg-card py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button asChild className="rounded-full text-xs bg-primary hover:bg-primary/90">
              <Link href="/dashboard/pets/novo">
                <Plus className="w-4 h-4 mr-1.5" /> Novo Pet
              </Link>
            </Button>
          </div>

          {guardianPets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card/60 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <PawPrint className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-base text-foreground">Nenhum animal cadastrado ainda</h3>
                <p className="text-xs text-muted-foreground">
                  Esta conta de ONG ainda não possui pets cadastrados para adoção. Cadastre novos animais para começar a receber candidaturas de adoção responsável.
                </p>
              </div>
              <Button asChild className="rounded-full text-xs bg-primary hover:bg-primary/90">
                <Link href="/dashboard/pets/novo">
                  <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Primeiro Pet
                </Link>
              </Button>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border border-border bg-card/50 text-muted-foreground text-xs">
              Nenhum animal encontrado com o termo &quot;{searchAnimal}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPets.map((pet) => (
                <div
                  key={pet.id}
                  className="p-4 rounded-3xl bg-card border border-border/60 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-secondary">
                      <Image
                        src={pet.photos[0]}
                        alt={pet.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-base text-foreground">{pet.name}</h4>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button asChild variant="ghost" size="icon-sm" className="min-h-[44px] min-w-[44px]" title="Editar animal">
                            <Link href={`/dashboard/pets/${pet.id}/editar`} aria-label={`Editar ${pet.name}`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          <button onClick={() => setPetIdParaExcluir(pet.id)} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-rose-500" title="Remover animal" aria-label={`Remover ${pet.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{pet.breed} &bull; {pet.approximateAge}</p>
                      <p className="text-xs text-muted-foreground">
                        {pet.species === "dog" ? "Cachorro" : "Gato"} &bull; {pet.location.city}
                      </p>
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="flex flex-col gap-2 border-t border-border/40 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Status Atual:</span>
                    <select
                      value={pet.status}
                      onChange={(e) => updatePet(pet.id, { status: e.target.value as PetAdoptionStatus })}
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none sm:w-auto"
                    >
                      <option value="available">Disponível</option>
                      <option value="in_process">Em Processo</option>
                      <option value="adopted">Adotado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MÉTRICAS */}
      {activeTab === "metrics" && petsLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando métricas" />
        </div>
      )}

      {activeTab === "metrics" && !petsLoading && petsError && (
        <div role="alert" className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-bold text-foreground">Métricas indisponíveis</h3>
            <p className="mt-1 text-sm text-muted-foreground">{petsError}</p>
          </div>
          <Button variant="outline" onClick={() => void reloadPets()} className="rounded-full">Tentar novamente</Button>
        </div>
      )}

      {activeTab === "metrics" && !petsLoading && !petsError && (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pets Acolhidos</span>
              <p className="font-serif text-2xl sm:text-4xl font-bold text-foreground">{totalPets}</p>
              <p className="text-xs text-emerald-600 font-medium">
                {petsThisMonth > 0 ? `${petsThisMonth} cadastrado${petsThisMonth > 1 ? "s" : ""} neste mês` : "Nenhum cadastro neste mês"}
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adoções Concluídas</span>
              <p className="font-serif text-2xl sm:text-4xl font-bold text-foreground">{adoptedPets}</p>
              <p className="text-xs text-emerald-600 font-medium">
                {adoptedPets > 0 ? `${adoptedPets} adoção${adoptedPets > 1 ? "ões" : ""} registrada${adoptedPets > 1 ? "s" : ""}` : "Nenhuma adoção concluída"}
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Triagens em Aberto</span>
              <p className="font-serif text-2xl sm:text-4xl font-bold text-foreground">{inProcessPets + pendingApps}</p>
              <p className="text-xs text-primary font-medium">
                {inProcessPets + pendingApps > 0 ? "Aguardando resposta da ONG" : "Sem pendências no momento"}
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Taxa de Sucesso</span>
              <p className="font-serif text-2xl sm:text-4xl font-bold text-foreground">{adoptionRate === null ? "—" : `${adoptionRate}%`}</p>
              <p className="text-xs text-muted-foreground font-medium">Adoções concluídas sobre pets cadastrados</p>
            </div>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-secondary/30 border border-border/60 space-y-4">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Cuidados cadastrados
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {totalPets > 0
                ? `${petsWithRegisteredCare} de ${totalPets} animais estão marcados como vacinados e castrados. Revise os cadastros sempre que houver atualização veterinária.`
                : "Cadastre animais para acompanhar aqui os cuidados veterinários informados."}
            </p>
          </div>
        </div>
      )}

      {petParaExcluir && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-excluir-pet">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 id="titulo-excluir-pet" className="font-serif text-xl font-bold text-foreground">Remover {petParaExcluir.name}?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">O anúncio e suas fotos serão removidos. Esta ação não pode ser desfeita.</p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" disabled={estaExcluindoPet} onClick={() => setPetIdParaExcluir(null)}>Cancelar</Button>
              <Button variant="destructive" disabled={estaExcluindoPet} onClick={handleDeletePet}>
                {estaExcluindoPet ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removendo...</> : "Remover"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
