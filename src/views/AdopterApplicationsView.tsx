"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";

export function AdopterApplicationsView() {
  const {
    currentUser,
    authLoading,
    applications,
    applicationsLoading,
    applicationsError,
    reloadApplications,
    sendApplicationMessage
  } = useApp();

  // Filter applications belonging strictly to the current adopter
  const userApplications = applications.filter((app) => {
    if (!currentUser) return false;
    if (currentUser.role === "adopter") {
      return app.candidateId === currentUser.id || app.candidate.email === currentUser.email;
    }
    return false;
  });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    userApplications[0]?.id || null
  );

  const selectedApp = userApplications.find((a) => a.id === (selectedAppId || userApplications[0]?.id)) || userApplications[0] || null;
  const [chatMessage, setChatMessage] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !chatMessage.trim()) return;
    if (await sendApplicationMessage(selectedApp.id, chatMessage)) setChatMessage("");
  };

  const stepsList: { status: ApplicationStatus; label: string; desc: string }[] = [
    { status: "pending", label: "Recebida", desc: "Dossiê protocolado aguardando análise" },
    { status: "under_review", label: "Em Avaliação", desc: "Comitê da ONG analisando segurança da moradia" },
    { status: "approved", label: "Aprovada", desc: "Visita e entrevista agendadas com sucesso" },
    { status: "completed", label: "Tutela Concluída", desc: "Termo assinado e acolhimento oficializado" }
  ];

  const getStepIndex = (status: ApplicationStatus) => {
    switch (status) {
      case "pending": return 0;
      case "under_review": return 1;
      case "approved": return 2;
      case "completed": return 3;
      case "rejected": return -1;
      default: return 0;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10 md:py-16 min-h-screen space-y-6 sm:space-y-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Área do Tutor Candidato
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-1">
            Minhas Candidaturas de Pré-Adoção
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Acompanhe em tempo real o status dos seus dossiês e converse diretamente com as ONGs responsáveis.
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-full text-xs font-semibold w-full sm:w-auto min-h-[44px]">
          <Link href="/pets">
            Explorar Mais Pets <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {authLoading || (Boolean(currentUser) && applicationsLoading) ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando candidaturas" />
        </div>
      ) : !currentUser ? (
        <div className="p-12 rounded-3xl bg-secondary/30 border border-border text-center space-y-4 max-w-lg mx-auto">
          <FileCheck2 className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground">Acesso Restrito</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você precisa estar conectado à sua conta para visualizar e acompanhar suas candidaturas.
            </p>
          </div>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/login?redirect=/minhas-candidaturas">Fazer Login</Link>
          </Button>
        </div>
      ) : applicationsError ? (
        <div role="alert" className="mx-auto max-w-lg space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-bold text-foreground">Candidaturas indisponíveis</h3>
            <p className="mt-1 text-sm text-muted-foreground">{applicationsError}</p>
          </div>
          <Button variant="outline" onClick={reloadApplications} className="rounded-full">Tentar novamente</Button>
        </div>
      ) : userApplications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-secondary/30 border border-border text-center space-y-4 max-w-lg mx-auto">
          <FileCheck2 className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground">Nenhuma candidatura enviada</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você ainda não submeteu nenhum dossiê de pré-adoção. Encontre seu novo companheiro no catálogo!
            </p>
          </div>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/pets">Ver Pets Disponíveis</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Applications list on left (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Suas Candidaturas ({userApplications.length})
            </h3>

            <div className="space-y-3">
              {userApplications.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/60 bg-card hover:bg-secondary/40"
                      }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-secondary">
                      <Image
                        src={app.petPhoto}
                        alt={app.petName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground truncate">
                          {app.petName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{app.guardianName}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-primary">
                        {app.status === "pending" && "Em análise inicial"}
                        {app.status === "under_review" && "Em avaliação pelo comitê"}
                        {app.status === "approved" && "Candidatura aprovada!"}
                        {app.status === "rejected" && "Não aprovada"}
                        {app.status === "completed" && "Adoção finalizada"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details & Timeline & Chat on right (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedApp && (
              <div className="p-4 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-6 sm:space-y-8">

                {/* Pet summary */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 pb-5 sm:pb-6 border-b border-border/60">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-secondary">
                    <Image
                      src={selectedApp.petPhoto}
                      alt={selectedApp.petName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Candidatura #{selectedApp.id}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                      Pré-Adoção de {selectedApp.petName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Doador: <strong>{selectedApp.guardianName}</strong>
                    </p>
                  </div>
                </div>

                {/* Timeline visual */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Linha do Tempo da Triagem
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stepsList.map((st, idx) => {
                      const currentIdx = getStepIndex(selectedApp.status);
                      const isPastOrCurrent = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div
                          key={st.status}
                          className={`p-3.5 rounded-2xl border transition-all ${isCurrent
                              ? "bg-primary/10 border-primary text-primary shadow-sm"
                              : isPastOrCurrent
                                ? "bg-secondary/40 border-border text-foreground"
                                : "bg-background/40 border-border/40 text-muted-foreground opacity-50"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {isPastOrCurrent ? (
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 shrink-0" />
                            )}
                            <span className="font-bold text-xs">{st.label}</span>
                          </div>
                          <p className="text-[10px] leading-tight opacity-80">{st.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Chat with Guardian */}
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Mensagens com a {selectedApp.guardianName}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">Canal oficial e direto</span>
                  </div>

                  {/* Messages box */}
                  <div className="h-60 overflow-y-auto p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
                    {selectedApp.messages.map((msg) => {
                      const isAdopter = msg.senderRole === "adopter";
                      const isSystem = msg.senderRole === "system";

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
                          className={`flex flex-col ${isAdopter ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                            {msg.senderName} &bull; {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div
                            className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${isAdopter
                                ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                                : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
                              }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Envie uma mensagem ou tire dúvidas sobre a visita..."
                      className="flex-1 px-4 py-2.5 min-h-[44px] rounded-full border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button type="submit" className="rounded-full px-5 text-xs bg-primary hover:bg-primary/90 min-h-[44px]">
                      <Send className="w-3.5 h-3.5 mr-1" /> Enviar
                    </Button>
                  </form>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
