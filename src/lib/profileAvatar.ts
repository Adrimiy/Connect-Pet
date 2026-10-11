import { createClient } from "@/lib/client";
import { validarFotoPet } from "@/lib/petPhotos";

export const BUCKET_AVATARES = "avatars";
const TAMANHO_MAXIMO_AVATAR = 2 * 1024 * 1024;

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function caminhoDoAvatar(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET_AVATARES}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  try {
    return decodeURIComponent(url.slice(indice + marcador.length).split("?")[0]) || null;
  } catch {
    return null;
  }
}

export async function enviarAvatarPerfil(arquivo: File): Promise<string> {
  if (arquivo.size > TAMANHO_MAXIMO_AVATAR) {
    throw new Error("A foto de perfil deve ter no máximo 2 MB.");
  }

  const erroValidacao = await validarFotoPet(arquivo);
  if (erroValidacao) throw new Error(erroValidacao);

  const extensao = EXTENSAO_POR_TIPO[arquivo.type];
  if (!extensao) throw new Error("Use uma imagem JPG, PNG ou WebP.");

  const supabase = createClient();
  const { data: usuario, error: erroUsuario } = await supabase.auth.getUser();
  if (erroUsuario || !usuario.user) throw new Error("Sua sessão expirou. Entre novamente.");

  const identificador = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const caminho = `${usuario.user.id}/${identificador}.${extensao}`;
  const { error } = await supabase.storage.from(BUCKET_AVATARES).upload(caminho, arquivo, {
    contentType: arquivo.type,
    cacheControl: "31536000",
    upsert: false
  });

  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  return supabase.storage.from(BUCKET_AVATARES).getPublicUrl(caminho).data.publicUrl;
}

export async function removerAvatarPerfil(url?: string | null): Promise<void> {
  if (!url) return;
  const caminho = caminhoDoAvatar(url);
  if (!caminho) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET_AVATARES).remove([caminho]);
  if (error) console.warn("Não foi possível remover o avatar anterior:", error.message);
}
