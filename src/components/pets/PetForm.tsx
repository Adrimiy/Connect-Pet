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

const FOTO_PADRAO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop";

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
  const [approximateAge, setApproximateAge] = useState(initialData?.approximateAge || "1 ano");
  const [sex, setSex] = useState<"male" | "female">(initialData?.sex || "male");
  const [story, setStory] = useState(initialData?.story || "");
  const [headline, setHeadline] = useState(initialData?.headline || "");
  const [temperament, setTemperament] = useState(initialData?.temperament?.join(", ") || "Dócil, Brincalhão");
  const [vaccinated, setVaccinated] = useState(initialData ? initialData.vaccinated : true);
  const [castrated, setCastrated] = useState(initialData ? initialData.castrated : true);
  const [fotos, setFotos] = useState<FotoPet[]>(() => fotosRemotasIniciais(initialData?.photos));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroFotos, setErroFotos] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const temperamentArray = temperament.split(",").map((t) => t.trim()).filter(Boolean);

    setErroFotos(null);
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
      updatePet(initialData.id, {
        name,
        species,
        breed,
        size,
        approximateAge,
        sex,
        story,
        headline,
        temperament: temperamentArray,
        vaccinated,
        castrated,
        photos: photos.length > 0 ? photos : [FOTO_PADRAO]
      });
    } else {
      addPet({
        name,
        species,
        breed,
        size,
        approximateAge,
        ageCategory: "young",
        sex,
        status: "available",
        vaccinated,
        castrated,
        dewormed: true,
        vaccinationDetails: "Vacinas essenciais em dia.",
        specialNeeds: "",
        photos: photos.length > 0 ? photos : [FOTO_PADRAO],
        headline: headline || "Pronto para alegrar seu lar.",
        story: story || "Resgatado com muito carinho, pronto para ser adotado com amor.",
        temperament: temperamentArray.length > 0 ? temperamentArray : ["Dócil"],
        temperamentDescription: "Amoroso e companheiro para todas as horas.",
        guardianId: currentUser?.id || "guardian-1",
        guardianName: currentUser?.name || "ONG / Protetor",
        guardianType: currentUser?.role === "guardian" ? currentUser.guardianType : "ngo",
        guardianPhone: currentUser?.primaryPhone || "(11) 97123-9988",
        guardianEmail: currentUser?.email || "contato@patinhascomamor.org.br",
        location: {
          city: currentUser?.role === "guardian" ? currentUser.city : "São Paulo",
          state: currentUser?.role === "guardian" ? currentUser.state : "SP",
          neighborhood: currentUser?.role === "guardian" ? currentUser.neighborhood : "Centro"
        }
      });
    }

    router.push("/dashboard");
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Raça *</Label>
              <Input required maxLength={50} value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Espécie</Label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as "dog" | "cat")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Idade Aproximada</Label>
            <Input maxLength={30} value={approximateAge} onChange={(e) => setApproximateAge(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Frase de Destaque</Label>
            <Input maxLength={120} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label>História de Resgate</Label>
              <span className="text-[10px] text-muted-foreground">{story.length}/1000</span>
            </div>
            <Textarea rows={3} maxLength={1000} value={story} onChange={(e) => setStory(e.target.value.slice(0, 1000))} />
          </div>

          <div className="space-y-1">
            <Label>Temperamento (separado por vírgula)</Label>
            <Input maxLength={150} value={temperament} onChange={(e) => setTemperament(e.target.value)} />
          </div>

          <div className="flex gap-6 p-4 rounded-xl bg-secondary/50">
            <label htmlFor="vac" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                id="vac"
                type="checkbox"
                checked={vaccinated}
                onChange={(e) => setVaccinated(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              Vacinado
            </label>
            <label htmlFor="cast" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                id="cast"
                type="checkbox"
                checked={castrated}
                onChange={(e) => setCastrated(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              Castrado
            </label>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" type="button" disabled={isSubmitting} className="min-h-[44px]" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
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
