// Exercita o contrato HTTP da Edge Function sem transmitir dados para serviços externos.
import test from "node:test";
import assert from "node:assert/strict";

type Manipulador = (requisicao: Request) => Response | Promise<Response>;

let manipulador: Manipulador | null = null;
const segredos: Record<string, string> = {
  SUPABASE_URL: "https://projeto.supabase.co",
  SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_teste" }),
  SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_teste" }),
  GROQ_API_KEY: "gsk_teste",
  GROQ_MODEL: "openai/gpt-oss-20b",
};

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: { get: (nome: string) => segredos[nome] },
  serve: (funcao: Manipulador) => { manipulador = funcao; },
};

await import("../supabase/functions/analisar-compatibilidade/index.ts");

function executar(corpo: Record<string, unknown>) {
  assert.ok(manipulador, "A Edge Function deve registrar o manipulador HTTP.");
  return manipulador(new Request("https://projeto.supabase.co/functions/v1/analisar-compatibilidade", {
    method: "POST",
    headers: { Authorization: "Bearer jwt_usuario", "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  }));
}

const questionario = {
  preferredSpecies: "cat",
  preferredSize: "small",
  preferredAge: "adult",
  preferredEnergy: "calm",
  hasChildren: false,
  residentPets: "none",
  acceptsSpecialNeeds: true,
};

test("Smart Match usa pets canônicos e chama o Groq com saída estruturada", async () => {
  const petId = "00000000-0000-4000-8000-000000000001";
  let corpoGroq = "";
  globalThis.fetch = async (entrada, inicializacao) => {
    const url = String(entrada);
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: "00000000-0000-4000-8000-000000000010" });
    if (url.includes("/rest/v1/pets?")) return Response.json([{
      id: petId,
      name: "Luna",
      species: "cat",
      size: "small",
      age_category: "adult",
      energy_level: "calm",
      compatible_with_children: "unknown",
      compatible_with_dogs: "unknown",
      compatible_with_cats: "unknown",
      temperament: ["calma"],
      special_needs: null,
      status: "available",
    }]);
    if (url.endsWith("/rest/v1/rpc/consumir_cota_ia")) return Response.json(true);
    if (url === "https://api.groq.com/openai/v1/chat/completions") {
      corpoGroq = String(inicializacao?.body || "");
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        recomendacoes: [{ petId, resumo: "Perfil compatível para conversa.", motivos: ["Rotina tranquila."], cuidados: ["Adaptação gradual."] }],
      }) } }] });
    }
    throw new Error(`URL não simulada: ${url}`);
  };

  const resposta = await executar({ tipo: "smart_match", questionario, petIds: [petId] });
  const dados = await resposta.json() as { recomendacoes?: unknown[] };

  assert.equal(resposta.status, 200);
  assert.equal(dados.recomendacoes?.length, 1);
  assert.match(corpoGroq, /json_schema/);
  assert.match(corpoGroq, /reasoning_effort/);
});

test("questionário incompleto é rejeitado antes de consumir IA", async () => {
  let quantidadeChamadas = 0;
  globalThis.fetch = async (entrada) => {
    quantidadeChamadas += 1;
    if (String(entrada).endsWith("/auth/v1/user")) return Response.json({ id: "00000000-0000-4000-8000-000000000010" });
    throw new Error("Nenhuma outra chamada deveria ocorrer.");
  };

  const resposta = await executar({
    tipo: "smart_match",
    questionario: { preferredSpecies: "cat" },
    petIds: ["00000000-0000-4000-8000-000000000001"],
  });

  assert.equal(resposta.status, 400);
  assert.equal(quantidadeChamadas, 1);
});

test("análise de candidatura persiste somente com a chave secreta", async () => {
  const candidaturaId = "00000000-0000-4000-8000-000000000020";
  let cabecalhoPatch: Headers | null = null;
  let corpoGroq = "";
  globalThis.fetch = async (entrada, inicializacao) => {
    const url = String(entrada);
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: "00000000-0000-4000-8000-000000000010" });
    if (url.includes("/rest/v1/profiles?")) return Response.json([{ id: "00000000-0000-4000-8000-000000000010" }]);
    if (url.includes("/rest/v1/applications?") && inicializacao?.method !== "PATCH") return Response.json([{
      id: candidaturaId,
      pet_id: "00000000-0000-4000-8000-000000000001",
      guardian_id: "00000000-0000-4000-8000-000000000010",
      candidate: { birthDate: "1990-01-01" },
      housing: { housingType: "apartamento", housingStatus: "alugado", landlordPermission: true, hasProtection: true, protectionDetails: "RG 12.345.678-9" },
      routine: { familyAgreement: true, allergyCases: false, hoursAlone: 4, travelCarePlan: "Pessoa de confiança cuidará durante viagens.", hasCurrentPets: false, previousPetsHistory: "Experiência contínua com cuidados veterinários." },
      finance: { costAwareness: true },
    }]);
    if (url.includes("/rest/v1/pets?")) return Response.json([{
      id: "00000000-0000-4000-8000-000000000001",
      name: "Luna",
      species: "cat",
      size: "small",
      age_category: "adult",
      energy_level: "calm",
      compatible_with_children: "unknown",
      compatible_with_dogs: "unknown",
      compatible_with_cats: "unknown",
      temperament: ["calma"],
      special_needs: null,
      temperament_description: "Tranquila",
    }]);
    if (url.endsWith("/rest/v1/rpc/consumir_cota_ia")) return Response.json(true);
    if (url === "https://api.groq.com/openai/v1/chat/completions") {
      corpoGroq = String(inicializacao?.body || "");
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        resumo: "Há fatores favoráveis e pontos a confirmar.",
        justificativa: "A entrevista deve validar as respostas declaradas.",
        perguntasSugeridas: ["Como será feita a adaptação inicial?"],
      }) } }] });
    }
    if (url.includes("/rest/v1/applications?") && inicializacao?.method === "PATCH") {
      cabecalhoPatch = new Headers(inicializacao.headers);
      return Response.json([{ automated_analysis: { origem: "ia" } }]);
    }
    throw new Error(`URL não simulada: ${url}`);
  };

  const resposta = await executar({ tipo: "candidatura", candidaturaId });
  const cabecalhosPersistencia = cabecalhoPatch as Headers | null;

  assert.equal(resposta.status, 200);
  assert.ok(cabecalhosPersistencia, "A análise deve ser persistida pelo servidor.");
  assert.equal(cabecalhosPersistencia.get("apikey"), "sb_secret_teste");
  assert.equal(cabecalhosPersistencia.has("Authorization"), false);
  assert.equal(corpoGroq.includes("12.345.678-9"), false);
});
