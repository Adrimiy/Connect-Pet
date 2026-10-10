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
  const [ngoName, setNgoName] = useState("");
  const [ngoEmail, setNgoEmail] = useState("");
  const [ngoDocument, setNgoDocument] = useState("");
  const [ngoCity, setNgoCity] = useState("São Paulo");
  const [ngoPassword, setNgoPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trava síncrona contra múltiplos envios/duplo-clique concorrente
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessInfo(null);

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
        if (!ngoName.trim() || ngoName.trim().length < 3) {
          const msg = "Por favor, informe o nome da ONG ou Instituição (mínimo 3 caracteres).";
          setErrorMessage(msg);
          showToast("Atenção", msg, "warning");
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }

        const cnpjValidation = validateCNPJ(ngoDocument);
        if (!cnpjValidation.valid) {
          const msg = cnpjValidation.error || "CNPJ inválido. Verifique os números digitados.";
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

        if (!isValidEmail(targetEmail)) {
          const msg = "Por favor, informe um endereço de e-mail institucional válido.";
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
            guardianType: "ngo",
            name: ngoName.trim(),
            document: ngoDocument.trim(),
            primaryPhone: "(11) 99888-7766",
            city: ngoCity.trim(),
            state: "SP",
            neighborhood: "Centro",
            verified: true
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
        // 2. Persistir perfil na tabela profiles se disponível
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            role: roleTab,
            name: isAdopterRole ? adopterName.trim() : ngoName.trim(),
            email: targetEmail,
            primary_phone: isAdopterRole ? adopterPhone.trim() : "(11) 99888-7766",
            avatar: null,
            cpf: isAdopterRole ? adopterCpf.trim() : undefined,
            birth_date: isAdopterRole ? adopterBirthDate : undefined,
            profession: isAdopterRole ? adopterProfession.trim() : undefined,
            social_media: isAdopterRole ? (adopterSocialMedia.trim() || null) : null,
            guardian_type: isAdopterRole ? undefined : "ngo",
            document: isAdopterRole ? undefined : ngoDocument.trim(),
            city: isAdopterRole ? undefined : ngoCity.trim(),
            state: isAdopterRole ? undefined : "SP",
            neighborhood: isAdopterRole ? undefined : "Centro"
          });
        } catch (dbErr) {
          console.warn("Supabase profiles upsert skipped:", dbErr);
        }

        // 3. Login automático imediato sem depender de confirmação de e-mail
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

        {successInfo && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
            <p className="font-bold">Quase lá!</p>
            <p>{successInfo}</p>
            <Link href="/login" className="inline-block mt-2 font-bold text-primary underline">
              Ir para tela de login
            </Link>
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="font-bold text-foreground">Nome da ONG / Instituição *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    placeholder="Nome da organização"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ngo-cnpj-field" className="font-bold text-foreground">CNPJ da Instituição / Doador *</label>
                    {ngoDocument && (
                      <span className={`text-[10px] font-medium ${
                        isValidCNPJ(ngoDocument)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ngoDocument.replace(/\D/g, "").length === 14
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}>
                        {ngoDocument.replace(/\D/g, "").length}/14 dígitos
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="ngo-cnpj-field"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={18}
                      value={ngoDocument}
                      onChange={(e) => setNgoDocument(formatCNPJ(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {ngoDocument.replace(/\D/g, "").length > 0 && ngoDocument.replace(/\D/g, "").length < 14 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      CNPJ incompleto (informe os 14 dígitos).
                    </p>
                  )}
                  {ngoDocument.replace(/\D/g, "").length === 14 && !isValidCNPJ(ngoDocument) && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400">
                      CNPJ inválido. Verifique os dígitos verificadores informados.
                    </p>
                  )}
                  {isValidCNPJ(ngoDocument) && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ CNPJ matematicamente válido.
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">E-mail Institucional *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={ngoEmail}
                    onChange={(e) => setNgoEmail(e.target.value)}
                    placeholder="contato@ong.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
