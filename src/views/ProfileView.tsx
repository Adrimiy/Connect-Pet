"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  User,
  Camera,
  Trash2,
  Save,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Globe,
  Home,
  MapPin,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building,
  FileText,
  Lock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HousingType, SpeciesPreference, SizePreference, AdopterProfile, GuardianProfile, CurrentUser } from "@/types";
import { isValidPhone, validateFullName } from "@/lib/validation";
import { enviarAvatarPerfil, removerAvatarPerfil } from "@/lib/profileAvatar";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const { updateUserProfile, showToast, calculateAge } = useApp();

  const isAdopter = user.role === "adopter";
  const adopterUser = isAdopter ? (user as AdopterProfile) : null;
  const guardianUser = !isAdopter ? (user as GuardianProfile) : null;
  const isBirthDateLocked = Boolean(adopterUser?.birthDate);

  // Form states inicializados diretamente das props
  const [name, setName] = useState(user.name || "");
  const [primaryPhone, setPrimaryPhone] = useState(user.primaryPhone || "");
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar || undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Form states - Adotante
  const [birthDate, setBirthDate] = useState(adopterUser?.birthDate || "");
  const [profession, setProfession] = useState(adopterUser?.profession || "");
  const [socialMedia, setSocialMedia] = useState(user.socialMedia || "");
  const [city, setCity] = useState(user.city || "");
  const [state, setState] = useState(user.state || "");
  const [housingType, setHousingType] = useState<HousingType>(adopterUser?.housingType || "casa");
  const [hasAdequateSpace, setHasAdequateSpace] = useState<boolean>(adopterUser?.hasAdequateSpace ?? false);
  const [hasOtherPets, setHasOtherPets] = useState<boolean>(adopterUser?.hasOtherPets ?? false);
  const [otherPetsDetails, setOtherPetsDetails] = useState(adopterUser?.otherPetsDetails || "");
  const [hasChildren, setHasChildren] = useState<boolean>(adopterUser?.hasChildren ?? false);
  const [speciesPreference, setSpeciesPreference] = useState<SpeciesPreference>(adopterUser?.speciesPreference || "both");
  const [sizePreference, setSizePreference] = useState<SizePreference>(adopterUser?.sizePreference || "any");
  const [bio, setBio] = useState(user.bio || "");

  // Form states - ONG / Protetor
  const [responsibleName, setResponsibleName] = useState(guardianUser?.responsibleName || "");
  const [neighborhood, setNeighborhood] = useState(guardianUser?.neighborhood || "");

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pré-visualização compactada no cliente; o arquivo original validado é enviado ao Storage ao salvar.
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Formato inválido", "Por favor, selecione um arquivo de imagem (JPEG, PNG ou WebP).", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Arquivo muito grande", "A foto de perfil deve ter no máximo 2 MB.", "error");
      return;
    }
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setAvatar(compressedDataUrl);
          showToast("Foto selecionada", "Clique em 'Salvar Alterações' para confirmar sua foto de perfil.", "info");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    const avatarAnterior = user.avatar;
    setAvatar(undefined);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    try {
      const salvou = await updateUserProfile({ avatar: null });
      if (!salvou) {
        setAvatar(avatarAnterior || undefined);
        return;
      }
      await removerAvatarPerfil(avatarAnterior);
    } catch (err) {
      console.error(err);
      showToast("Erro ao remover", "Não foi possível remover a foto de perfil.", "error");
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
      setPrimaryPhone(digits.length ? `(${digits}` : "");
    } else if (digits.length <= 6) {
      setPrimaryPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else if (digits.length <= 10) {
      setPrimaryPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`);
    } else {
      setPrimaryPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validateFullName(name, "Nome completo");
    if (!nameValidation.valid) {
      showToast("Campo obrigatório", nameValidation.error || "O nome completo não pode ficar em branco.", "error");
      return;
    }

    if (!isValidPhone(primaryPhone)) {
      showToast("Campo inválido", "WhatsApp / telefone de contato inválido. Informe o DDD e o número completo.", "error");
      return;
    }

    if (city.trim().length < 2) {
      showToast("Campo obrigatório", "Por favor, informe a cidade onde mora ou atua.", "error");
      return;
    }

    if (!BRAZILIAN_STATES.includes(state)) {
      showToast("Campo obrigatório", "Por favor, selecione o estado onde mora ou atua.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const avatarAnterior = user.avatar;
      const avatarRemoto = avatarFile ? await enviarAvatarPerfil(avatarFile) : avatar;
      let salvou = false;
      if (isAdopter) {
        const finalBirthDate = isBirthDateLocked ? (adopterUser?.birthDate || birthDate) : birthDate;
        salvou = await updateUserProfile({
          name: name.trim(),
          primaryPhone: primaryPhone.trim(),
          birthDate: finalBirthDate,
          profession: profession.trim(),
          socialMedia: socialMedia.trim(),
          avatar: avatarRemoto || null,
          city: city.trim(),
          state,
          housingType,
          hasAdequateSpace,
          hasOtherPets,
          otherPetsDetails: hasOtherPets ? otherPetsDetails.trim() : "",
          hasChildren,
          speciesPreference,
          sizePreference,
          bio: bio.trim()
        });
      } else {
        salvou = await updateUserProfile({
          name: name.trim(),
          primaryPhone: primaryPhone.trim(),
          avatar: avatarRemoto || null,
          city: city.trim(),
          state,
          neighborhood: neighborhood.trim(),
          responsibleName: responsibleName.trim(),
          bio: bio.trim(),
          socialMedia: socialMedia.trim()
        });
      }
      if (!salvou) {
        if (avatarFile && avatarRemoto) await removerAvatarPerfil(avatarRemoto);
        return;
      }
      if (avatarFile && avatarAnterior && avatarAnterior !== avatarRemoto) {
        await removerAvatarPerfil(avatarAnterior);
      }
      setAvatar(avatarRemoto || undefined);
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar", "Não foi possível salvar as alterações. Tente novamente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const age = birthDate ? calculateAge(birthDate) : null;

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-8">

        {/* Barra de Navegação Superior / Voltar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <Badge variant="outline" className="rounded-full px-3 py-1 font-semibold text-xs border-primary/30 text-primary bg-primary/5">
            {isAdopter ? "Perfil de Adotante" : "Perfil de ONG / Protetor"}
          </Badge>
        </div>

        {/* Cabeçalho do Perfil com Avatar e Identidade Visual */}
        <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            
            {/* Foto de Perfil com Ações de Upload / Remover */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden relative border-4 border-white dark:border-slate-800 shadow-md bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name || "Foto de perfil"}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-sky-700 dark:text-sky-300">
                    <User className="w-12 h-12" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider text-muted-foreground">Sem Foto</span>
                  </div>
                )}
              </div>

              {/* Botão de upload sobreposto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Alterar foto de perfil"
                className="absolute bottom-0 right-0 min-h-[44px] min-w-[44px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-card"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Informações Resumidas do Usuário */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {name || "Meu Perfil"}
                </h1>
                <span className="inline-flex items-center gap-1.5 self-center sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conta Ativa
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>

              {/* Botões rápidos de gestão de foto */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] rounded-full px-3 text-xs border-border/80"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  {avatar ? "Alterar foto" : "Escolher foto"}
                </Button>

                {avatar && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemovePhoto}
                    className="min-h-[44px] rounded-full px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Remover foto
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Formulário Principal de Edição */}
        <form onSubmit={handleSave} className="space-y-8">

          {/* ========================================================================= */}
          {/* SEÇÃO 1: DADOS PESSOAIS E DE CADASTRO                                    */}
          {/* ========================================================================= */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados Pessoais e de Cadastro
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mantenha suas informações básicas sempre atualizadas para facilitar o contato.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Nome Completo */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-bold text-foreground">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="rounded-xl border-border bg-background"
                />
              </div>

              {/* E-mail (somente leitura com cadeado) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>E-mail da Conta</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Identificador de login</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="rounded-xl border-border/60 bg-muted/50 text-muted-foreground cursor-not-allowed pl-9"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>WhatsApp / Celular *</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Para contato das ONGs</span>
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    maxLength={15}
                    value={primaryPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    className="rounded-xl border-border bg-background pl-9"
                  />
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Data de Nascimento (Adotante) */}
              {isAdopter && (
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Data de Nascimento</span>
                      {isBirthDateLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          <Lock className="w-3 h-3 text-amber-500" />
                          Definida no cadastro
                        </span>
                      )}
                    </span>
                    {age !== null && (
                      <span className="text-[11px] font-bold text-primary">
                        {age} anos {age >= 21 ? "• Apto para adotar" : "• Mínimo 21 anos"}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      disabled={isBirthDateLocked}
                      readOnly={isBirthDateLocked}
                      onChange={(e) => !isBirthDateLocked && setBirthDate(e.target.value)}
                      className={`min-h-[44px] rounded-xl border-border pl-9 ${
                        isBirthDateLocked
                          ? "bg-muted/60 dark:bg-muted/40 text-muted-foreground cursor-not-allowed opacity-85 select-none"
                          : "bg-background"
                      }`}
                    />
                    <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {isBirthDateLocked && (
                      <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                  {isBirthDateLocked ? (
                    <p className="text-[11px] text-muted-foreground">
                      A data de nascimento só pode ser definida uma única vez na criação da conta e não pode ser modificada por motivos de segurança e integridade do dossiê.
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Atenção: A data de nascimento só poderá ser informada uma única vez e será bloqueada para futuras alterações.
                    </p>
                  )}
                </div>
              )}

              {/* Profissão / Ocupação (Adotante) */}
              {isAdopter && (
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-xs font-bold text-foreground">
                    Profissão / Ocupação
                  </Label>
                  <div className="relative">
                    <Input
                      id="profession"
                      type="text"
                      maxLength={80}
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Engenheira, Designer, Professor..."
                      className="rounded-xl border-border bg-background pl-9"
                    />
                    <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Redes Sociais */}
              <div className={`space-y-2 ${isAdopter ? "sm:col-span-2" : ""}`}>
                <Label htmlFor="socialMedia" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Redes Sociais (Instagram, LinkedIn ou perfil público)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Opcional</span>
                </Label>
                <div className="relative">
                  <Input
                    id="socialMedia"
                    type="text"
                    maxLength={80}
                    value={socialMedia}
                    onChange={(e) => setSocialMedia(e.target.value)}
                    placeholder="Ex: @seu_usuario ou link do perfil"
                    className="rounded-xl border-border bg-background pl-9"
                  />
                  <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* CPF / Documento */}
              <div className="space-y-2">
                <Label htmlFor="doc" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{isAdopter ? "CPF do Tutor" : "Documento (CNPJ ou CPF)"}</span>
                  <span className="text-[10px] text-muted-foreground">Dado protegido por LGPD</span>
                </Label>
                <Input
                  id="doc"
                  type="text"
                  value={isAdopter ? adopterUser?.cpf || "" : guardianUser?.document || ""}
                  disabled
                  className="rounded-xl border-border/60 bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Se for ONG: Responsável */}
              {!isAdopter && (
                <div className="space-y-2">
                  <Label htmlFor="responsible" className="text-xs font-bold text-foreground">
                    Nome do Responsável
                  </Label>
                  <Input
                    id="responsible"
                    type="text"
                    maxLength={100}
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome da pessoa responsável pela entidade"
                    className="rounded-xl border-border bg-background"
                  />
                </div>
              )}

            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 2: PERFIL DE ADOÇÃO (CAMPOS RELEVANTES PARA O PROCESSO DE ADOÇÃO)  */}
          {/* ========================================================================= */}
          {isAdopter && (
            <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                    Perfil para Adoção Responsável
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                    Triagem & Compatibilidade
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Essas informações são avaliadas pelas ONGs e protetores durante suas candidaturas para acelerar o processo e garantir a segurança do pet.
                </p>
              </div>

              <div className="space-y-6">

                {/* 1. Localização (Cidade e Estado) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="city" className="text-xs font-bold text-foreground">
                      Cidade onde mora *
                    </Label>
                    <div className="relative">
                      <Input
                        id="city"
                        type="text"
                        maxLength={60}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo, Campinas, Curitiba..."
                        className="rounded-xl border-border bg-background pl-9"
                      />
                      <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-xs font-bold text-foreground">
                      Estado (UF) *
                    </Label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    >
                      <option value="" disabled>Selecione</option>
                      {BRAZILIAN_STATES.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Moradia e Espaço Adequado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/50">
                  
                  <div className="space-y-2">
                    <Label htmlFor="housingType" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-primary" /> Tipo de Moradia
                    </Label>
                    <select
                      id="housingType"
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value as HousingType)}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    >
                      <option value="casa">Casa com quintal</option>
                      <option value="apartamento">Apartamento com telas/rede</option>
                      <option value="sitio_chacara">Sítio / Chácara</option>
                      <option value="outro">Outro tipo de moradia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Espaço Adequado para o Animal
                    </Label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setHasAdequateSpace(true)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          hasAdequateSpace
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        ✓ Sim, espaço seguro
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasAdequateSpace(false)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          !hasAdequateSpace
                            ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Espaço compacto
                      </button>
                    </div>
                  </div>

                </div>

                {/* 3. Outros Animais e Crianças em Casa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/50">
                  
                  {/* Outros Animais */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Possui outros animais em casa?
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHasOtherPets(true)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          hasOtherPets
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Sim, possuo
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasOtherPets(false)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          !hasOtherPets
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Não possuo
                      </button>
                    </div>

                    {hasOtherPets && (
                      <Input
                        type="text"
                        maxLength={300}
                        value={otherPetsDetails}
                        onChange={(e) => setOtherPetsDetails(e.target.value)}
                        placeholder="Ex: 1 cão castrado e 1 gata de 4 anos"
                        className="rounded-xl border-border bg-background text-xs mt-2"
                      />
                    )}
                  </div>

                  {/* Crianças em Casa */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Possui crianças na residência?
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHasChildren(true)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          hasChildren
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Sim, há crianças
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasChildren(false)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          !hasChildren
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Apenas adultos
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ajuda a recomendar pets que se adaptam com facilidade à energia infantil.
                    </p>
                  </div>

                </div>

                {/* 4. Preferências de Adoção (Espécie e Porte) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/50">
                  
                  {/* Preferência por Espécie */}
                  <div className="space-y-2">
                    <Label htmlFor="speciesPref" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-sky-600" /> Preferência por Espécie
                    </Label>
                    <select
                      id="speciesPref"
                      value={speciesPreference}
                      onChange={(e) => setSpeciesPreference(e.target.value as SpeciesPreference)}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    >
                      <option value="both">Cachorro ou Gato (Ambos)</option>
                      <option value="dog">Somente Cachorro</option>
                      <option value="cat">Somente Gato</option>
                    </select>
                  </div>

                  {/* Preferência por Porte */}
                  <div className="space-y-2">
                    <Label htmlFor="sizePref" className="text-xs font-bold text-foreground">
                      Preferência de Porte do Animal
                    </Label>
                    <select
                      id="sizePref"
                      value={sizePreference}
                      onChange={(e) => setSizePreference(e.target.value as SizePreference)}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    >
                      <option value="any">Qualquer porte / Sem preferência</option>
                      <option value="small">Porte Pequeno (até 10kg)</option>
                      <option value="medium">Porte Médio (10kg a 25kg)</option>
                      <option value="large">Porte Grande (acima de 25kg)</option>
                    </select>
                  </div>

                </div>

                {/* 5. Breve Apresentação do Adotante */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> Breve Apresentação sobre Você
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {bio.length}/500 caracteres
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Conte um pouco sobre sua rotina, tempo disponível, experiência prévia com pets e por que você deseja adotar. Essa mensagem cria uma conexão calorosa com os protetores."
                    className="rounded-2xl border-border bg-background text-xs sm:text-sm leading-relaxed"
                  />
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 2 (ONG): DADOS INSTITUCIONAIS DA ONG / PROTETOR                    */}
          {/* ========================================================================= */}
          {!isAdopter && (
            <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Dados da Instituição e Localização
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informações públicas exibidas nos cards dos animais sob tutela da ONG.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="city" className="text-xs font-bold text-foreground">Cidade sede</Label>
                  <Input
                    id="city"
                    type="text"
                    maxLength={60}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl border-border bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs font-bold text-foreground">Estado (UF)</Label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs text-foreground cursor-pointer"
                  >
                    <option value="" disabled>Selecione</option>
                    {BRAZILIAN_STATES.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-2">
                  <Label htmlFor="neighborhood" className="text-xs font-bold text-foreground">Bairro</Label>
                  <Input
                    id="neighborhood"
                    type="text"
                    maxLength={60}
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="rounded-xl border-border bg-background min-h-[44px]"
                  />
                </div>

                <div className="sm:col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desc" className="text-xs font-bold text-foreground">Apresentação / Missão da ONG</Label>
                    <span className="text-[11px] text-muted-foreground">{bio.length}/500 caracteres</span>
                  </div>
                  <Textarea
                    id="desc"
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Conte sobre a missão da ONG, anos de atuação e histórico de resgates..."
                    className="rounded-2xl border-border bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(isAdopter ? "/pets" : "/dashboard")}
              className="w-full sm:w-auto rounded-full px-6 min-h-[44px]"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}

export function ProfileView() {
  const { currentUser, authLoading } = useApp();

  if (authLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando perfil" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center shadow-inner">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Acesse sua conta para ver o perfil
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Faça login ou crie uma conta para visualizar e editar suas informações pessoais e dados de adoção.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 min-h-[44px]">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto rounded-full px-8 min-h-[44px]">
            <Link href="/cadastro">Criar Conta</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ProfileForm key={currentUser.id} user={currentUser} />;
}
