---
trigger: always_on
---

# Regras de Desenvolvimento — Idioma Português (PT-BR)

## 1. Idioma obrigatório
- Todo código desenvolvido ou modificado deve seguir o português brasileiro (PT-BR) como idioma padrão.
- Nomes de variáveis, funções, métodos, tabelas sql, classes e constantes devem ser escritos em português, sempre que possível.
- Comentários, documentações, mensagens de erro e textos exibidos ao usuário devem estar em português.
- Não utilizar nomes em inglês por preferência ou conveniência quando existir uma alternativa adequada em português.

## 2. Nomenclatura
- Utilizar nomes claros, descritivos e que representem corretamente sua finalidade.
- Respeitar as convenções de nomenclatura da linguagem utilizada, como `camelCase`, `PascalCase` e `UPPER_SNAKE_CASE`.
- Não utilizar acentos, espaços ou caracteres especiais nos identificadores.

Exemplos:
- `userName` → `nomeUsuario`
- `getUserData()` → `obterDadosUsuario()`
- `isLoading` → `estaCarregando`
- `MAX_RETRIES` → `MAXIMO_TENTATIVAS`
- `UserProfile` → `PerfilUsuario`

## 3. Comentários
- Todos os comentários devem ser escritos em português brasileiro.
- Documentar funções, classes e trechos de lógica complexa, explicando sua finalidade e funcionamento.
- Utilizar comentários objetivos, claros e úteis.
- Evitar comentários redundantes que apenas repetem o que o código já demonstra.
- Manter os comentários atualizados sempre que o código for modificado.

## 4. Exceções técnicas
- Não traduzir palavras reservadas das linguagens de programação.
- Preservar nomes obrigatórios de bibliotecas, frameworks, APIs, componentes externos e configurações.
- Não modificar nomes de propriedades, rotas, campos de banco de dados ou contratos existentes quando isso puder causar incompatibilidade.
- Manter nomes em inglês quando forem exigidos pelo funcionamento de ferramentas ou integrações.
- Priorizar sempre a compatibilidade e o funcionamento correto do sistema.

## 5. Aplicação das regras
- Aplicar estas regras a todo código novo.
- Ao modificar códigos existentes, seguir essas convenções nas partes alteradas.
- Não renomear elementos existentes indiscriminadamente.
- Antes de renomear qualquer identificador, verificar todas as suas referências e possíveis dependências.
- Não realizar alterações que prejudiquem o funcionamento do projeto apenas para traduzir identificadores.

## 6. Prioridade
Estas regras devem ser seguidas em todas as tarefas de desenvolvimento, correção, refatoração e manutenção.

O objetivo é manter o projeto padronizado, legível e documentado em português brasileiro, respeitando as exigências técnicas de cada tecnologia.