# Changelog

## [v0.2.4] - 2026-10-10
### Commit
`fix: sincronizar autenticação real no envio de fotos`

### Mudanças
- Remove acessos mockados que exibiam uma conta de doador sem criar sessão no Supabase Auth.
- Impede que perfis salvos localmente sejam tratados como uma sessão autenticada.
- Melhora o diagnóstico de sessão no envio de fotos e adiciona a política de leitura dos próprios objetos no Storage.

---

## [v0.2.3] - 2026-10-10
### Commit
`fix: armazenar sessão do Supabase fora dos headers HTTP`

### Mudanças
- Substitui o cliente SSR no navegador pelo cliente Supabase padrão com sessão persistida no armazenamento local.
- Remove automaticamente cookies de autenticação legados quando a aplicação consegue carregar.
- Remove o proxy de sessão, pois o projeto não consome autenticação em componentes ou ações do servidor.

---
