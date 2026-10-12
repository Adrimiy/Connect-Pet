"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pet } from "@/types";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { PetPhotoUploader } from "@/components/pets/PetPhotoUploader";
import { FotoPet, enviarFotosPet, fotosRemotasIniciais } from "@/lib/petPhotos";

const FOTO_PADRAO = "/images/pet-placeholder.svg";

interface PetFormProps {
  initialData?: Pet;
  isEditing?: boolean;
}

export function PetForm({ initialData, isEditing = false }: PetFormProps) {
  const router = useRouter();
  const { addPet, updatePet, currentUser } = useApp();

  const [name, setName] = useState(initialData?.name || "");
  const [species, setSpecies] = useState<"dog" | "cat">(initialData?.species || "dog");
  const [breed, setBreed] = useState(initialData?.breed || "Vira-lata (SRD)");
  const [size, setSize] = useState<"small" | "medium" | "large">(initialData?.size || "medium");
  const [approximateAge, setApproximateAge] = useState(initialData?.approximateAge || "");
  const [sex, setSex] = useState<"male" | "female">(initialData?.sex || "male");
  const [status, setStatus] = useState(initialData?.status || "available");
  const [ageCategory, setAgeCategory] = useState(initialData?.ageCategory || "young");
  const [energyLevel, setEnergyLevel] = useState<Pet["energyLevel"]>(initialData?.energyLevel || "moderate");
  const [compatibleWithChildren, setCompatibleWithChildren] = useState<Pet["compatibleWithChildren"]>(initialData?.compatibleWithChildren || "unknown");
  const [compatibleWithDogs, setCompatibleWithDogs] = useState<Pet["compatibleWithDogs"]>(initialData?.compatibleWithDogs || "unknown");
  const [compatibleWithCats, setCompatibleWithCats] = useState<Pet["compatibleWithCats"]>(initialData?.compatibleWithCats || "unknown");
  const [story, setStory] = useState(initialData?.story || "");
  const [headline, setHeadline] = useState(initialData?.headline || "");
  const [temperament, setTemperament] = useState(initialData?.temperament?.join(", ") || "");
  const [temperamentDescription, setTemperamentDescription] = useState(initialData?.temperamentDescription || "");
  const [vaccinated, setVaccinated] = useState(initialData ? initialData.vaccinated : false);
  const [castrated, setCastrated] = useState(initialData ? initialData.castrated : false);
  const [dewormed, setDewormed] = useState(initialData ? initialData.dewormed : false);
  const [vaccinationDetails, setVaccinationDetails] = useState(initialData?.vaccinationDetails || "");
  const [specialNeeds, setSpecialNeeds] = useState(initialData?.specialNeeds || "");
  const [fotos, setFotos] = useState<FotoPet[]>(() => fotosRemotasIniciais(initialData?.photos));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroFotos, setErroFotos] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const guardiaoAtual = currentUser?.role === "guardian" ? currentUser : null;

    const temperamentArray = temperament.split(",").map((t) => t.trim()).filter(Boolean);

    if (!name.trim() || !breed.trim() || !approximateAge.trim() || !headline.trim() || !story.trim() || !temperamentDescription.trim()) {
      setErroFormulario("Preencha os campos obrigatórios antes de salvar.");
      return;
    }

    if (!isEditing && !guardiaoAtual) {
      setErroFormulario("Entre com um perfil de ONG ou doador para cadastrar um animal.");
      return;
    }

    if (!isEditing && (!guardiaoAtual?.city?.trim() || !guardiaoAtual.state?.trim())) {
      setErroFormulario("Complete a cidade e o estado no seu perfil antes de publicar um animal.");
      return;
    }

    setErroFotos(null);
    setErroFormulario(null);
    setIsSubmitting(true);
    let photos: string[];
    try {
      photos = await enviarFotosPet(fotos, setFotos);
    } catch (err) {
      setErroFotos(err instanceof Error ? err.message : "Não foi possível enviar as fotos.");
      setIsSubmitting(false);
      return;
    }

    if (isEditing && initialData) {
      const salvou = await updatePet(initialData.id, {
        name: name.trim(),
        species,
        breed: breed.trim(),
        size,
        approximateAge: approximateAge.trim(),
        ageCategory,
        energyLevel,
        compatibleWithChildren,
        compatibleWithDogs,
        compatibleWithCats,
        sex,
        status,
        story: story.trim(),
        headline: headline.trim(),
        temperament: temperamentArray,
        temperamentDescription: temperamentDescription.trim(),
        vaccinated,
        castrated,
        dewormed,
        vaccinationDetails,
        specialNeeds,
        photos: photos.length > 0 ? photos : [FOTO_PADRAO]
      });
      if (!salvou) {
        setErroFormulario("Não foi possível salvar as alterações. Confira os dados e tente novamente.");
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!guardiaoAtual) {
        setErroFormulario("Entre com um perfil de ONG ou doador para cadastrar um animal.");
        setIsSubmitting(false);
        return;
      }

      const salvou = await addPet({
        name: name.trim(),
        species,
        breed: breed.trim(),
        size,
        approximateAge: approximateAge.trim(),
        ageCategory,
        energyLevel,
        compatibleWithChildren,
        compatibleWithDogs,
        compatibleWithCats,
        sex,
        status: "available",
        vaccinated,
        castrated,
        dewormed,
        vaccinationDetails: vaccinationDetails.trim(),
        specialNeeds: specialNeeds.trim(),
        photos: photos.length > 0 ? photos : [FOTO_PADRAO],
        headline: headline.trim(),
        story: story.trim(),
        temperament: temperamentArray,
        temperamentDescription: temperamentDescription.trim(),
        guardianId: guardiaoAtual.id,
        guardianName: guardiaoAtual.name,
        guardianType: guardiaoAtual.guardianType,
        guardianPhone: guardiaoAtual.primaryPhone,
        guardianEmail: guardiaoAtual.email,
        location: {
          city: guardiaoAtual.city || "",
          state: guardiaoAtual.state || "",
          neighborhood: guardiaoAtual.neighborhood || ""
        }
      });
      if (!salvou) {
        setErroFormulario("Não foi possível publicar o animal. Confira os dados e tente novamente.");
        setIsSubmitting(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Animal" : "Informações do Animal"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Fotos */}
          <div className="space-y-2">
            <Label>Fotos do Animal</Label>
            <PetPhotoUploader fotos={fotos} onChange={setFotos} disabled={isSubmitting} />
            {erroFotos && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{erroFotos}</span>
              </div>
            )}
          </div>

          {erroFormulario && (
            <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{erroFormulario}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Raça *</Label>
              <Input required maxLength={50} value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Espécie</Label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as "dog" | "cat")}
                className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="dog">Cão</option>
                <option value="cat">Gato</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Porte</Label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as "small" | "medium" | "large")}
                className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as "male" | "female")}
                className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Faixa etária</Label>
              <select value={ageCategory} onChange={(e) => setAgeCategory(e.target.value as typeof ageCategory)} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="puppy">Filhote</option>
                <option value="young">Jovem</option>
                <option value="adult">Adulto</option>
                <option value="senior">Idoso</option>
              </select>
            </div>
            {isEditing && (
              <div className="space-y-1">
                <Label>Status da adoção</Label>
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="available">Disponível</option>
                  <option value="in_process">Em processo</option>
                  <option value="adopted">Adotado</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Idade Aproximada *</Label>
            <Input required maxLength={30} value={approximateAge} onChange={(e) => setApproximateAge(e.target.value)} />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Perfil para recomendações</h3>
              <p className="mt-1 text-xs text-muted-foreground">Informe somente comportamentos já observados. Quando não souber, mantenha “Ainda não avaliado”.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Nível de energia</Label>
                <select value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value as Pet["energyLevel"])} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="calm">Calmo</option>
                  <option value="moderate">Moderado</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Convivência com crianças</Label>
                <select value={compatibleWithChildren} onChange={(e) => setCompatibleWithChildren(e.target.value as Pet["compatibleWithChildren"])} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unknown">Ainda não avaliado</option><option value="yes">Convive bem</option><option value="no">Não é recomendado</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Convivência com cães</Label>
                <select value={compatibleWithDogs} onChange={(e) => setCompatibleWithDogs(e.target.value as Pet["compatibleWithDogs"])} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unknown">Ainda não avaliado</option><option value="yes">Convive bem</option><option value="no">Não é recomendado</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Convivência com gatos</Label>
                <select value={compatibleWithCats} onChange={(e) => setCompatibleWithCats(e.target.value as Pet["compatibleWithCats"])} className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unknown">Ainda não avaliado</option><option value="yes">Convive bem</option><option value="no">Não é recomendado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Frase de Destaque *</Label>
            <Input required maxLength={120} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label>História de Resgate *</Label>
              <span className="text-[10px] text-muted-foreground">{story.length}/1000</span>
            </div>
            <Textarea required rows={3} maxLength={1000} value={story} onChange={(e) => setStory(e.target.value.slice(0, 1000))} />
          </div>

          <div className="space-y-1">
            <Label>Temperamento (separado por vírgula)</Label>
            <Input maxLength={150} value={temperament} onChange={(e) => setTemperament(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Descrição de comportamento e convivência *</Label>
            <Textarea
              required
              rows={3}
              maxLength={500}
              value={temperamentDescription}
              onChange={(e) => setTemperamentDescription(e.target.value.slice(0, 500))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Detalhes da vacinação</Label>
              <Input maxLength={200} value={vaccinationDetails} onChange={(e) => setVaccinationDetails(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Necessidades especiais</Label>
              <Input maxLength={200} value={specialNeeds} onChange={(e) => setSpecialNeeds(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-xl bg-secondary/50 p-4 sm:grid-cols-3">
            <label htmlFor="vac" className="flex min-h-[44px] items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                id="vac"
                type="checkbox"
                checked={vaccinated}
                onChange={(e) => setVaccinated(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              Vacinado
            </label>
            <label htmlFor="cast" className="flex min-h-[44px] items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                id="cast"
                type="checkbox"
                checked={castrated}
                onChange={(e) => setCastrated(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              Castrado
            </label>
            <label htmlFor="verm" className="flex min-h-[44px] items-center gap-2 text-sm font-medium cursor-pointer">
              <input id="verm" type="checkbox" checked={dewormed} onChange={(e) => setDewormed(e.target.checked)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              Vermifugado
            </label>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" type="button" disabled={isSubmitting} className="min-h-[44px] w-full sm:w-auto" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-h-[44px] w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
              </>
            ) : isEditing ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Pet"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
