"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import { isValidEmail } from "@/lib/validation";
import {
  PawPrint,
  UserCheck,
  Building2,
  Mail,
  Lock,
  ArrowRight
} from "lucide-react";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const initialEmail = searchParams.get("email") || "";

  const { showToast } = useApp();

  const [roleTab, setRoleTab] = useState<"adopter" | "guardian">("adopter");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const targetEmail = email.trim();
      const targetPassword = password;

      if (!targetEmail || !targetPassword) {
        setErrorMessage("Por favor, preencha o e-mail e a senha.");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      if (!isValidEmail(targetEmail)) {
        setErrorMessage("Por favor, informe um endereço de e-mail válido.");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          error.code === "over_request_rate_limit";

        if (isRateLimit) {
          setErrorMessage("Muitas tentativas de login em pouco tempo. Aguarde alguns instantes antes de tentar novamente.");
        } else if (error.code === "invalid_credentials" || error.message.includes("Invalid login credentials")) {
          setErrorMessage("E-mail ou senha incorretos.");
        } else if (error.code === "email_not_confirmed" || error.message.includes("Email not confirmed")) {
          setErrorMessage("Este e-mail ainda requer confirmação no Supabase. Para login imediato sem e-mail, desative a opção 'Confirm email' no painel do Supabase (Authentication > Providers > Email).");
        } else {
          setErrorMessage(error.message);
        }
        showToast("Erro no login", isRateLimit ? "Limite temporário de tentativas. Aguarde um momento." : error.message, "error");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      if (data.session && data.user) {
        showToast("Bem-vindo(a) de volta!", "Login realizado com sucesso.", "success");
        const userRole = data.user.user_metadata?.role || roleTab;
        if (userRole === "guardian") {
          router.push(redirect === "/" ? "/dashboard" : redirect);
        } else {
          router.push(redirect);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao efetuar login.";
      setErrorMessage(msg);
      showToast("Erro no login", msg, "error");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-5 sm:p-8 space-y-6 animate-in fade-in">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 mb-2">
            <PawPrint className="w-6 h-6 fill-current" />
          </Link>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Acesse o ConnectPet
          </h1>
          <p className="text-xs text-muted-foreground">
            Adoção responsável, transparente e 100% gratuita.
          </p>
        </div>

        {/* Role Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-secondary/50 border border-border/50">
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

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">E-mail Cadastrado</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                maxLength={100}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                maxLength={64}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 shadow-md transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar na Plataforma"} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Footer info */}
        <div className="pt-2 text-center text-xs text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-primary hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </div>

      </div>
    </div>
  );
}
