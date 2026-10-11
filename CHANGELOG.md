# Changelog

## [v0.5.0] - 2026-10-11
### Commit
`feat: modernizar painel de gestão de adoções`

### Mudanças
- Reorganiza o dashboard de ONGs e doadores com visão geral orientada a tarefas, navegação persistida na URL e indicadores reais acionáveis.
- Consolida a gestão de animais em uma única experiência com busca, filtros, ordenação, cartões, tabela, completude do anúncio e contagem de candidaturas.
- Aprimora a triagem com filtros, ordenação por atividade, dossiê em painel móvel, contatos rápidos e menor destaque decisório para a análise automática.
- Adiciona confirmação e regras seguras para transições de candidatura, incluindo a sincronização correta do pet ao concluir ou reabrir uma adoção.
- Filtra candidaturas recebidas pelo responsável autenticado e adiciona datas de atualização e índice composto alinhado à consulta do painel.
- Atualiza os rótulos de navegação para atender igualmente ONGs e doadores individuais, preservando responsividade, acessibilidade e temas claro/escuro.

---

## [v0.4.2] - 2026-10-11
### Commit
`fix: sincronizar adoções concluídas com métricas e pets`

### Mudanças
- Atualiza o pet para adotado quando a ONG ou o doador conclui uma candidatura, refletindo a mudança imediatamente no painel e de forma persistente no banco.
- Corrige os indicadores para contar candidaturas realmente abertas e reconhecer adoções concluídas em dados legados sem duplicar o mesmo pet.

---

## [v0.4.1] - 2026-10-11
### Commit
`fix: impedir falhas com imagens externas não autorizadas`

### Mudanças
- Normaliza fotos de pets, candidaturas e avatares antes da renderização pelo `next/image`.
- Substitui URLs legadas de origens não configuradas pelo placeholder local, preservando apenas caminhos locais, Unsplash e o Storage do Supabase.

---

## [v0.4.0] - 2026-10-11
### Commit
`feat: concluir gestão segura de pets e persistência real no Supabase`

### Mudanças
- Consolida o cadastro, a edição, a atualização de status e a exclusão dos pets publicados pelo próprio perfil de ONG ou doador, com confirmação de persistência, tratamento de carregamento e limpeza das fotos no Storage.
- Remove dados mockados, respostas fictícias de candidaturas, métricas inventadas e persistências de negócio no navegador, mantendo apenas dados reais carregados do Supabase.
- Reforça autenticação, cadastro de ONG ou doador individual, perfis, favoritos, candidaturas, mensagens, avatares, RLS, privilégios e triggers no schema idempotente.
- Corrige estados de erro e carregamento, rotas legadas, textos imprecisos e responsividade mobile-first com áreas de toque acessíveis.
- Remove dependências, utilitários, dados e imagens padrão sem uso e restringe as origens remotas aceitas pelo componente de imagens.
- Atualiza Next.js e eslint-config-next para 16.4.0, aplica correções transitivas seguras e deixa a auditoria de dependências de produção sem vulnerabilidades conhecidas.

---

## [v0.3.0] - 2026-10-10
### Commit
`feat: permitir edição segura dos pets publicados`

### Mudanças
- Adiciona acesso à edição em cada cartão de pet do painel da ONG ou doador.
- Permite atualizar dados, fotos, condições de saúde e status da adoção em um formulário responsivo.
- Restringe a edição ao perfil proprietário e só confirma o salvamento após a resposta do Supabase.

---

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
