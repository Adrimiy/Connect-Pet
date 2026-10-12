"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  Eye,
  FileCheck2,
  Grid2X2,
  Inbox,
  LayoutDashboard,
  List,
  Loader2,
  MessageSquare,
  PawPrint,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ApplicationStatus, Pet, PetAdoptionStatus, PreAdoptionApplication } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AbaPainel = "visao-geral" | "candidaturas" | "animais" | "metricas";
type OrdenacaoAnimais = "recentes" | "nome" | "completude";
type OrdenacaoCandidaturas = "recentes" | "antigas" | "atividade";

const ABAS: Array<{ id: AbaPainel; rotulo: string; icone: React.ComponentType<{ className?: string }> }> = [
  { id: "visao-geral", rotulo: "Visão geral", icone: LayoutDashboard },
  { id: "candidaturas", rotulo: "Candidaturas", icone: FileCheck2 },
  { id: "animais", rotulo: "Animais", icone: PawPrint },
  { id: "metricas", rotulo: "Indicadores", icone: BarChart3 },
];

const CONFIGURACAO_STATUS_CANDIDATURA: Record<ApplicationStatus, { rotulo: string; classe: string }> = {
  pending: { rotulo: "Pendente", classe: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  under_review: { rotulo: "Em avaliação", classe: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  approved: { rotulo: "Aprovada", classe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  rejected: { rotulo: "Não aprovada", classe: "border-destructive/30 bg-destructive/10 text-destructive" },
  completed: { rotulo: "Adoção concluída", classe: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
};

const ROTULOS_STATUS_PET: Record<PetAdoptionStatus, string> = {
  available: "Disponível",
  in_process: "Em processo",
  adopted: "Adotado",
};

function obterTransicoesPermitidas(status: ApplicationStatus): ApplicationStatus[] {
  const transicoes: Record<ApplicationStatus, ApplicationStatus[]> = {
    pending: ["under_review", "rejected"],
    under_review: ["pending", "approved", "rejected"],
    approved: ["under_review", "rejected", "completed"],
    rejected: ["under_review"],
    completed: ["under_review"],
  };
  return transicoes[status];
}

function obterCompletudePet(pet: Pet): number {
  const campos = [
    pet.photos.length > 0,
    Boolean(pet.headline.trim()),
    Boolean(pet.story.trim()),
    pet.temperament.length > 0,
    Boolean(pet.temperamentDescription.trim()),
    Boolean(pet.breed.trim()),
    Boolean(pet.approximateAge.trim()),
    Boolean(pet.location.city && pet.location.state),
    Boolean(pet.location.neighborhood),
    Boolean(pet.guardianPhone && pet.guardianEmail),
  ];
  return Math.round((campos.filter(Boolean).length / campos.length) * 100);
}

function obterUltimaAtividade(candidatura: PreAdoptionApplication): number {
  const ultimaMensagem = candidatura.messages.at(-1)?.sentAt;
  return new Date(ultimaMensagem || candidatura.createdAt).getTime();
}

function CartaoIndicador({
  titulo,
  valor,
  descricao,
  aoClicar,
  icone: Icone,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
  aoClicar?: () => void;
  icone: React.ComponentType<{ className?: string }>;
}) {
  const conteudo = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icone className="h-5 w-5" />
      </span>
      <span className="mt-4 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{titulo}</span>
      <strong className="mt-1 block font-serif text-3xl text-foreground sm:text-4xl">{valor}</strong>
      <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        {descricao}{aoClicar && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    </>
  );

  return aoClicar ? (
    <button
      type="button"
      onClick={aoClicar}
      className="min-h-[44px] rounded-3xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {conteudo}
    </button>
  ) : (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">{conteudo}</div>
  );
}

function EstadoErro({ titulo, mensagem, aoTentarNovamente }: { titulo: string; mensagem: string; aoTentarNovamente: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-10">
      <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
      <div>
        <h2 className="font-bold text-foreground">{titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{mensagem}</p>
      </div>
      <Button variant="outline" onClick={aoTentarNovamente} className="min-h-[44px] rounded-full">Tentar novamente</Button>
    </div>
  );
}

function PainelDossie({
  candidatura,
  contexto,
  estaAtualizandoStatus,
  aoSolicitarStatus,
  aoSalvarNotas,
  aoEnviarMensagem,
  aoGerarAnaliseIa,
}: {
  candidatura: PreAdoptionApplication;
  contexto: "desktop" | "movel";
  estaAtualizandoStatus: boolean;
  aoSolicitarStatus: (status: ApplicationStatus) => void;
  aoSalvarNotas: (notas: string) => Promise<boolean>;
  aoEnviarMensagem: (mensagem: string) => Promise<boolean>;
  aoGerarAnaliseIa: () => Promise<boolean>;
}) {
  const [notas, setNotas] = useState(candidatura.guardianNotes || "");
  const [mensagem, setMensagem] = useState("");
  const [estaSalvandoNotas, setEstaSalvandoNotas] = useState(false);
  const [estaEnviandoMensagem, setEstaEnviandoMensagem] = useState(false);
  const [estaGerandoAnalise, setEstaGerandoAnalise] = useState(false);
  const transicoes = obterTransicoesPermitidas(candidatura.status);
  const telefone = candidatura.candidate.primaryPhone?.replace(/\D/g, "");

  const salvarNotas = async () => {
    setEstaSalvandoNotas(true);
    await aoSalvarNotas(notas);
    setEstaSalvandoNotas(false);
  };

  const enviarMensagem = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!mensagem.trim() || estaEnviandoMensagem) return;
    setEstaEnviandoMensagem(true);
    if (await aoEnviarMensagem(mensagem)) setMensagem("");
    setEstaEnviandoMensagem(false);
  };

  const gerarAnaliseIa = async () => {
    if (estaGerandoAnalise) return;
    setEstaGerandoAnalise(true);
    try {
      await aoGerarAnaliseIa();
    } finally {
      setEstaGerandoAnalise(false);
    }
  };

  return (
    <article className="space-y-5 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:space-y-6 sm:p-7">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Dossiê de pré-adoção</p>
          <h2 className="mt-1 break-words font-serif text-xl font-bold text-foreground sm:text-2xl">
            {candidatura.candidate.name} <span className="text-muted-foreground">·</span> {candidatura.petName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Recebida em {new Date(candidatura.createdAt).toLocaleDateString("pt-BR")}</p>
        </div>
        <label className="flex w-full flex-col gap-1 text-xs font-semibold text-muted-foreground sm:w-auto">
          Andamento
          <select
            value={candidatura.status}
            disabled={estaAtualizandoStatus}
            onChange={(evento) => aoSolicitarStatus(evento.target.value as ApplicationStatus)}
            className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary sm:w-auto"
          >
            <option value={candidatura.status}>{CONFIGURACAO_STATUS_CANDIDATURA[candidatura.status].rotulo}</option>
            {transicoes.map((status) => <option key={status} value={status}>{CONFIGURACAO_STATUS_CANDIDATURA[status].rotulo}</option>)}
          </select>
        </label>
      </header>

      {candidatura.automatedAnalysis && (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/35 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Análise de apoio à triagem
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Referência: {candidatura.automatedAnalysis.suitabilityScore}/100</Badge>
              <Badge variant={candidatura.automatedAnalysis.origem === "ia" ? "secondary" : "outline"}>
                {candidatura.automatedAnalysis.origem === "ia" ? "Contextualizada por IA" : "Análise local"}
              </Badge>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            O índice de triagem é uma heurística calculada por critérios fixos e auditáveis. A IA apenas contextualiza as respostas, não altera o índice, não aprova nem rejeita a candidatura e não substitui a entrevista.
          </p>
          {candidatura.automatedAnalysis.resumo && (
            <div className="space-y-1 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
              <p className="font-bold text-foreground">{candidatura.automatedAnalysis.verdict}</p>
              <p className="leading-relaxed text-muted-foreground">{candidatura.automatedAnalysis.resumo}</p>
              {candidatura.automatedAnalysis.justificativa && <p className="leading-relaxed text-muted-foreground">{candidatura.automatedAnalysis.justificativa}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-bold text-foreground">Pontos favoráveis</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                {candidatura.automatedAnalysis.strengths.length > 0 ? candidatura.automatedAnalysis.strengths.map((item) => (
                  <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />{item}</li>
                )) : <li>Nenhum ponto automático registrado.</li>}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-bold text-foreground">Confirmar na conversa</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                {candidatura.automatedAnalysis.attentionPoints.length > 0 ? candidatura.automatedAnalysis.attentionPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />{item}</li>
                )) : <li>Nenhum ponto de atenção automático.</li>}
              </ul>
            </div>
          </div>
          {candidatura.automatedAnalysis.suggestedQuestions.length > 0 && (
            <div className="border-t border-border/60 pt-3 text-xs">
              <h4 className="mb-1 font-bold text-foreground">Perguntas sugeridas</h4>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {candidatura.automatedAnalysis.suggestedQuestions.map((pergunta) => <li key={pergunta}>{pergunta}</li>)}
              </ul>
            </div>
          )}
          {candidatura.automatedAnalysis.fatores && candidatura.automatedAnalysis.fatores.length > 0 && (
            <details className="rounded-xl border border-border/60 bg-background/70 text-xs">
              <summary className="min-h-[44px] cursor-pointer px-3 py-3 font-bold text-foreground">Como a pontuação foi calculada</summary>
              <ul className="space-y-2 border-t border-border/60 p-3 text-muted-foreground">
                {candidatura.automatedAnalysis.fatores.map((fator, indice) => (
                  <li key={`${fator.criterio}-${indice}`} className="flex items-start justify-between gap-3">
                    <span><strong className="text-foreground">{fator.criterio}:</strong> {fator.explicacao}</span>
                    <Badge variant="outline" className="shrink-0">{fator.impacto > 0 ? `+${fator.impacto}` : fator.impacto}</Badge>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              {candidatura.automatedAnalysis.geradoEm
                ? `Atualizada em ${new Date(candidatura.automatedAnalysis.geradoEm).toLocaleString("pt-BR")}`
                : "Análise inicial gerada no envio da candidatura."}
              {candidatura.automatedAnalysis.origem === "ia" && candidatura.automatedAnalysis.provedor
                ? ` · ${candidatura.automatedAnalysis.provedor}${candidatura.automatedAnalysis.modelo ? ` (${candidatura.automatedAnalysis.modelo})` : ""}`
                : ""}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={estaGerandoAnalise}
              onClick={() => void gerarAnaliseIa()}
              className="min-h-[44px] w-full rounded-full sm:w-auto"
            >
              {estaGerandoAnalise ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {estaGerandoAnalise ? "Analisando respostas" : candidatura.automatedAnalysis.origem === "ia" ? "Atualizar análise com IA" : "Analisar com IA"}
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
        <section className="space-y-2 rounded-2xl border border-border/60 bg-muted/25 p-4">
          <h3 className="font-bold uppercase tracking-wider text-foreground">Candidato</h3>
          <p><strong>Nome:</strong> {candidatura.candidate.name}</p>
          <p><strong>Nascimento:</strong> {candidatura.candidate.birthDate || "Não informado"}</p>
          <p><strong>Profissão:</strong> {candidatura.candidate.profession || "Não informada"}</p>
          <p className="break-all"><strong>E-mail:</strong> <a className="text-primary hover:underline" href={`mailto:${candidatura.candidate.email}`}>{candidatura.candidate.email}</a></p>
          <p><strong>WhatsApp:</strong> {telefone ? <a className="text-primary hover:underline" href={`https://wa.me/55${telefone}`} target="_blank" rel="noreferrer">{candidatura.candidate.primaryPhone}</a> : "Não informado"}</p>
          <p><strong>Redes sociais:</strong> {candidatura.candidate.socialMedia || "Não informadas"}</p>
        </section>
        <section className="space-y-2 rounded-2xl border border-border/60 bg-muted/25 p-4">
          <h3 className="font-bold uppercase tracking-wider text-foreground">Moradia e rotina</h3>
          <p><strong>Imóvel:</strong> {candidatura.housingType} ({candidatura.housingStatus})</p>
          <p><strong>Proteção física:</strong> {candidatura.hasProtection ? "Informada" : "Não informada"}</p>
          {candidatura.protectionDetails && <p className="text-muted-foreground">{candidatura.protectionDetails}</p>}
          <p><strong>Família:</strong> {candidatura.adultsCount} adulto(s) e {candidatura.childrenCount} criança(s)</p>
          <p><strong>Tempo sozinho:</strong> {candidatura.hoursAlone} hora(s) por dia</p>
          <p><strong>Cuidados diários:</strong> {candidatura.dailyCarePlan || "Não detalhado"}</p>
          <p><strong>Animais residentes:</strong> {candidatura.hasCurrentPets ? candidatura.currentPetsDescription || "Informados sem detalhes" : "Não possui"}</p>
          <p><strong>Plano para viagens:</strong> {candidatura.travelCarePlan || "Não informado"}</p>
        </section>
      </div>

      <section className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor={`notas-${contexto}-${candidatura.id}`} className="text-xs font-bold uppercase tracking-wider text-foreground">Anotações internas</label>
          <Button variant="ghost" size="sm" disabled={estaSalvandoNotas} onClick={() => void salvarNotas()} className="min-h-[44px] self-start text-xs text-primary sm:self-auto">
            {estaSalvandoNotas && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{estaSalvandoNotas ? "Salvando" : "Salvar anotações"}
          </Button>
        </div>
        <textarea
          id={`notas-${contexto}-${candidatura.id}`}
          rows={3}
          value={notas}
          onChange={(evento) => setNotas(evento.target.value)}
          placeholder="Registre impressões da entrevista, combinados ou informações para a equipe."
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-[11px] text-muted-foreground">Visível apenas para o responsável pelo animal.</p>
      </section>

      <section className="space-y-3 border-t border-border/60 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><MessageSquare className="h-4 w-4 text-primary" /> Conversa com o candidato</h3>
        <div className="max-h-72 min-h-52 overflow-y-auto rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
          {candidatura.messages.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <Inbox className="mb-2 h-7 w-7 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda. Use o campo abaixo para iniciar o contato.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidatura.messages.map((item) => {
                if (item.senderRole === "system") {
                  return <p key={item.id} className="text-center text-[10px] text-muted-foreground"><span className="inline-block rounded-full bg-muted px-3 py-1">{item.content}</span></p>;
                }
                const mensagemGuardiao = item.senderRole === "guardian";
                return (
                  <div key={item.id} className={`flex flex-col ${mensagemGuardiao ? "items-end" : "items-start"}`}>
                    <span className="mb-1 px-1 text-[10px] text-muted-foreground">{item.senderName} · {new Date(item.sentAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <p className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed sm:max-w-md ${mensagemGuardiao ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-card text-foreground"}`}>{item.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <form onSubmit={enviarMensagem} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`mensagem-${contexto}-${candidatura.id}`} className="sr-only">Mensagem para o candidato</label>
          <input
            id={`mensagem-${contexto}-${candidatura.id}`}
            value={mensagem}
            onChange={(evento) => setMensagem(evento.target.value)}
            placeholder="Escreva uma mensagem..."
            className="min-h-[44px] flex-1 rounded-full border border-border bg-background px-4 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" disabled={!mensagem.trim() || estaEnviandoMensagem} className="min-h-[44px] rounded-full sm:px-5">
            {estaEnviandoMensagem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Enviar
          </Button>
        </form>
      </section>
    </article>
  );
}

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
    sendApplicationMessage,
    generateApplicationAIAnalysis,
  } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const parametrosBusca = useSearchParams();

  const abaParametro = parametrosBusca.get("aba");
  const abaAtiva: AbaPainel = ABAS.some((aba) => aba.id === abaParametro) ? abaParametro as AbaPainel : "visao-geral";
  const candidaturaParametro = parametrosBusca.get("candidatura");

  const [buscaAnimal, setBuscaAnimal] = useState("");
  const [statusAnimal, setStatusAnimal] = useState<PetAdoptionStatus | "todos">("todos");
  const [especieAnimal, setEspecieAnimal] = useState<Pet["species"] | "todos">("todos");
  const [ordenacaoAnimais, setOrdenacaoAnimais] = useState<OrdenacaoAnimais>("recentes");
  const [modoAnimais, setModoAnimais] = useState<"cartoes" | "lista">("cartoes");
  const [buscaCandidatura, setBuscaCandidatura] = useState("");
  const [statusCandidatura, setStatusCandidatura] = useState<ApplicationStatus | "todos">("todos");
  const [petCandidatura, setPetCandidatura] = useState("todos");
  const [ordenacaoCandidaturas, setOrdenacaoCandidaturas] = useState<OrdenacaoCandidaturas>("recentes");
  const [detalheMovelAberto, setDetalheMovelAberto] = useState(false);
  const [petIdParaExcluir, setPetIdParaExcluir] = useState<string | null>(null);
  const [estaExcluindoPet, setEstaExcluindoPet] = useState(false);
  const [alteracaoStatus, setAlteracaoStatus] = useState<{ candidatura: PreAdoptionApplication; status: ApplicationStatus } | null>(null);
  const [estaAtualizandoStatus, setEstaAtualizandoStatus] = useState(false);

  const animaisGuardiao = useMemo(() => {
    if (!currentUser) return [];
    return pets.filter((pet) => pet.guardianId === currentUser.id);
  }, [currentUser, pets]);
  const idsAnimais = useMemo(() => new Set(animaisGuardiao.map((pet) => pet.id)), [animaisGuardiao]);
  const candidaturasGuardiao = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter((item) => item.guardianId === currentUser.id || idsAnimais.has(item.petId));
  }, [applications, currentUser, idsAnimais]);
  const contagemCandidaturasPorPet = useMemo(() => {
    const contagem = new Map<string, number>();
    candidaturasGuardiao.forEach((item) => contagem.set(item.petId, (contagem.get(item.petId) || 0) + 1));
    return contagem;
  }, [candidaturasGuardiao]);

  const navegarParaAba = (aba: AbaPainel, candidaturaId?: string) => {
    const parametros = new URLSearchParams(parametrosBusca.toString());
    parametros.set("aba", aba);
    if (candidaturaId) parametros.set("candidatura", candidaturaId);
    else parametros.delete("candidatura");
    router.replace(`${pathname}?${parametros.toString()}`, { scroll: false });
  };

  const candidaturasFiltradas = useMemo(() => {
    const termo = buscaCandidatura.trim().toLocaleLowerCase("pt-BR");
    return candidaturasGuardiao
      .filter((item) => statusCandidatura === "todos" || item.status === statusCandidatura)
      .filter((item) => petCandidatura === "todos" || item.petId === petCandidatura)
      .filter((item) => !termo || item.candidate.name.toLocaleLowerCase("pt-BR").includes(termo) || item.petName.toLocaleLowerCase("pt-BR").includes(termo))
      .sort((a, b) => {
        if (ordenacaoCandidaturas === "antigas") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (ordenacaoCandidaturas === "atividade") return obterUltimaAtividade(b) - obterUltimaAtividade(a);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [buscaCandidatura, candidaturasGuardiao, ordenacaoCandidaturas, petCandidatura, statusCandidatura]);

  const candidaturaSelecionada = candidaturasFiltradas.find((item) => item.id === candidaturaParametro) || candidaturasFiltradas[0] || null;

  const animaisFiltrados = useMemo(() => {
    const termo = buscaAnimal.trim().toLocaleLowerCase("pt-BR");
    return animaisGuardiao
      .filter((pet) => statusAnimal === "todos" || pet.status === statusAnimal)
      .filter((pet) => especieAnimal === "todos" || pet.species === especieAnimal)
      .filter((pet) => !termo || pet.name.toLocaleLowerCase("pt-BR").includes(termo) || pet.breed.toLocaleLowerCase("pt-BR").includes(termo))
      .sort((a, b) => {
        if (ordenacaoAnimais === "nome") return a.name.localeCompare(b.name, "pt-BR");
        if (ordenacaoAnimais === "completude") return obterCompletudePet(a) - obterCompletudePet(b);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [animaisGuardiao, buscaAnimal, especieAnimal, ordenacaoAnimais, statusAnimal]);

  if (authLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando painel" /></div>;
  }

  if (!currentUser || currentUser.role !== "guardian") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16">
        <div className="w-full space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-xl sm:p-8">
          <Building2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Acesso ao painel de gestão</h1>
          <p className="text-sm text-muted-foreground">Entre com uma conta de ONG ou doador para gerenciar animais e candidaturas.</p>
          <Button asChild className="min-h-[44px] w-full rounded-full"><Link href="/login?redirect=/dashboard">Entrar</Link></Button>
        </div>
      </div>
    );
  }

  const candidaturasAbertas = candidaturasGuardiao.filter((item) => ["pending", "under_review", "approved"].includes(item.status));
  const pendentes = candidaturasGuardiao.filter((item) => item.status === "pending").length;
  const adotados = animaisGuardiao.filter((pet) => pet.status === "adopted").length;
  const disponiveis = animaisGuardiao.filter((pet) => pet.status === "available").length;
  const emProcesso = animaisGuardiao.filter((pet) => pet.status === "in_process").length;
  const adocoesConcluidas = new Set([
    ...animaisGuardiao.filter((pet) => pet.status === "adopted").map((pet) => `pet:${pet.id}`),
    ...candidaturasGuardiao.filter((item) => item.status === "completed").map((item) => item.petId ? `pet:${item.petId}` : `candidatura:${item.id}`),
  ]).size;
  const taxaAdocao = animaisGuardiao.length > 0 ? Math.round((adotados / animaisGuardiao.length) * 100) : null;
  const cuidadosCompletos = animaisGuardiao.filter((pet) => pet.vaccinated && pet.castrated && pet.dewormed).length;
  const animaisQuePrecisamAtencao = animaisGuardiao.filter((pet) => obterCompletudePet(pet) < 80).sort((a, b) => obterCompletudePet(a) - obterCompletudePet(b));
  const petParaExcluir = animaisGuardiao.find((pet) => pet.id === petIdParaExcluir) || null;

  const selecionarCandidatura = (candidaturaId: string) => {
    navegarParaAba("candidaturas", candidaturaId);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) setDetalheMovelAberto(true);
  };

  const confirmarAlteracaoStatus = async () => {
    if (!alteracaoStatus || estaAtualizandoStatus) return;
    setEstaAtualizandoStatus(true);
    const atualizou = await updateApplicationStatus(alteracaoStatus.candidatura.id, alteracaoStatus.status);
    setEstaAtualizandoStatus(false);
    if (atualizou) setAlteracaoStatus(null);
  };

  const removerPet = async () => {
    if (!petIdParaExcluir || estaExcluindoPet) return;
    setEstaExcluindoPet(true);
    if (await deletePet(petIdParaExcluir)) setPetIdParaExcluir(null);
    setEstaExcluindoPet(false);
  };

  const renderizarDossie = (candidatura: PreAdoptionApplication, contexto: "desktop" | "movel") => (
    <PainelDossie
      key={`${contexto}-${candidatura.id}`}
      candidatura={candidatura}
      contexto={contexto}
      estaAtualizandoStatus={estaAtualizandoStatus}
      aoSolicitarStatus={(status) => setAlteracaoStatus({ candidatura, status })}
      aoSalvarNotas={(notas) => updateGuardianNotes(candidatura.id, notas)}
      aoEnviarMensagem={(mensagem) => sendApplicationMessage(candidatura.id, mensagem)}
      aoGerarAnaliseIa={() => generateApplicationAIAnalysis(candidatura.id)}
    />
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Painel de gestão</span>
            <Badge variant="secondary">{currentUser.guardianType === "ngo" ? "ONG" : "Doador individual"}</Badge>
          </div>
          <h1 className="mt-1 break-words font-serif text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">{currentUser.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Acompanhe prioridades, mantenha os anúncios atualizados e conduza cada adoção com clareza.</p>
        </div>
        <Button asChild className="min-h-[44px] w-full rounded-full font-bold shadow-sm sm:w-auto">
          <Link href="/dashboard/pets/novo"><Plus className="mr-2 h-4 w-4" />Cadastrar novo pet</Link>
        </Button>
      </header>

      <nav aria-label="Seções do painel" role="tablist" className="flex gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-card p-1.5 shadow-sm">
        {ABAS.map((aba) => {
          const Icone = aba.icone;
          const selecionada = abaAtiva === aba.id;
          const contagem = aba.id === "candidaturas" ? candidaturasAbertas.length : aba.id === "animais" ? animaisGuardiao.length : null;
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={selecionada}
              onClick={() => navegarParaAba(aba.id)}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4 sm:text-sm ${selecionada ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icone className="h-4 w-4" />{aba.rotulo}{contagem !== null && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selecionada ? "bg-primary-foreground/20" : "bg-muted"}`}>{contagem}</span>}
            </button>
          );
        })}
      </nav>

      <main role="tabpanel" aria-label={ABAS.find((aba) => aba.id === abaAtiva)?.rotulo}>
        {abaAtiva === "visao-geral" && (
          petsLoading || applicationsLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando visão geral" />
            </div>
          ) : petsError || applicationsError ? (
            <EstadoErro
              titulo="Não foi possível montar a visão geral"
              mensagem={petsError || applicationsError || "Tente novamente em alguns instantes."}
              aoTentarNovamente={() => {
                void reloadPets();
                reloadApplications();
              }}
            />
          ) : (
          <div className="space-y-6">
            <section aria-labelledby="titulo-resumo" className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Hoje no ConnectPet</p>
                <h2 id="titulo-resumo" className="font-serif text-2xl font-bold text-foreground">O que precisa da sua atenção</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CartaoIndicador titulo="Novas candidaturas" valor={pendentes} descricao={pendentes ? "Revisar formulários pendentes" : "Nenhuma nova pendência"} icone={Inbox} aoClicar={() => { setStatusCandidatura("pending"); navegarParaAba("candidaturas"); }} />
                <CartaoIndicador titulo="Triagens abertas" valor={candidaturasAbertas.length} descricao="Acompanhar processos em andamento" icone={FileCheck2} aoClicar={() => { setStatusCandidatura("todos"); navegarParaAba("candidaturas"); }} />
                <CartaoIndicador titulo="Pets disponíveis" valor={disponiveis} descricao="Revisar anúncios publicados" icone={PawPrint} aoClicar={() => { setStatusAnimal("available"); navegarParaAba("animais"); }} />
                <CartaoIndicador titulo="Adoções concluídas" valor={adocoesConcluidas} descricao="Ver indicadores do trabalho" icone={CircleCheckBig} aoClicar={() => navegarParaAba("metricas")} />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Fila de trabalho</p><h2 className="font-serif text-xl font-bold text-foreground">Candidaturas recentes</h2></div>
                  <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => navegarParaAba("candidaturas")}>Ver todas<ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
                {candidaturasGuardiao.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-7 text-center text-sm text-muted-foreground">As candidaturas aparecerão aqui quando forem enviadas.</div>
                ) : (
                  <div className="space-y-2">
                    {[...candidaturasGuardiao].sort((a, b) => obterUltimaAtividade(b) - obterUltimaAtividade(a)).slice(0, 5).map((item) => (
                      <button key={item.id} type="button" onClick={() => selecionarCandidatura(item.id)} className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{item.candidate.name}</p><p className="truncate text-xs text-muted-foreground">{item.petName} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}</p></div>
                        <Badge variant="outline" className={CONFIGURACAO_STATUS_CANDIDATURA[item.status].classe}>{CONFIGURACAO_STATUS_CANDIDATURA[item.status].rotulo}</Badge>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Qualidade dos anúncios</p><h2 className="font-serif text-xl font-bold text-foreground">Pets que precisam de revisão</h2></div>
                  <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => { setOrdenacaoAnimais("completude"); navegarParaAba("animais"); }}>Gerenciar<ArrowRight className="ml-1 h-4 w-4" /></Button>
                </div>
                {animaisGuardiao.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-7 text-center"><p className="text-sm text-muted-foreground">Cadastre seu primeiro animal para começar.</p><Button asChild variant="outline" className="mt-4 min-h-[44px] rounded-full"><Link href="/dashboard/pets/novo">Cadastrar pet</Link></Button></div>
                ) : animaisQuePrecisamAtencao.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-7 text-center"><ShieldCheck className="mx-auto mb-2 h-7 w-7 text-emerald-600 dark:text-emerald-400" /><p className="text-sm font-bold text-foreground">Anúncios bem preenchidos</p><p className="mt-1 text-xs text-muted-foreground">Todos os perfis atingiram pelo menos 80% de completude.</p></div>
                ) : (
                  <div className="space-y-3">
                    {animaisQuePrecisamAtencao.slice(0, 5).map((pet) => {
                      const completude = obterCompletudePet(pet);
                      return (
                        <div key={pet.id} className="flex items-center gap-3 rounded-2xl bg-muted/35 p-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={pet.photos[0]} alt="" fill sizes="48px" className="object-cover" /></div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{pet.name}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${completude}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">{completude}% preenchido</p></div>
                          <Button asChild variant="ghost" size="icon-sm" className="min-h-[44px] min-w-[44px]"><Link href={`/dashboard/pets/${pet.id}/editar`} aria-label={`Completar anúncio de ${pet.name}`}><Pencil className="h-4 w-4" /></Link></Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
          )
        )}

        {abaAtiva === "candidaturas" && (
          applicationsLoading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando candidaturas" /></div>
          : applicationsError ? <EstadoErro titulo="Candidaturas indisponíveis" mensagem={applicationsError} aoTentarNovamente={reloadApplications} />
          : <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Triagem responsável</p><h2 className="font-serif text-2xl font-bold text-foreground">Candidaturas recebidas</h2><p className="mt-1 text-sm text-muted-foreground">Filtre a fila, revise o dossiê e registre cada próximo passo.</p></div>
                <p aria-live="polite" className="text-xs font-semibold text-muted-foreground">{candidaturasFiltradas.length} de {candidaturasGuardiao.length} candidatura(s)</p>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="relative sm:col-span-2 lg:col-span-1"><span className="sr-only">Buscar candidatura</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={buscaCandidatura} onChange={(e) => setBuscaCandidatura(e.target.value)} placeholder="Candidato ou pet" className="min-h-[44px] w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                <label><span className="sr-only">Filtrar por status</span><select value={statusCandidatura} onChange={(e) => setStatusCandidatura(e.target.value as ApplicationStatus | "todos")} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="todos">Todos os status</option>{Object.entries(CONFIGURACAO_STATUS_CANDIDATURA).map(([valor, info]) => <option key={valor} value={valor}>{info.rotulo}</option>)}</select></label>
                <label><span className="sr-only">Filtrar por pet</span><select value={petCandidatura} onChange={(e) => setPetCandidatura(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="todos">Todos os pets</option>{animaisGuardiao.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
                <label><span className="sr-only">Ordenar candidaturas</span><select value={ordenacaoCandidaturas} onChange={(e) => setOrdenacaoCandidaturas(e.target.value as OrdenacaoCandidaturas)} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="recentes">Mais recentes</option><option value="antigas">Mais antigas</option><option value="atividade">Atividade recente</option></select></label>
              </div>
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                <section aria-label="Lista de candidaturas" className="space-y-3 lg:col-span-4">
                  {candidaturasFiltradas.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center"><FileCheck2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-bold text-foreground">Nenhuma candidatura encontrada</p><p className="mt-1 text-xs text-muted-foreground">Ajuste os filtros ou aguarde novos formulários.</p></div>
                  ) : candidaturasFiltradas.map((item) => {
                    const selecionada = candidaturaSelecionada?.id === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => selecionarCandidatura(item.id)} className={`min-h-[88px] w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selecionada ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30"}`}>
                        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{item.candidate.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">Para {item.petName}</p></div><Badge variant="outline" className={`shrink-0 ${CONFIGURACAO_STATUS_CANDIDATURA[item.status].classe}`}>{CONFIGURACAO_STATUS_CANDIDATURA[item.status].rotulo}</Badge></div>
                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground"><span>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span><span>{item.messages.length} mensagem(ns)</span></div>
                      </button>
                    );
                  })}
                </section>
                <div className="hidden lg:col-span-8 lg:block">{candidaturaSelecionada ? renderizarDossie(candidaturaSelecionada, "desktop") : <div className="rounded-3xl border border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">Selecione uma candidatura para abrir o dossiê.</div>}</div>
              </div>
            </div>
        )}

        {abaAtiva === "animais" && (
          petsLoading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando animais" /></div>
          : petsError ? <EstadoErro titulo="Animais indisponíveis" mensagem={petsError} aoTentarNovamente={() => void reloadPets()} />
          : <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Inventário de adoção</p><h2 className="font-serif text-2xl font-bold text-foreground">Seus animais</h2><p className="mt-1 text-sm text-muted-foreground">Encontre anúncios, acompanhe a procura e mantenha as informações atualizadas.</p></div><Button asChild variant="outline" className="min-h-[44px] rounded-full"><Link href="/dashboard/pets/novo"><Plus className="mr-2 h-4 w-4" />Novo pet</Link></Button></div>
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
                <label className="relative sm:col-span-2"><span className="sr-only">Buscar animal</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={buscaAnimal} onChange={(e) => setBuscaAnimal(e.target.value)} placeholder="Nome ou raça" className="min-h-[44px] w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                <label><span className="sr-only">Filtrar status</span><select value={statusAnimal} onChange={(e) => setStatusAnimal(e.target.value as PetAdoptionStatus | "todos")} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="todos">Todos os status</option>{Object.entries(ROTULOS_STATUS_PET).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label>
                <label><span className="sr-only">Filtrar espécie</span><select value={especieAnimal} onChange={(e) => setEspecieAnimal(e.target.value as Pet["species"] | "todos")} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="todos">Todas as espécies</option><option value="dog">Cachorros</option><option value="cat">Gatos</option></select></label>
                <label><span className="sr-only">Ordenar animais</span><select value={ordenacaoAnimais} onChange={(e) => setOrdenacaoAnimais(e.target.value as OrdenacaoAnimais)} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-sm font-medium"><option value="recentes">Mais recentes</option><option value="nome">Nome</option><option value="completude">Menor completude</option></select></label>
                <div className="hidden items-center justify-end gap-1 md:flex"><Button type="button" variant={modoAnimais === "cartoes" ? "secondary" : "ghost"} size="icon-sm" className="min-h-[44px] min-w-[44px]" onClick={() => setModoAnimais("cartoes")} aria-label="Exibir cartões"><Grid2X2 className="h-4 w-4" /></Button><Button type="button" variant={modoAnimais === "lista" ? "secondary" : "ghost"} size="icon-sm" className="min-h-[44px] min-w-[44px]" onClick={() => setModoAnimais("lista")} aria-label="Exibir lista"><List className="h-4 w-4" /></Button></div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span aria-live="polite">{animaisFiltrados.length} de {animaisGuardiao.length} animal(is)</span><span className="flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" />Filtros ativos na sessão</span></div>
              {animaisFiltrados.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center"><PawPrint className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><p className="font-bold text-foreground">Nenhum animal encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou cadastre um novo pet.</p></div>
              ) : modoAnimais === "lista" ? (
                <div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-4 font-semibold">Animal</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold">Candidaturas</th><th className="p-4 font-semibold">Completude</th><th className="p-4 text-right font-semibold">Ações</th></tr></thead><tbody>{animaisFiltrados.map((pet) => { const completude = obterCompletudePet(pet); return <tr key={pet.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20"><td className="p-4"><div className="flex items-center gap-3"><div className="relative h-12 w-12 overflow-hidden rounded-xl bg-muted"><Image src={pet.photos[0]} alt="" fill sizes="48px" className="object-cover" /></div><div><p className="font-bold text-foreground">{pet.name}</p><p className="text-xs text-muted-foreground">{pet.breed} · {pet.species === "dog" ? "Cachorro" : "Gato"}</p></div></div></td><td className="p-4"><select value={pet.status} onChange={(e) => void updatePet(pet.id, { status: e.target.value as PetAdoptionStatus })} className="min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs font-bold"><option value="available">Disponível</option><option value="in_process">Em processo</option><option value="adopted">Adotado</option></select></td><td className="p-4 text-muted-foreground">{contagemCandidaturasPorPet.get(pet.id) || 0}</td><td className="p-4"><span className="font-bold text-foreground">{completude}%</span></td><td className="p-4"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon-sm" className="min-h-[44px] min-w-[44px]"><Link href={`/pets/${pet.id}`} aria-label={`Ver anúncio de ${pet.name}`}><Eye className="h-4 w-4" /></Link></Button><Button asChild variant="ghost" size="icon-sm" className="min-h-[44px] min-w-[44px]"><Link href={`/dashboard/pets/${pet.id}/editar`} aria-label={`Editar ${pet.name}`}><Pencil className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon-sm" className="min-h-[44px] min-w-[44px] text-destructive" onClick={() => setPetIdParaExcluir(pet.id)} aria-label={`Remover ${pet.name}`}><Trash2 className="h-4 w-4" /></Button></div></td></tr>; })}</tbody></table></div></div>
              ) : null}
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${modoAnimais === "lista" ? "md:hidden" : ""}`}>{animaisFiltrados.map((pet) => { const completude = obterCompletudePet(pet); return <article key={pet.id} className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"><div className="relative aspect-[16/9] bg-muted"><Image src={pet.photos[0]} alt={`Foto de ${pet.name}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /><Badge className="absolute left-3 top-3" variant={pet.status === "available" ? "default" : "secondary"}>{ROTULOS_STATUS_PET[pet.status]}</Badge></div><div className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-serif text-xl font-bold text-foreground">{pet.name}</h3><p className="truncate text-xs text-muted-foreground">{pet.breed} · {pet.approximateAge}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground">{contagemCandidaturasPorPet.get(pet.id) || 0} candidatura(s)</span></div><div><div className="flex justify-between text-[11px] text-muted-foreground"><span>Completude do anúncio</span><strong className="text-foreground">{completude}%</strong></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${completude}%` }} /></div></div><label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">Status<select value={pet.status} onChange={(e) => void updatePet(pet.id, { status: e.target.value as PetAdoptionStatus })} className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 font-bold text-foreground"><option value="available">Disponível</option><option value="in_process">Em processo</option><option value="adopted">Adotado</option></select></label><div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3"><Button asChild variant="ghost" size="sm" className="min-h-[44px]"><Link href={`/pets/${pet.id}`}><Eye className="mr-1 h-4 w-4" />Ver</Link></Button><Button asChild variant="outline" size="sm" className="min-h-[44px]"><Link href={`/dashboard/pets/${pet.id}/editar`}><Pencil className="mr-1 h-4 w-4" />Editar</Link></Button><Button variant="ghost" size="sm" className="min-h-[44px] text-destructive" onClick={() => setPetIdParaExcluir(pet.id)}><Trash2 className="mr-1 h-4 w-4" />Excluir</Button></div></div></article>; })}</div>
            </div>
        )}

        {abaAtiva === "metricas" && (
          petsLoading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando indicadores" /></div>
          : petsError ? <EstadoErro titulo="Indicadores indisponíveis" mensagem={petsError} aoTentarNovamente={() => void reloadPets()} />
          : <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Dados reais do perfil</p><h2 className="font-serif text-2xl font-bold text-foreground">Indicadores</h2><p className="mt-1 text-sm text-muted-foreground">Resumo operacional calculado a partir dos animais e candidaturas registrados.</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><CartaoIndicador titulo="Pets cadastrados" valor={animaisGuardiao.length} descricao="Abrir gestão de animais" icone={PawPrint} aoClicar={() => navegarParaAba("animais")} /><CartaoIndicador titulo="Adoções concluídas" valor={adocoesConcluidas} descricao="Conclusões registradas" icone={CircleCheckBig} /><CartaoIndicador titulo="Triagens abertas" valor={candidaturasAbertas.length} descricao="Abrir fila de candidaturas" icone={FileCheck2} aoClicar={() => navegarParaAba("candidaturas")} /><CartaoIndicador titulo="Taxa de adoção" valor={taxaAdocao === null ? "—" : `${taxaAdocao}%`} descricao="Pets adotados sobre cadastrados" icone={BarChart3} /></div><div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"><h3 className="font-serif text-xl font-bold text-foreground">Situação dos animais</h3><div className="mt-5 space-y-4">{([["Disponíveis", disponiveis], ["Em processo", emProcesso], ["Adotados", adotados]] as Array<[string, number]>).map(([rotulo, valor]) => { const percentual = animaisGuardiao.length ? Math.round((valor / animaisGuardiao.length) * 100) : 0; return <div key={rotulo}><div className="flex justify-between text-sm"><span className="text-muted-foreground">{rotulo}</span><strong className="text-foreground">{valor} · {percentual}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} /></div></div>; })}</div></section><section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"><h3 className="flex items-center gap-2 font-serif text-xl font-bold text-foreground"><ShieldCheck className="h-5 w-5 text-primary" />Cuidados cadastrados</h3><p className="mt-4 text-4xl font-bold text-foreground">{cuidadosCompletos}<span className="text-lg font-medium text-muted-foreground">/{animaisGuardiao.length}</span></p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Animais marcados como vacinados, castrados e vermifugados. Atualize o cadastro sempre que houver um novo cuidado veterinário.</p><Button variant="outline" className="mt-5 min-h-[44px] rounded-full" onClick={() => navegarParaAba("animais")}>Revisar cadastros<ArrowRight className="ml-2 h-4 w-4" /></Button></section></div></div>
        )}
      </main>

      <SheetContent isOpen={detalheMovelAberto && Boolean(candidaturaSelecionada)} onOpenChange={setDetalheMovelAberto} className="w-full max-w-full overflow-y-auto p-0 sm:max-w-xl lg:hidden">
        <SheetHeader className="border-b border-border p-4 pr-14"><SheetTitle>Dossiê da candidatura</SheetTitle><SheetDescription>Revise as informações e atualize o andamento.</SheetDescription></SheetHeader>
        <div className="p-3 sm:p-4">{candidaturaSelecionada && renderizarDossie(candidaturaSelecionada, "movel")}</div>
      </SheetContent>

      <AlertDialogContent isOpen={Boolean(alteracaoStatus)} onOpenChange={(aberto) => { if (!aberto && !estaAtualizandoStatus) setAlteracaoStatus(null); }}>
        <AlertDialogHeader><AlertDialogTitle>Confirmar mudança de status?</AlertDialogTitle><AlertDialogDescription>{alteracaoStatus?.status === "completed" ? `A adoção de ${alteracaoStatus.candidatura.petName} será marcada como concluída e o pet passará para “Adotado”.` : alteracaoStatus?.candidatura.status === "completed" ? `A adoção será reaberta para avaliação e o status de ${alteracaoStatus.candidatura.petName} será recalculado.` : `A candidatura passará para “${alteracaoStatus ? CONFIGURACAO_STATUS_CANDIDATURA[alteracaoStatus.status].rotulo : ""}”. A alteração ficará registrada na conversa.`}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><Button variant="outline" disabled={estaAtualizandoStatus} onClick={() => setAlteracaoStatus(null)}>Cancelar</Button><Button disabled={estaAtualizandoStatus} onClick={() => void confirmarAlteracaoStatus()}>{estaAtualizandoStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</Button></AlertDialogFooter>
      </AlertDialogContent>

      <AlertDialogContent isOpen={Boolean(petParaExcluir)} onOpenChange={(aberto) => { if (!aberto && !estaExcluindoPet) setPetIdParaExcluir(null); }}>
        <AlertDialogHeader><AlertDialogTitle>Remover {petParaExcluir?.name}?</AlertDialogTitle><AlertDialogDescription>O anúncio e suas fotos serão removidos permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><Button variant="outline" disabled={estaExcluindoPet} onClick={() => setPetIdParaExcluir(null)}>Cancelar</Button><Button variant="destructive" disabled={estaExcluindoPet} onClick={() => void removerPet()}>{estaExcluindoPet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remover</Button></AlertDialogFooter>
      </AlertDialogContent>
    </div>
  );
}
