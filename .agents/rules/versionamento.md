---
trigger: always_on
---

# Diretrizes de Versionamento e Changelog

1. Arquivo Único:
   - Todo o versionamento do projeto DEVE ser registrado exclusivamente no arquivo `CHANGELOG.md` na raiz.
   - NUNCA crie pastas separadas (ex: `versionamento/`) ou múltiplos arquivos `.md` por versão.

2. Inserção no Topo:
   - Toda nova entrega, correção ou feature deve ser adicionada no topo do `CHANGELOG.md`, logo abaixo do título principal `# Changelog`.
   - Mantenha a ordem cronológica inversa (a versão mais recente sempre no topo).

3. Estrutura Obrigatória de Cada Versão:
   Utilize rigorosamente o padrão abaixo para facilitar automações de commit:

   ## [vX.Y.Z] - AAAA-MM-DD
   ### Commit
   `<tipo>: <mensagem concisa no padrão Conventional Commits>`

   ### Mudanças
   - Descrição clara da alteração 1.
   - Descrição clara da alteração 2.

   ---

4. Mensagens de Commit:
   - Use o padrão Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
   - Mantenha a mensagem puramente técnica, objetiva e profissional, focada exclusivamente nas mudanças de código.