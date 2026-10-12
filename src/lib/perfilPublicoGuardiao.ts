import { createClient } from "@/lib/client";
import { obterUrlImagemPermitida } from "@/lib/origensImagem";

/** Dados institucionais do responsável que podem ser exibidos publicamente. */
export interface PerfilPublicoGuardiao {
  nome: string;
  tipoGuardiao: "individual" | "ngo";
  apresentacao: string | null;
  redesSociais: string | null;
  avatar: string | null;
  verificado: boolean;
  cidade: string;
  estado: string;
  membroDesde: string | null;
  totalAnimaisDisponiveis: number;
}

/**
 * Busca o perfil público do responsável via função RPC, que nunca devolve
 * documento, e-mail ou telefone. Retorna null quando indisponível.
 */
export async function obterPerfilPublicoGuardiao(idGuardiao: string): Promise<PerfilPublicoGuardiao | null> {
  if (!idGuardiao) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("obter_perfil_publico_guardiao", { p_guardian_id: idGuardiao });
  if (error || !Array.isArray(data) || data.length === 0) return null;

  const linha = data[0] as Record<string, unknown>;
  return {
    nome: String(linha.nome || ""),
    tipoGuardiao: linha.tipo_guardiao === "individual" ? "individual" : "ngo",
    apresentacao: typeof linha.apresentacao === "string" ? linha.apresentacao : null,
    redesSociais: typeof linha.redes_sociais === "string" ? linha.redes_sociais : null,
    avatar: obterUrlImagemPermitida(linha.avatar),
    verificado: linha.verificado === true,
    cidade: String(linha.cidade || ""),
    estado: String(linha.estado || ""),
    membroDesde: typeof linha.membro_desde === "string" ? linha.membro_desde : null,
    totalAnimaisDisponiveis: Number(linha.total_animais_disponiveis) || 0
  };
}

/**
 * Converte o texto de redes sociais (@usuario ou link) em uma URL segura.
 * Retorna null quando não for possível montar um link válido.
 */
export function montarLinkRedeSocial(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) return null;

  if (/^https?:\/\//i.test(texto)) {
    try {
      const url = new URL(texto);
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  const usuario = texto.replace(/^@/, "");
  if (/^[A-Za-z0-9._]{1,30}$/.test(usuario)) return `https://instagram.com/${usuario}`;
  return null;
}
