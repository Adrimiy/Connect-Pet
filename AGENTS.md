<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Responsividade & Compatibilidade Multidispositivo (Obrigatório)
Toda e qualquer alteração de interface deve seguir estritamente a abordagem Mobile-First através dos prefixos do Tailwind CSS (`sm:`, `md:`, `lg:`, `xl:`).
Não criar larguras ou alturas fixas em pixels (`w-[500px]`, `h-[400px]`) em elementos estruturais; recorrer a classes fluidas como `w-full`, `max-w-*`, `min-h-*` e grelhas dinâmicas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
Assegurar que grelhas de animais, cartões de detalhes e formulários se ajustem sem quebra de texto, transbordo horizontal (*horizontal scroll*) ou sobreposição de botões em ecrãs pequenos (a partir de 320px).
Menus, barras de navegação e filtros de pesquisa de animais devem ter suporte explícito para drawer/sheet retrátil ou menu colapsável em dispositivos móveis.
Garantir que áreas interativas (botões de contacto, partilha e adoção) tenham uma área de toque mínima confortável para utilização em ecrãs táteis (`min-h-[44px]` ou `p-3`).

# Instruções Gerais para Agentes de IA

## 1. Leitura obrigatória das regras

Antes de iniciar qualquer tarefa, o agente deve consultar todos os arquivos de regras presentes no diretório `.agents/rules/`.

Esta instrução é permanente e dinâmica. O agente não deve considerar apenas os arquivos existentes no momento, mas também quaisquer regras que sejam adicionadas, modificadas ou removidas futuramente.

- Descobrir automaticamente todos os arquivos `.md` presentes em `.agents/rules/`, incluindo subdiretórios.
- Ler o conteúdo completo das regras antes de iniciar qualquer implementação, correção ou refatoração.
- Não depender de uma lista fixa de arquivos.
- Considerar sempre a versão mais recente das regras.
- Aplicar todas as regras relevantes em conjunto.
- Não ignorar regras por não estarem mencionadas individualmente neste documento.
- Caso existam regras conflitantes, informar o conflito e solicitar esclarecimento quando necessário.

## 2. Utilização de skills

O agente deve consultar as habilidades disponíveis em `.agents/skills/` e identificar aquelas relevantes para a tarefa solicitada.

Novas skills adicionadas futuramente também devem ser consideradas automaticamente, respeitando suas instruções de utilização.

## 3. Prioridade e conformidade

- As regras do projeto são obrigatórias, desde que não entrem em conflito com instruções de prioridade superior.
- Nenhuma alteração no código deve desrespeitar as regras aplicáveis.
- Caso algum arquivo de regras esteja inacessível, o agente deve informar o problema.
- O agente não deve presumir o conteúdo de regras que não conseguiu ler.
- Antes de concluir uma tarefa, verificar se as alterações realizadas estão em conformidade com as regras aplicáveis.

O diretório `.agents/rules/` é a fonte centralizada das regras de desenvolvimento do projeto e deve ser consultado dinamicamente em todas as tarefas.

## 4. Planejamento

Analisar o código existente antes de implementar qualquer solução.

Priorizar soluções simples, seguras e compatíveis com a arquitetura atual.

Reutilizar funções, componentes e serviços existentes sempre que possível.

Evitar criar arquivos ou abstrações desnecessárias.