export const IMAGEM_PADRAO_PET = "/images/pet-placeholder.svg";

const HOSTS_EXTERNOS_FIXOS = new Set(["images.unsplash.com"]);

function obterHostnameSupabase(): string | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
}

/**
 * Aceita somente caminhos locais ou URLs HTTPS dos hosts configurados no Next.
 * URLs legadas de terceiros são descartadas para não interromper o next/image.
 */
export function obterUrlImagemPermitida(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const url = valor.trim();
  if (!url || url.startsWith("//")) return null;
  if (url.startsWith("/")) return url;

  try {
    const urlExterna = new URL(url);
    if (urlExterna.protocol !== "https:") return null;

    const hostnameSupabase = obterHostnameSupabase();
    const hostnamePermitido =
      HOSTS_EXTERNOS_FIXOS.has(urlExterna.hostname) ||
      (hostnameSupabase !== null && urlExterna.hostname === hostnameSupabase);

    return hostnamePermitido ? url : null;
  } catch {
    return null;
  }
}

export function normalizarFotosPet(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [IMAGEM_PADRAO_PET];

  const fotosPermitidas = valor
    .map(obterUrlImagemPermitida)
    .filter((url): url is string => url !== null);

  return fotosPermitidas.length > 0 ? fotosPermitidas : [IMAGEM_PADRAO_PET];
}
