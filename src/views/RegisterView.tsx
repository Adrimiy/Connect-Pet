"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { sanitizeRedirect } from "@/components/auth/auth-features";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import {
  PawPrint,
  UserCheck,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Phone,
  User,
  MapPin,
  FileText,
  Briefcase,
  AtSign,
  Calendar
} from "lucide-react";

import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  isValidCPF,
  isValidCNPJ,
  isValidBirthDate,
  isValidPhone,
  isValidEmail,
  validateCNPJ,
  validateCPF,
  validateFullName
} from "@/lib/validation";

const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function RegisterView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = redirectParam ? sanitizeRedirect(redirectParam, "") : "";
  const { showToast } = useApp();

  const [roleTab, setRoleTab] = useState<"adopter" | "guardian">("adopter");

  // Adopter Form (8 campos especificados)
  const [adopterName, setAdopterName] = useState("");
  const [adopterBirthDate, setAdopterBirthDate] = useState("");
  const [adopterCpf, setAdopterCpf] = useState("");
  const [adopterSocialMedia, setAdopterSocialMedia] = useState("");
  const [adopterProfession, setAdopterProfession] = useState("");
  const [adopterPhone, setAdopterPhone] = useState("");
  const [adopterEmail, setAdopterEmail] = useState("");
  const [adopterPassword, setAdopterPassword] = useState("");

  // Guardian Form
  const [guardianType, setGuardianType] = useState<"ngo" | "individual">("ngo");
  const [ngoName, setNgoName] = useState("");
  const [ngoEmail, setNgoEmail] = useState("");
  const [ngoDocument, setNgoDocument] = useState("");
  const [ngoCity, setNgoCity] = useState("");
  const [ngoState, setNgoState] = useState("");
  const [ngoPhone, setNgoPhone] = useState("");
  const [ngoPassword, setNgoPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trava síncrona contra múltiplos envios/duplo-clique concorrente
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const isAdopterRole = roleTab === "adopter";
      const targetEmail = isAdopterRole ? adopterEmail.trim() : ngoEmail.trim();
      const targetPassword = isAdopterRole ? adopterPassword : ngoPassword;

      // Validação detalhada dos campos para o perfil Adotante
      if (isAdopterRole) {
        const nameValidation = validateFullName(adopterName, "Nome completo");
        if (!nameValidation.valid) {
          const msg = nameValidation.error || "Por favor, informe seu nome completo (nome e sobrenome).";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const dateValidation = isValidBirthDate(adopterBirthDate);
        if (!dateValidation.valid) {
          const msg = dateValidation.error || "Data de nascimento inválida.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const cpfValidation = validateCPF(adopterCpf);
        if (!cpfValidation.valid) {
          const msg = cpfValidation.error || "CPF inválido. Por favor, confira os números digitados.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!adopterProfession.trim() || adopterProfession.trim().length < 2) {
          const msg = "Por favor, informe sua profissão ou ocupação.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const phoneValidation = isValidPhone(adopterPhone);
        if (!phoneValidation) {
          const msg = "WhatsApp/Celular inválido. Informe o DDD e o número completo (9 dígitos).";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!isValidEmail(targetEmail)) {
          const msg = "Por favor, informe um endereço de e-mail válido.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (targetPassword.length < 6) {
          const msg = "A senha deve conter no mínimo 6 caracteres.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      } else {
        // Validações robustas para Guardião / ONG / Doador
        const guardianNameValidation = guardianType === "individual"
          ? validateFullName(ngoName, "Nome completo")
          : { valid: ngoName.trim().length >= 3, error: "Informe o nome da ONG ou instituição (mínimo 3 caracteres)." };
        if (!guardianNameValidation.valid) {
          const msg = guardianNameValidation.error || "Por favor, informe o nome do responsável.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const documentValidation = guardianType === "ngo"
          ? validateCNPJ(ngoDocument)
          : validateCPF(ngoDocument);
        if (!documentValidation.valid) {
          const msg = documentValidation.error || `${guardianType === "ngo" ? "CNPJ" : "CPF"} inválido. Verifique os números digitados.`;
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!ngoCity.trim() || ngoCity.trim().length < 2) {
          const msg = "Por favor, informe a cidade de atuação.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!ESTADOS_BRASILEIROS.includes(ngoState)) {
          const msg = "Por favor, selecione o estado de atuação.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!isValidPhone(ngoPhone)) {
          const msg = "WhatsApp/Celular inválido. Informe o DDD e o número completo.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (!isValidEmail(targetEmail)) {
          const msg = "Por favor, informe um endereço de e-mail válido.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        if (targetPassword.length < 6) {
          const msg = "A senha deve conter no mínimo 6 caracteres.";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      const metadata = isAdopterRole
        ? {
            role: "adopter",
            name: adopterName.trim(),
            birthDate: adopterBirthDate,
            cpf: adopterCpf.trim(),
            socialMedia: adopterSocialMedia.trim() || undefined,
            profession: adopterProfession.trim(),
            primaryPhone: adopterPhone.trim()
          }
        : {
            role: "guardian",
            guardianType,
            name: ngoName.trim(),
            document: ngoDocument.trim(),
            primaryPhone: ngoPhone.trim(),
            city: ngoCity.trim(),
            state: ngoState,
            neighborhood: ""
          };

      // 1. Criar usuário no Supabase Auth (apenas uma chamada única)
      const { data, error: authError } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
        options: {
          data: metadata
        }
      });

      if (authError) {
        const isRateLimit =
          authError.message.toLowerCase().includes("rate limit") ||
          authError.code === "over_email_send_rate_limit" ||
          authError.code === "over_request_rate_limit";

        if (isRateLimit) {
          setErrorMessage(
            "Limite de envio de e-mails atingido no Supabase. Por favor, aguarde alguns minutos antes de tentar novamente ou utilize outro e-mail."
          );
        } else if (authError.message.includes("already registered") || authError.code === "user_already_exists") {
          setErrorMessage("Este e-mail já está cadastrado. Tente fazer login.");
        } else if (authError.message.includes("Password should be")) {
          setErrorMessage("A senha é muito fraca. Utilize pelo menos 6 caracteres.");
        } else {
          setErrorMessage(authError.message);
        }

        showToast(
          "Erro no cadastro",
          isRateLimit
            ? "Limite temporário de envio atingido. Aguarde alguns minutos."
            : authError.message,
          "error"
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        // O perfil é criado pelo trigger documentado em supabase/schema.sql.
        // Login automático imediato quando a confirmação de e-mail está desativada.
        let activeSession = data.session;
        if (!activeSession) {
          try {
            const { data: loginData } = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: targetPassword,
            });
            activeSession = loginData?.session || null;
          } catch {
            // Continua para o redirecionamento
          }
        }

        if (activeSession) {
          showToast("Cadastro realizado com sucesso!", `Bem-vindo(a), ${metadata.name}!`, "success");
          router.push(isAdopterRole ? (safeRedirect || "/pets") : "/dashboard");
        } else {
          showToast("Cadastro realizado com sucesso!", "Sua conta foi criada com sucesso.", "success");
          const redirectQuery = safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : "";
          router.push(`/login?email=${encodeURIComponent(targetEmail)}${redirectQuery}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro ao processar seu cadastro.";
      setErrorMessage(msg);
      showToast("Erro no cadastro", msg, "error");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-xl p-5 sm:p-8 space-y-6 animate-in fade-in">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 mb-2">
            <PawPrint className="w-6 h-6 fill-current" />
          </Link>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Criar Conta no ConnectPet
          </h1>
          <p className="text-xs text-muted-foreground">
            Junte-se à maior rede ética de acolhimento e adoção responsável.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Role Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-muted/60 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setRoleTab("adopter")}
            className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
              roleTab === "adopter"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Quero Adotar
          </button>
          <button
            type="button"
            onClick={() => setRoleTab("guardian")}
            className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
              roleTab === "guardian"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" /> Sou ONG / Doador
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {roleTab === "adopter" ? (
            <>
              {/* 1. Nome Completo */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">Nome Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={adopterName}
                    onChange={(e) => setAdopterName(e.target.value)}
                    placeholder="Ex: Mariana da Silva Sauro"
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 2. Data de Nascimento e CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Data de Nascimento *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      min="1900-01-01"
                      max={new Date().toISOString().split("T")[0]}
                      value={adopterBirthDate}
                      onChange={(e) => setAdopterBirthDate(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Exigido mínimo de 18 anos completos para cadastro.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground">CPF *</label>
                    {adopterCpf && (
                      <span className={`text-[10px] font-medium ${
                        isValidCPF(adopterCpf)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : adopterCpf.replace(/\D/g, "").length === 11
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}>
                        {adopterCpf.replace(/\D/g, "").length}/11 dígitos
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={14}
                      value={adopterCpf}
                      onChange={(e) => setAdopterCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {adopterCpf.replace(/\D/g, "").length > 0 && adopterCpf.replace(/\D/g, "").length < 11 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      CPF incompleto (informe os 11 dígitos).
                    </p>
                  )}
                  {adopterCpf.replace(/\D/g, "").length === 11 && !isValidCPF(adopterCpf) && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400">
                      CPF inválido. Verifique os dígitos verificadores.
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Profissão / Ocupação e WhatsApp / Celular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Profissão / Ocupação *</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={adopterProfession}
                      onChange={(e) => setAdopterProfession(e.target.value)}
                      placeholder="Ex: Designer, Engenheiro"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">WhatsApp / Celular *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      maxLength={15}
                      value={adopterPhone}
                      onChange={(e) => setAdopterPhone(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Rede Social (Opcional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Rede Social</label>
                  <span className="text-[10px] text-muted-foreground font-normal">Opcional</span>
                </div>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={80}
                    value={adopterSocialMedia}
                    onChange={(e) => setAdopterSocialMedia(e.target.value)}
                    placeholder="@instagram ou linkedin.com/in/perfil"
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 5. E-mail */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">E-mail *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={adopterEmail}
                    onChange={(e) => setAdopterEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 6. Senha */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">Senha *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={64}
                    autoComplete="new-password"
                    value={adopterPassword}
                    onChange={(e) => setAdopterPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <span className="font-bold text-foreground">Tipo de responsável *</span>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGuardianType("ngo");
                      setNgoDocument("");
                    }}
                    className={`min-h-[44px] rounded-xl px-3 text-xs font-bold transition-colors ${guardianType === "ngo" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    ONG / Instituição
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGuardianType("individual");
                      setNgoDocument("");
                    }}
                    className={`min-h-[44px] rounded-xl px-3 text-xs font-bold transition-colors ${guardianType === "individual" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Doador individual
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">{guardianType === "ngo" ? "Nome da ONG / Instituição" : "Nome completo do doador"} *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    placeholder={guardianType === "ngo" ? "Nome da organização" : "Nome e sobrenome"}
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="guardian-document-field" className="font-bold text-foreground">{guardianType === "ngo" ? "CNPJ" : "CPF"} *</label>
                    {ngoDocument && (
                      <span className={`text-[10px] font-medium ${
                        (guardianType === "ngo" ? isValidCNPJ(ngoDocument) : isValidCPF(ngoDocument))
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ngoDocument.replace(/\D/g, "").length === (guardianType === "ngo" ? 14 : 11)
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}>
                        {ngoDocument.replace(/\D/g, "").length}/{guardianType === "ngo" ? 14 : 11} dígitos
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="guardian-document-field"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={guardianType === "ngo" ? 18 : 14}
                      value={ngoDocument}
                      onChange={(e) => setNgoDocument(guardianType === "ngo" ? formatCNPJ(e.target.value) : formatCPF(e.target.value))}
                      placeholder={guardianType === "ngo" ? "00.000.000/0001-00" : "000.000.000-00"}
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {ngoDocument.replace(/\D/g, "").length > 0 && ngoDocument.replace(/\D/g, "").length < (guardianType === "ngo" ? 14 : 11) && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      {guardianType === "ngo" ? "CNPJ" : "CPF"} incompleto.
                    </p>
                  )}
                  {ngoDocument.replace(/\D/g, "").length === (guardianType === "ngo" ? 14 : 11)
                    && !(guardianType === "ngo" ? isValidCNPJ(ngoDocument) : isValidCPF(ngoDocument)) && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400">
                      {guardianType === "ngo" ? "CNPJ" : "CPF"} inválido. Verifique os dígitos verificadores.
                    </p>
                  )}
                  {(guardianType === "ngo" ? isValidCNPJ(ngoDocument) : isValidCPF(ngoDocument)) && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ Documento válido.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Cidade de Atuação *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={ngoCity}
                      onChange={(e) => setNgoCity(e.target.value)}
                      placeholder="São Paulo"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="guardian-state" className="font-bold text-foreground">Estado *</label>
                  <select
                    id="guardian-state"
                    value={ngoState}
                    onChange={(e) => setNgoState(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Selecione</option>
                    {ESTADOS_BRASILEIROS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">WhatsApp / Celular *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    maxLength={15}
                    value={ngoPhone}
                    onChange={(e) => setNgoPhone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">{guardianType === "ngo" ? "E-mail institucional" : "E-mail"} *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={ngoEmail}
                    onChange={(e) => setNgoEmail(e.target.value)}
                    placeholder={guardianType === "ngo" ? "contato@ong.org" : "seu.email@exemplo.com"}
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={64}
                    autoComplete="new-password"
                    value={ngoPassword}
                    onChange={(e) => setNgoPassword(e.target.value)}
                    placeholder="••••••••"
                    className="min-h-[44px] w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 shadow-md transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Criando conta..." : "Cadastrar Gratuitamente"} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Já possui conta?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Faça login aqui
          </Link>
        </div>

      </div>
    </div>
  );
}
