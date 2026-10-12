// Valida o motor determinístico compartilhado pelo site e pela Edge Function.
import test from "node:test";
import assert from "node:assert/strict";
import {
  avaliarCandidaturaDeterministica,
  calcularCompatibilidadeDeterministica,
  type PetParaAvaliacao,
  type QuestionarioCompatibilidade,
} from "../supabase/functions/_shared/avaliacao.ts";

const petAtivo: PetParaAvaliacao = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Teste",
  species: "dog",
  size: "medium",
  ageCategory: "young",
  energyLevel: "high",
  compatibleWithChildren: "yes",
  compatibleWithDogs: "yes",
  compatibleWithCats: "unknown",
  temperament: ["ativo", "sociável"],
};

const questionarioPreparado: QuestionarioCompatibilidade = {
  preferredSpecies: "dog",
  preferredSize: "medium",
  preferredAge: "young",
  preferredEnergy: "high",
  hasChildren: true,
  residentPets: "dog",
  acceptsSpecialNeeds: true,
};

test("Smart Match é determinístico e permanece dentro da escala", () => {
  const primeira = calcularCompatibilidadeDeterministica(questionarioPreparado, petAtivo);
  const segunda = calcularCompatibilidadeDeterministica(questionarioPreparado, petAtivo);

  assert.deepEqual(primeira, segunda);
  assert.ok(primeira.score >= 20 && primeira.score <= 99);
});

test("convivência não avaliada não é interpretada como compatibilidade positiva", () => {
  const resultado = calcularCompatibilidadeDeterministica(
    questionarioPreparado,
    { ...petAtivo, compatibleWithDogs: "unknown" },
  );

  assert.equal(resultado.matchedReasons.some((motivo) => motivo.includes("convivência observada com cães")), false);
  assert.equal(resultado.adaptationTips.some((cuidado) => cuidado.includes("ainda não foi avaliada")), true);
});

test("incompatibilidade observada com animais residentes reduz a recomendação", () => {
  const resultado = calcularCompatibilidadeDeterministica(
    questionarioPreparado,
    { ...petAtivo, compatibleWithDogs: "no" },
  );

  assert.equal(resultado.adaptationTips.some((cuidado) => cuidado.includes("não é recomendada")), true);
  assert.ok(resultado.score >= 20);
});

test("fatores da candidatura reconciliam exatamente com a nota exibida", () => {
  const analise = avaliarCandidaturaDeterministica({
    candidate: { birthDate: "1990-01-01" },
    housingType: "apartamento",
    housingStatus: "alugado",
    landlordPermission: true,
    hasProtection: true,
    familyAgreement: true,
    allergyCases: false,
    hoursAlone: 3,
    dailyCarePlan: "A família dividirá alimentação, passeios e consultas veterinárias.",
    travelCarePlan: "Uma pessoa de confiança cuidará do animal durante viagens.",
    hasCurrentPets: false,
    previousPetsHistory: "Já cuidei de animais durante vários anos com acompanhamento veterinário.",
    costAwareness: true,
  }, petAtivo);

  const soma = analise.fatores.reduce((total, fator) => total + fator.impacto, 0);
  assert.equal(soma, analise.suitabilityScore);
  assert.ok(analise.suitabilityScore >= 0 && analise.suitabilityScore <= 100);
});
