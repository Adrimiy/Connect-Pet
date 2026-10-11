import { createClient as criarClienteSupabase } from '@supabase/supabase-js'

function limparCookiesLegadosDeAutenticacao() {
  if (typeof document === 'undefined') return

  const nomes = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter((nome): nome is string =>
      /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/i.test(nome)
    )

  if (nomes.length === 0) return

  const partesDoDominio = window.location.hostname.split('.')
  const dominios = partesDoDominio.length > 2
    ? [undefined, window.location.hostname, `.${partesDoDominio.slice(-2).join('.')}`]
    : [undefined, window.location.hostname]

  for (const nome of nomes) {
    for (const dominio of dominios) {
      const atributoDominio = dominio ? `; Domain=${dominio}` : ''
      document.cookie = `${nome}=; Max-Age=0; Path=/; SameSite=Lax${atributoDominio}`
    }
  }
}

function criarNovoCliente() {
  return criarClienteSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}

let clienteSupabase: ReturnType<typeof criarNovoCliente> | null = null

export function createClient() {
  if (clienteSupabase) return clienteSupabase

  // A aplicação acessa o Supabase apenas no navegador. Cookies de sessão
  // fariam o JWT acompanhar toda navegação e poderiam exceder o limite de
  // headers da Vercel. Remove cookies deixados pela antiga configuração SSR.
  limparCookiesLegadosDeAutenticacao()

  clienteSupabase = criarNovoCliente()

  return clienteSupabase
}
