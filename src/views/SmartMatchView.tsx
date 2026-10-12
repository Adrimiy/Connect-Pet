"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { SmartMatchQuizData, MatchResult } from "@/types";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Heart,
  Baby,
  PawPrint,
  Sliders,
  ChevronRight,
  Info,
  Loader2,
  LogIn
} from "lucide-react";

export function SmartMatchView() {
  const { pets, calculateSmartMatch, enrichSmartMatchWithAI, currentUser } = useApp();

  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [resultadosComIa, setResultadosComIa] = useState<MatchResult[]>([]);
  const [estadoIa, setEstadoIa] = useState<"ocioso" | "carregando" | "concluido" | "indisponivel" | "login">("ocioso");

  const [quizData, setQuizData] = useState<SmartMatchQuizData>({
    preferredSpecies: "all",
    preferredSize: "all",
    preferredAge: "all",
    preferredEnergy: "all",
    hasChildren: false,
    residentPets: "none",
    acceptsSpecialNeeds: true
  });

  const questions = [
    {
      title: "Há crianças pequenas que conviverão com o pet?",
      subtitle: "A resposta será comparada somente com a convivência já observada e informada pelo responsável.",
      field: "hasChildren",
      options: [
        { label: "Sim, temos crianças pequenas em casa", value: true, icon: Baby },
        { label: "Não há crianças pequenas na residência", value: false, icon: Baby }
      ]
    },
    {
      title: "Quais animais já vivem na residência?",
      subtitle: "Usaremos apenas avaliações de convivência com cães e gatos registradas no anúncio.",
      field: "residentPets",
      options: [
        { label: "Nenhum", value: "none", icon: PawPrint },
        { label: "Cão ou cães", value: "dog", icon: PawPrint },
        { label: "Gato ou gatos", value: "cat", icon: PawPrint },
        { label: "Cães e gatos", value: "both", icon: PawPrint }
      ]
    },
    {
      title: "Você considera adotar um pet com necessidades especiais?",
      subtitle: "Essa resposta é comparada com as necessidades informadas no anúncio; detalhes serão tratados no dossiê e na conversa com o responsável.",
      field: "acceptsSpecialNeeds",
      options: [
        { label: "Sim, estou aberto e quero conhecer os cuidados", value: true, icon: Heart },
        { label: "Não neste momento", value: false, icon: Heart }
      ]
    },
    {
      title: "Qual nível de energia você procura?",
      subtitle: "O nível escolhido será comparado diretamente com o perfil informado no anúncio.",
      field: "preferredEnergy",
      options: [
        { label: "Sem preferência de energia", value: "all", icon: Sliders },
        { label: "Calmo", value: "calm", icon: Sliders },
        { label: "Moderado", value: "moderate", icon: Sliders },
        { label: "Alto", value: "high", icon: Sliders }
      ]
    },
    {
      title: "Você tem preferência por espécie?",
      subtitle: "Seja flexível se quiser ver mais opções compatíveis.",
      field: "preferredSpecies",
      options: [
        { label: "Tanto faz, quero o mais compatível", value: "all", icon: Heart },
        { label: "Prefiro Cão", value: "dog", icon: PawPrint },
        { label: "Prefiro Gato", value: "cat", icon: PawPrint }
      ]
    },
    {
      title: "Qual porte você se sente preparado para cuidar?",
      subtitle: "O porte influencia transporte, manejo, espaço e custos, mas não determina sozinho a adaptação.",
      field: "preferredSize",
      options: [
        { label: "Sem preferência de porte", value: "all", icon: Sliders },
        { label: "Pequeno", value: "small", icon: Sliders },
        { label: "Médio", value: "medium", icon: Sliders },
        { label: "Grande", value: "large", icon: Sliders }
      ]
    },
    {
      title: "Você tem preferência por faixa etária?",
      subtitle: "A faixa etária está disponível em todos os anúncios e influencia a ordem das recomendações.",
      field: "preferredAge",
      options: [
        { label: "Sem preferência de idade", value: "all", icon: Sliders },
        { label: "Filhote", value: "puppy", icon: PawPrint },
        { label: "Jovem", value: "young", icon: PawPrint },
        { label: "Adulto", value: "adult", icon: PawPrint },
        { label: "Idoso", value: "senior", icon: PawPrint }
      ]
    }
  ];

  const handleOptionSelect = (field: keyof SmartMatchQuizData, value: string | number | boolean) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setResultadosComIa([]);
      setEstadoIa(currentUser ? "ocioso" : "login");
      setShowResults(true);
    }
  };

  // Compute matches
  const resultadosLocais: MatchResult[] = React.useMemo(() => {
    if (!showResults) return [];
    return pets
      .filter((pet) => pet.status === "available")
      .map((pet) => calculateSmartMatch(quizData, pet))
      .sort((a, b) => b.score - a.score);
  }, [showResults, pets, quizData, calculateSmartMatch]);

  const matchResults = resultadosComIa.length > 0 ? resultadosComIa : resultadosLocais;

  const contextualizarComIa = async () => {
    if (!currentUser || resultadosLocais.length === 0 || estadoIa === "carregando") return;
    setEstadoIa("carregando");
    const resultados = await enrichSmartMatchWithAI(quizData, resultadosLocais);
    setResultadosComIa(resultados);
    setEstadoIa(resultados.some((item) => item.origemAnalise === "ia") ? "concluido" : "indisponivel");
  };

  const restartQuiz = () => {
    setCurrentStep(0);
    setShowResults(false);
    setHasStarted(false);
    setResultadosComIa([]);
    setEstadoIa("ocioso");
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10 md:py-16 min-h-screen space-y-8 sm:space-y-12">
      
      {/* Intro Hero */}
      {!hasStarted && !showResults && (
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6 py-6 sm:py-12">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> IA explicável + critérios auditáveis
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Descubra o Pet Perfeito para o Seu Estilo de Vida
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Compare suas preferências e a composição do lar com informações objetivas dos anúncios. O resultado ajuda a descobrir pets, sem substituir a conversa com a ONG ou o doador.
          </p>

          <div className="pt-2 sm:pt-4">
            <button
              onClick={() => setHasStarted(true)}
              className="px-6 sm:px-8 py-3.5 sm:py-4 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Iniciar Questionário Inteligente <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Quiz Progress & Question */}
      {hasStarted && !showResults && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
          
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Pergunta {currentStep + 1} de {questions.length}</span>
              <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% concluído</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border/60 shadow-xl space-y-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                {questions[currentStep].title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {questions[currentStep].subtitle}
              </p>
            </div>

            <div className="space-y-3">
              {questions[currentStep].options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={String(option.value)}
                    onClick={() => handleOptionSelect(questions[currentStep].field as keyof SmartMatchQuizData, option.value)}
                    className="w-full p-4 min-h-[44px] rounded-2xl border border-border/70 hover:border-primary/50 hover:bg-primary/5 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary group-hover:bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {option.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>

            {currentStep > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground min-h-[44px] inline-flex items-center py-2"
                >
                  ← Voltar à pergunta anterior
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Results Ranking */}
      {showResults && (
        <div className="space-y-10 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Resultado do Smart Match
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-1">
                Seus Animais Ideais Ranqueados
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Comparamos suas respostas somente com espécie, porte, idade, energia, necessidades especiais e convivência registrada para cada pet. Informações não avaliadas não geram compatibilidade positiva.
              </p>
            </div>

            <button
              onClick={restartQuiz}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-full border border-border text-xs font-semibold hover:bg-secondary transition-colors w-full sm:w-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refazer Questionário
            </button>
          </div>

          {resultadosLocais.length > 0 && <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 text-xs text-muted-foreground">
            {estadoIa === "ocioso" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="leading-relaxed">
                  O ranking abaixo já está pronto e não depende de IA. Ao contextualizar, apenas suas preferências e a composição geral do lar — sem nome ou contato — serão enviadas ao GroqCloud.
                </p>
                <button
                  type="button"
                  onClick={() => void contextualizarComIa()}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-4 w-4" /> Contextualizar com IA
                </button>
              </div>
            )}
            {estadoIa === "carregando" && (
              <p className="flex items-center gap-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> A IA está contextualizando os três melhores resultados. O ranking local já está disponível.
              </p>
            )}
            {estadoIa === "concluido" && (
              <p className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Explicações contextualizadas por IA. As notas continuam sendo calculadas por critérios fixos e auditáveis.
              </p>
            )}
            {estadoIa === "indisponivel" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0 text-primary" /> A IA está indisponível ou atingiu a cota gratuita. O ranking local continua disponível.
                </p>
                <button type="button" onClick={() => void contextualizarComIa()} className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-border bg-background px-4 font-semibold text-foreground hover:bg-muted">
                  Tentar novamente
                </button>
              </div>
            )}
            {estadoIa === "login" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>A pontuação local está pronta. Entre na sua conta para adicionar explicações contextualizadas pela IA.</p>
                <Link href="/login?redirect=/match" className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 font-semibold text-foreground hover:bg-muted">
                  <LogIn className="h-4 w-4" /> Entrar para usar IA
                </Link>
              </div>
            )}
          </div>}

          {resultadosLocais.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center sm:p-10">
              <PawPrint className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-serif text-xl font-bold text-foreground">Nenhum pet disponível no momento</h3>
              <p className="mt-1 text-sm text-muted-foreground">O questionário foi concluído, mas não há animais disponíveis para ranquear. Volte ao catálogo mais tarde.</p>
              <Link href="/pets" className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">Ver catálogo</Link>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-6">
            {matchResults.map((result, index) => {
              const pet = result.pet;
              const isTopMatch = index === 0;

              return (
                <div
                  key={pet.id}
                  className={`p-4 sm:p-8 rounded-3xl border bg-card shadow-sm transition-all flex flex-col lg:flex-row items-start lg:items-center gap-5 sm:gap-6 ${
                    isTopMatch ? "border-primary/40 shadow-lg bg-primary/[0.02]" : "border-border/60"
                  }`}
                >
                  {/* Photo with rank badge */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary lg:aspect-square lg:w-1/4 lg:max-w-56 lg:shrink-0">
                    <Image
                      src={pet.photos[0]}
                      alt={pet.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      #{index + 1} no Ranking
                    </div>
                  </div>

                  {/* Core Pet & Match Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-primary tracking-wider">
                          {pet.species === "dog" ? "Cão" : "Gato"} • {pet.breed}
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-foreground">
                          {pet.name}
                        </h3>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-base sm:text-lg">Índice {result.score}/100</span>
                      </div>
                    </div>

                    {/* Fatores determinísticos e contextualização opcional por IA */}
                    {result.resumoIa && (
                      <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                        <p className="font-bold">Contexto adicional da IA</p>
                        <p>{result.resumoIa}</p>
                        {result.motivosIa && result.motivosIa.length > 0 && <ul className="list-inside list-disc space-y-1 text-muted-foreground">{result.motivosIa.map((motivo) => <li key={motivo}>{motivo}</li>)}</ul>}
                        {result.cuidadosIa && result.cuidadosIa.length > 0 && <p className="text-muted-foreground"><strong className="text-foreground">Cuidados sugeridos:</strong> {result.cuidadosIa.join(" ")}</p>}
                      </div>
                    )}
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-foreground block">Fatores usados no índice:</span>
                      <ul className="space-y-1 text-muted-foreground">
                        {result.matchedReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Adaptation Tips */}
                    {result.adaptationTips.length > 0 && (
                      <div className="p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">Dica de adaptação: </strong>
                          {result.adaptationTips.join(" ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
                    <Link
                      href={`/pets/${pet.id}`}
                      className="w-full lg:w-auto px-6 py-3 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
                    >
                      Ver Perfil & Adotar <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
