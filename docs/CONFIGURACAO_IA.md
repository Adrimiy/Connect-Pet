# Configuração da IA do ConnectPet

O ConnectPet usa o GroqCloud apenas para contextualizar resultados já calculados por regras locais e auditáveis. A chave nunca deve ser adicionada ao `.env.local` do Next.js nem receber o prefixo `NEXT_PUBLIC_`: ela fica exclusivamente nos secrets da Edge Function do Supabase. O índice é heurístico, não uma probabilidade de sucesso nem uma decisão automatizada.

## 1. Criar a chave gratuita no GroqCloud

1. Acesse [console.groq.com](https://console.groq.com/) e crie ou entre em uma conta.
2. Crie um projeto exclusivo para o ConnectPet.
3. Em **API Keys**, selecione **Create API Key**, dê um nome descritivo e copie a chave uma única vez.
4. Em **Settings > Data Controls**, habilite **Zero Data Retention**. O código já remove nome, e-mail, telefone, CPF/RG e limita textos antes de chamar o provedor; esta configuração adiciona outra camada de privacidade.
5. Em **Limits**, mantenha limites conservadores para o projeto e acompanhe o consumo da cota gratuita.

O modelo padrão é `openai/gpt-oss-20b`, que oferece saída JSON estruturada no plano gratuito. Ele pode ser trocado sem alterar código pelo secret opcional `GROQ_MODEL`, desde que o novo modelo aceite `response_format` com JSON Schema estrito.

## 2. Atualizar o banco no Supabase

1. Abra o projeto no Supabase Dashboard.
2. Acesse **SQL Editor**.
3. Execute a versão atual de `supabase/schema.sql`.

Essa atualização cria o controle diário de uso da IA e permite que somente a Edge Function grave `automated_analysis`, depois de validar a sessão e confirmar que a candidatura pertence ao responsável. O navegador não recebe permissão para forjar uma análise marcada como IA. As respostas enviadas, os dados pessoais e a identificação do pet continuam imutáveis pelo trigger de proteção.

Execute o schema antes de republicar a função. A versão nova da função verifica se a gravação exclusiva pelo `service_role` está ativa e retorna uma orientação segura se o banco ainda estiver desatualizado.

## 3. Cadastrar o secret da Edge Function

No Supabase Dashboard:

1. Acesse **Edge Functions > Secrets**.
2. Adicione `GROQ_API_KEY` com a chave copiada do GroqCloud.
3. Opcionalmente, adicione `GROQ_MODEL` com `openai/gpt-oss-20b`.
4. Salve. Nunca registre o valor da chave no Git.

Para desenvolvimento local, crie `supabase/functions/.env` (o arquivo já é ignorado pelo Git):

```dotenv
GROQ_API_KEY=sua_chave_privada
GROQ_MODEL=openai/gpt-oss-20b
```

## 4. Publicar a função

Use a CLI atual do Supabase sem instalação global pelo npm:

```powershell
npx supabase --help
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy analisar-compatibilidade --use-api
```

A função mantém a verificação de JWT habilitada. Smart Match com IA exige uma sessão autenticada e um clique explícito em **Contextualizar com IA**; visitantes continuam recebendo o ranking determinístico local. Na triagem, a função também confirma que o usuário é o responsável pela candidatura antes de consultar ou persistir qualquer análise. A chave secreta padrão do Supabase é lida apenas dentro da função para a gravação final e nunca é enviada ao navegador.

## 5. Validar a integração

1. Entre como adotante, responda ao Smart Match, clique em **Contextualizar com IA** e confirme a mensagem **Explicações contextualizadas por IA**.
2. Entre como ONG ou doador, abra **Triagem de candidaturas**, selecione uma candidatura e clique em **Analisar com IA**.
3. Confirme que o selo muda para **Contextualizada por IA**, que a justificativa é exibida e que **Como a pontuação foi calculada** mostra os fatores fixos.
4. Remova temporariamente `GROQ_API_KEY` em um ambiente de teste e confirme o fallback: o ranking e a análise local continuam disponíveis, sem pontuações aleatórias.

## Privacidade e limites

- Os campos cadastrais de nome, contato, documento, profissão, renda, rede social e endereço não são enviados ao GroqCloud.
- Na candidatura, textos livres são convertidos em indicadores booleanos antes do envio sempre que possível. Campos residuais passam por remoção de padrões de e-mail, telefone e CPF, mas nenhuma expressão regular consegue reconhecer todo nome, RG, CNPJ ou endereço; por isso, não se deve repetir dados pessoais nos textos livres.
- A IA não define nem altera a nota e não decide a adoção.
- Os textos da IA são exibidos separadamente dos fatores determinísticos usados no índice.
- Cada conta tem limite diário no banco para reduzir abuso e proteger a cota compartilhada do projeto.
- O plano gratuito possui limites por minuto, dia e volume de tokens. Ao receber limite `429` ou indisponibilidade do provedor, o site preserva a análise local.
- O Supabase Free inclui uma cota mensal de invocações de Edge Functions; acompanhe o uso no Dashboard.
- O Zero Data Retention reduz a retenção de entradas e saídas pelo provedor, mas não elimina necessariamente metadados operacionais e de uso. Mantenha essa informação na política de privacidade do ConnectPet.
