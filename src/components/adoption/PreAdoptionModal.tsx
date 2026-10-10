"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Pet, PreAdoptionApplication, AdopterProfile } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Wallet,
  Lock,
  FileCheck2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCPF,
  isValidCPF,
  formatPhone,
  isValidPhone,
  isValidEmail,
  formatRG,
  validateFullName
} from "@/lib/validation";

interface PreAdoptionModalProps {
  pet: Pet;
  isOpen: boolean;
  onClose: () => void;
}

export function PreAdoptionModal({ pet, isOpen, onClose }: PreAdoptionModalProps) {
  const { currentUser, submitApplication, calculateAge, isAgeAllowed } = useApp();

  const [step, setStep] = useState<number>(0);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  // Form state initialized with current user if adopter
  const isAdopter = currentUser?.role === "adopter";
  const adopterData = isAdopter ? (currentUser as AdopterProfile) : null;
  const initialBirthDate = adopterData?.birthDate || "1998-01-01";

  const [formData, setFormData] = useState({
    // Step 1: Candidate
    name: adopterData?.name || currentUser?.name || "",
    birthDate: initialBirthDate,
    profession: adopterData?.profession || "",
    primaryPhone: adopterData?.primaryPhone || currentUser?.primaryPhone || "",
    email: adopterData?.email || currentUser?.email || "",
    socialMedia: adopterData?.socialMedia || currentUser?.socialMedia || "",
    cpf: adopterData?.cpf || "",
    rg: adopterData?.rg || "",

    // Step 2: Environment
    housingType: "apartamento" as "apartamento" | "casa" | "sobrado" | "sitio",
    housingStatus: "proprio" as "proprio" | "alugado",
    landlordPermission: true,
    hasProtection: true,
    protectionDetails: "Apartamento com telas de proteção de 5cm instaladas em todas as janelas e na sacada.",
    accessArea: "livre_total" as "livre_total" | "area_especifica",

    // Step 3: Routine & Family
    adultsCount: 2,
    childrenCount: 0,
    familyAgreement: true,
    allergyCases: false,
    allergyDetails: "",
    hoursAlone: 4,
    travelCarePlan: "Em viagens, ficará sob cuidados de familiares de confiança ou pet sitter contratada.",

    // Step 4: Pets & Finances
    hasCurrentPets: false,
    previousPetsHistory: "Cuidados veterinários e carinho garantidos para o bem-estar do animal.",
    costAwareness: true,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto trigger confetti when reaching step 5
  useEffect(() => {
    if (step === 5) {
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [step]);

  if (!isOpen) return null;

  // A data de nascimento no dossiê é estritamente a data definida na conta
  const candidateBirthDate = adopterData?.birthDate || formData.birthDate;
  const currentAge = calculateAge(candidateBirthDate);
  const isCandidateAdultEnough = isAgeAllowed(candidateBirthDate);

  const handleNext = () => {
    setValidationError(null);

    // Step 0 validation
    if (step === 0) {
      setStep(1);
      return;
    }

    // Step 1 validation: Name, birthdate, 21+ rule, phone, email, CPF
    if (step === 1) {
      const nameValidation = validateFullName(formData.name, "Nome completo");
      if (!nameValidation.valid) {
        setValidationError(nameValidation.error || "Por favor, informe seu nome completo (nome e sobrenome).");
        return;
      }
      if (!candidateBirthDate) {
        setValidationError("Data de nascimento obrigatória. Cadastre sua data de nascimento no seu perfil para continuar.");
        return;
      }
      if (!isCandidateAdultEnough) {
        setValidationError(
          `Candidato tem ${currentAge} anos. A política de guarda responsável exige idade mínima de 21 anos completos para ser o tutor legal.`
        );
        return;
      }
      if (!isValidPhone(formData.primaryPhone)) {
        setValidationError("Informe um número de WhatsApp/Telefone válido com DDD e dígitos completos.");
        return;
      }
      if (formData.email.trim() && !isValidEmail(formData.email)) {
        setValidationError("O endereço de e-mail informado é inválido. Por favor, confira o formato.");
        return;
      }
      if (formData.cpf.trim() && !isValidCPF(formData.cpf)) {
        setValidationError("O CPF informado é inválido. Verifique os números digitados.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation: Housing & protection
    if (step === 2) {
      if (formData.housingType === "apartamento" && !formData.hasProtection) {
        setValidationError("Para apartamentos, é imprescindível haver telas nas janelas e sacadas para a segurança do pet.");
        return;
      }
      if (formData.housingStatus === "alugado" && !formData.landlordPermission) {
        setValidationError("É necessário ter autorização do proprietário do imóvel ou convenção condominial para manter animais.");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3 validation: Family agreement
    if (step === 3) {
      if (!formData.familyAgreement) {
        setValidationError("Todos os moradores da residência devem estar de acordo com a adoção antes do envio.");
        return;
      }
      if (formData.allergyCases && !formData.allergyDetails.trim()) {
        setValidationError("Por favor, detalhe como a alergia é controlada e como será o manejo com o animal.");
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Submit Dossier
    if (step === 4) {
      if (!formData.costAwareness) {
        setValidationError("Você deve confirmar a ciência sobre os custos contínuos e veterinários do animal.");
        return;
      }

      // Build payload and submit
      const payload: Omit<PreAdoptionApplication, "id" | "createdAt" | "status" | "notes" | "messages" | "automatedAnalysis"> = {
        petId: pet.id,
        petName: pet.name,
        petPhoto: pet.photos[0],
        petSpecies: pet.species,
        guardianId: pet.guardianId,
        guardianName: pet.guardianName,
        guardianType: pet.guardianType,
        candidateId: currentUser?.id || "guest-adopter",
        candidate: {
          name: formData.name,
          birthDate: candidateBirthDate,
          profession: formData.profession,
          primaryPhone: formData.primaryPhone,
          email: formData.email,
          socialMedia: formData.socialMedia,
          cpf: formData.cpf,
          rg: formData.rg
        },
        housingType: formData.housingType,
        housingStatus: formData.housingStatus,
        landlordPermission: formData.landlordPermission,
        hasProtection: formData.hasProtection,
        protectionDetails: formData.protectionDetails,
        accessArea: formData.accessArea,
        adultsCount: Number(formData.adultsCount),
        childrenCount: Number(formData.childrenCount),
        familyAgreement: formData.familyAgreement,
        allergyCases: formData.allergyCases,
        allergyDetails: formData.allergyDetails,
        hoursAlone: Number(formData.hoursAlone),
        travelCarePlan: formData.travelCarePlan,
        hasCurrentPets: formData.hasCurrentPets,
        previousPetsHistory: formData.previousPetsHistory,
        costAwareness: formData.costAwareness
      };

      const newApp = submitApplication(payload);
      setCreatedAppId(newApp.id);
      setStep(5);
    }
  };

  const stepsTitle = [
    "Diretrizes & Ética",
    "Dados do Adotante",
    "Segurança da Moradia",
    "Rotina & Família",
    "Histórico & Custos",
    "Candidatura Concluída"
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        
        {/* Header with Pet info and Step Progress */}
        <div className="p-5 sm:p-6 border-b border-border/60 bg-secondary/30 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
              Etapa {step} de 5 • {stepsTitle[step]}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mt-0.5">
              Pré-Adoção de {pet.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-1.5 shrink-0">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-start gap-3 animate-in shake">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium leading-relaxed">
                {validationError}
              </div>
            </div>
          )}

          {/* ETAPA 0: DIRETRIZES */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20 text-foreground flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base">Adoção Consciente e Segura</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Adoção de um ser vivo é um ato permanente. Na plataforma ConnectPet não há qualquer cobrança ou comércio: priorizamos lares amorosos, preparados e protegidos.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                  Requisitos Obrigatórios para esta Adoção:
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span><strong>Idade mínima: 21 anos completos</strong> (comprovada por documento oficial).</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span><strong>Imóvel seguro:</strong> Telas em janelas/sacadas para apartamentos ou muros altos sem rota de fuga para casas.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span><strong>Concordância total:</strong> Todos os moradores da residência devem apoiar a acolhida.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span><strong>Compromisso financeiro:</strong> Custos contínuos com alimentação de qualidade, vacinas anuais e imprevistos de saúde.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/60 text-xs text-muted-foreground">
                Ao prosseguir, você responderá a um dossiê em 4 etapas detalhadas que será enviado diretamente para a <strong>{pet.guardianName}</strong>.
              </div>
            </div>
          )}

          {/* ETAPA 1: CANDIDATO & REGRA 21 ANOS */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nome Completo *</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Data de Nascimento *</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                        <Lock className="w-3 h-3 text-amber-500" />
                        Bloqueada para alteração
                      </span>
                    </span>
                    {candidateBirthDate && (
                      <span className={`text-[11px] font-bold ${isCandidateAdultEnough ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                        {currentAge} anos ({isCandidateAdultEnough ? "Permitido 21+" : "Menor de 21 anos"})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={candidateBirthDate}
                      readOnly
                      disabled
                      aria-readonly="true"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-muted/60 dark:bg-muted/40 text-muted-foreground text-sm cursor-not-allowed select-none opacity-85 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A data de nascimento é vinculada ao cadastro da sua conta e não pode ser modificada no dossiê de adoção.
                  </p>
                  {!isCandidateAdultEnough && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      Bloqueado: Para submeter formulário de adoção responsável você precisa ter 21 anos completos.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Profissão / Ocupação</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Ex: Designer, Engenheiro, Autônomo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">WhatsApp / Telefone *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      maxLength={15}
                      value={formData.primaryPhone}
                      onChange={(e) => setFormData({ ...formData, primaryPhone: formatPhone(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">E-mail Principal</label>
                  <input
                    type="email"
                    maxLength={100}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Rede Social (Instagram/LinkedIn)</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={formData.socialMedia}
                    onChange={(e) => setFormData({ ...formData, socialMedia: e.target.value })}
                    placeholder="@seu.perfil"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">CPF</label>
                    {formData.cpf && (
                      <span className={`text-[10px] font-medium ${
                        isValidCPF(formData.cpf)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : formData.cpf.replace(/\D/g, "").length === 11
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}>
                        {formData.cpf.replace(/\D/g, "").length}/11 dígitos
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">RG</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: formatRG(e.target.value) })}
                    placeholder="00.000.000-0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: AMBIENTE & SEGURANÇA */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tipo de Imóvel *</label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value as "apartamento" | "casa" | "sobrado" | "sitio" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="sobrado">Sobrado</option>
                    <option value="sitio">Chácara / Sítio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Condição do Imóvel *</label>
                  <select
                    value={formData.housingStatus}
                    onChange={(e) => setFormData({ ...formData, housingStatus: e.target.value as "proprio" | "alugado" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="proprio">Próprio</option>
                    <option value="alugado">Alugado</option>
                  </select>
                </div>
              </div>

              {formData.housingStatus === "alugado" && (
                <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    O proprietário / condomínio autoriza a presença de animais?
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.landlordPermission}
                    onChange={(e) => setFormData({ ...formData, landlordPermission: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                </div>
              )}

              {/* Housing protection declaration */}
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      {formData.housingType === "apartamento"
                        ? "Possui telas de proteção nas janelas e sacada?"
                        : "Possui muros altos e portão seguro sem vãos de fuga?"}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Segurança habitacional é critério indispensável contra quedas e atropelamentos.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hasProtection}
                    onChange={(e) => setFormData({ ...formData, hasProtection: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Detalhes da proteção física (altura dos muros, malha das redes, etc.):
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={formData.protectionDetails}
                    onChange={(e) => setFormData({ ...formData, protectionDetails: e.target.value })}
                    placeholder="Ex: Telas instaladas em 100% das janelas por empresa especializada com malha 5cm."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Área de circulação do animal na casa:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessArea: "livre_total" })}
                    className={`p-3 min-h-[44px] rounded-2xl border text-xs font-semibold text-center transition-all flex items-center justify-center ${
                      formData.accessArea === "livre_total"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Acesso 100% Livre pela casa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessArea: "area_especifica" })}
                    className={`p-3 min-h-[44px] rounded-2xl border text-xs font-semibold text-center transition-all flex items-center justify-center ${
                      formData.accessArea === "area_especifica"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Área restrita / Cômodos específicos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: ROTINA & FAMÍLIA */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Adultos na Residência</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.adultsCount}
                    onChange={(e) => setFormData({ ...formData, adultsCount: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Crianças na Casa</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.childrenCount}
                    onChange={(e) => setFormData({ ...formData, childrenCount: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Concordância Familiar Unânime *
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Todos os moradores estão 100% de acordo com a adoção deste animal?
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.familyAgreement}
                    onChange={(e) => setFormData({ ...formData, familyAgreement: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary mt-1 sm:mt-0 shrink-0"
                  />
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Alguém na casa possui histórico de alergia a pelos?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allergyCases}
                    onChange={(e) => setFormData({ ...formData, allergyCases: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                </div>

                {formData.allergyCases && (
                  <input
                    type="text"
                    maxLength={300}
                    value={formData.allergyDetails}
                    onChange={(e) => setFormData({ ...formData, allergyDetails: e.target.value })}
                    placeholder="Descreva o caso e se já há acompanhamento médico..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground">
                    Quantas horas o animal ficará sozinho em média por dia?
                  </label>
                  <span className="text-xs font-bold text-primary">{formData.hoursAlone} horas</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={14}
                  value={formData.hoursAlone}
                  onChange={(e) => setFormData({ ...formData, hoursAlone: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Sempre alguém em casa (0h)</span>
                  <span>Meio período (4h - 6h)</span>
                  <span>Tempo integral (8h+)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Plano para Férias e Viagens:
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={formData.travelCarePlan}
                  onChange={(e) => setFormData({ ...formData, travelCarePlan: e.target.value })}
                  placeholder="Com quem ou onde o animal ficará quando a família viajar?"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* ETAPA 4: HISTÓRICO & FINANÇAS */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      Você já possui outros animais em casa atualmente?
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Importante para prevermos a socialização e vacinação cruzada.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hasCurrentPets}
                    onChange={(e) => setFormData({ ...formData, hasCurrentPets: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Histórico de Pets Anteriores:
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.previousPetsHistory}
                  onChange={(e) => setFormData({ ...formData, previousPetsHistory: e.target.value })}
                  placeholder="Já teve animais antes? Por quanto tempo viveram e quais foram os cuidados?"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">
                      Consciência de Custos e Saúde Contínua *
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Manter um pet envolve custos contínuos: ração de boa qualidade (Super Premium/Premium), vermífugos periódicos, vacinação anual (V8/V10/V4/V5 + Raiva), antipulgas e possíveis cirurgias ou internações de emergência.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-primary/20">
                  <input
                    type="checkbox"
                    id="costAwareness"
                    checked={formData.costAwareness}
                    onChange={(e) => setFormData({ ...formData, costAwareness: e.target.checked })}
                    className="w-4 h-4 rounded text-primary accent-primary"
                  />
                  <label htmlFor="costAwareness" className="text-xs font-bold text-foreground cursor-pointer">
                    Declaro estar plenamente ciente e preparado financeiramente para esses custos.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 5: ENVIO & CELEBRAÇÃO */}
          {step === 5 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-in zoom-in-50">
                <Sparkles className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-foreground">
                  Candidatura Enviada com Sucesso!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Parabéns pela decisão de acolher uma vida com responsabilidade. O dossiê para adotar <strong>{pet.name}</strong> já está na mesa de triagem da <strong>{pet.guardianName}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 max-w-sm mx-auto text-xs space-y-1 text-muted-foreground">
                <p><strong>Protocolo:</strong> {createdAppId || "APP-CONFIRMADO"}</p>
                <p>A ONG entrará em contato pelo chat interno ou pelo WhatsApp informado para combinar a visita.</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="rounded-full shadow-md bg-primary hover:bg-primary/90">
                  <Link href="/minhas-candidaturas" onClick={onClose}>
                    <FileCheck2 className="w-4 h-4 mr-2" /> Acompanhar no Meu Painel
                  </Link>
                </Button>
                <Button variant="outline" onClick={onClose} className="rounded-full">
                  Voltar ao Catálogo
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        {step < 5 && (
          <div className="p-4 sm:p-6 border-t border-border/60 bg-secondary/20 flex items-center justify-between shrink-0">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setValidationError(null);
                  setStep(step - 1);
                }}
                className="rounded-full text-xs min-h-[44px] px-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              className="rounded-full px-6 text-xs sm:text-sm bg-primary hover:bg-primary/90 shadow-md min-h-[44px]"
            >
              {step === 0 && "Começar Dossiê"}
              {step > 0 && step < 4 && (
                <>
                  Avançar <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
              {step === 4 && (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" /> Submeter Candidatura
                </>
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
