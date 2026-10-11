import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";

/** Nome do bucket no Supabase Storage (deve ser igual ao criado em supabase/schema.sql). */
export const BUCKET_FOTOS_PETS = "pet-photos";
/** Limite de fotos por animal. */
export const MAX_FOTOS_PET = 6;
/** Tamanho máximo por foto (deve ser igual ao file_size_limit do bucket). */
export const TAMANHO_MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

type TipoFoto = (typeof TIPOS_FOTO_ACEITOS)[number];

const EXTENSAO_POR_TIPO: Record<TipoFoto, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

/** Foto já salva (URL antiga ou do Storage) ou arquivo local ainda não enviado. */
export type FotoPet =
  | { id: string; tipo: "remota"; url: string }
  | {
      id: string;
      tipo: "local";
      arquivo: File;
      previewUrl: string;
      status: "pendente" | "enviando" | "erro";
      mensagemErro?: string;
    };

export function novoIdFoto(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `foto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fotosRemotasIniciais(urls: string[] = []): FotoPet[] {
  return urls.map((url) => ({ id: novoIdFoto(), tipo: "remota", url }));
}

/** Detecta o tipo real da imagem lendo os primeiros bytes (não confia só na extensão). */
async function detectarTipoReal(arquivo: File): Promise<TipoFoto | null> {
  const bytes = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

/** Retorna a mensagem de erro em português, ou null se o arquivo for válido. */
export async function validarFotoPet(arquivo: File): Promise<string | null> {
  if (arquivo.size === 0) return `"${arquivo.name}" está vazio.`;
  if (arquivo.size > TAMANHO_MAX_FOTO_BYTES) {
    return `"${arquivo.name}" tem mais de ${TAMANHO_MAX_FOTO_BYTES / 1024 / 1024} MB.`;
  }
  const tipoDeclarado = arquivo.type as TipoFoto;
  if (!TIPOS_FOTO_ACEITOS.includes(tipoDeclarado)) {
    return `"${arquivo.name}" não é suportado. Use JPG, PNG ou WebP.`;
  }
  const tipoReal = await detectarTipoReal(arquivo);
  if (!tipoReal) return `"${arquivo.name}" não parece ser uma imagem válida (JPG, PNG ou WebP).`;
  return null;
}

/** Extrai o caminho no bucket a partir da URL pública; null se a URL não for do nosso bucket (ex.: URLs antigas). */
export function caminhoNoStorage(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET_FOTOS_PETS}/`;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (base && !url.startsWith(base)) return null;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  const caminho = url.slice(indice + marcador.length).split("?")[0];
  try {
    return decodeURIComponent(caminho) || null;
  } catch {
    return null;
  }
}

/** Remove do Storage as fotos que pertencem ao bucket. URLs antigas são ignoradas. */
export async function removerFotosDoStorage(supabase: SupabaseClient, urls: string[]): Promise<void> {
  const caminhos = urls.map(caminhoNoStorage).filter((c): c is string => !!c);
  if (caminhos.length === 0) return;
  try {
    const { error } = await supabase.storage.from(BUCKET_FOTOS_PETS).remove(caminhos);
    if (error) console.warn("Falha ao remover fotos do Storage:", error.message);
  } catch (err) {
    console.warn("Erro ao remover fotos do Storage:", err);
  }
}

type AtualizarFotos = (atualizador: (anteriores: FotoPet[]) => FotoPet[]) => void;

/**
 * Envia as fotos locais ao Supabase Storage e devolve a lista final de URLs (na ordem exibida).
 * Se qualquer envio falhar, os arquivos já enviados nesta chamada são removidos (sem órfãos).
 */
export async function enviarFotosPet(fotos: FotoPet[], atualizar: AtualizarFotos): Promise<string[]> {
  const locais = fotos.filter((f) => f.tipo === "local");
  if (locais.length === 0) {
    return fotos.flatMap((f) => (f.tipo === "remota" ? [f.url] : []));
  }

  const supabase = createClient();
  const { data, error: erroValidacao } = await supabase.auth.getUser();
  if (erroValidacao || !data.user) {
    throw new Error(
      erroValidacao
        ? `Não foi possível validar sua sessão: ${erroValidacao.message}`
        : "Não foi possível validar sua sessão. Entre novamente e tente enviar as fotos."
    );
  }
  const userId = data.user.id;

  const definirStatus = (id: string, status: "pendente" | "enviando" | "erro", mensagemErro?: string) =>
    atualizar((anteriores) =>
      anteriores.map((f) => (f.id === id && f.tipo === "local" ? { ...f, status, mensagemErro } : f))
    );

  const enviados: string[] = [];
  const urlPorId = new Map<string, string>();

  try {
    for (const foto of locais) {
      if (foto.tipo !== "local") continue;
      definirStatus(foto.id, "enviando");

      const tipoReal = await detectarTipoReal(foto.arquivo);
      if (!tipoReal) throw Object.assign(new Error("Arquivo de imagem inválido."), { fotoId: foto.id });

      const caminho = `${userId}/${novoIdFoto()}.${EXTENSAO_POR_TIPO[tipoReal]}`;
      const { error } = await supabase.storage.from(BUCKET_FOTOS_PETS).upload(caminho, foto.arquivo, {
        contentType: tipoReal,
        cacheControl: "31536000",
        upsert: false
      });
      if (error) {
        const mensagem = /bucket not found/i.test(error.message)
          ? "O armazenamento de fotos ainda não foi configurado (bucket 'pet-photos' não encontrado)."
          : /row-level security|not authorized|unauthorized/i.test(error.message)
            ? "Sem permissão para enviar fotos. Verifique se está conectado com sua conta."
            : `Não foi possível enviar "${foto.arquivo.name}": ${error.message}`;
        throw Object.assign(new Error(mensagem), { fotoId: foto.id });
      }

      enviados.push(caminho);
      urlPorId.set(foto.id, supabase.storage.from(BUCKET_FOTOS_PETS).getPublicUrl(caminho).data.publicUrl);
    }
  } catch (err) {
    if (enviados.length > 0) {
      await supabase.storage.from(BUCKET_FOTOS_PETS).remove(enviados);
    }
    const fotoId = (err as { fotoId?: string }).fotoId;
    const mensagem = err instanceof Error ? err.message : "Falha ao enviar as fotos.";
    atualizar((anteriores) =>
      anteriores.map((f) =>
        f.tipo === "local"
          ? f.id === fotoId
            ? { ...f, status: "erro", mensagemErro: mensagem }
            : { ...f, status: "pendente", mensagemErro: undefined }
          : f
      )
    );
    throw new Error(mensagem);
  }

  return fotos.map((f) => (f.tipo === "remota" ? f.url : (urlPorId.get(f.id) as string)));
}
