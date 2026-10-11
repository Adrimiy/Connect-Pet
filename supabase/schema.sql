-- ==============================================================================
-- Schema do Banco de Dados ConnectPet / Acolher no Supabase
-- ==============================================================================

-- 1. Extensões
-- (pgcrypto removida: gen_random_uuid() já é nativa do Postgres 13+; nenhuma função pgcrypto é usada)

-- 2. Tabela de Animais (pets)
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null check (species in ('dog', 'cat')),
  breed text not null,
  size text not null check (size in ('small', 'medium', 'large')),
  approximate_age text not null,
  age_category text not null check (age_category in ('puppy', 'young', 'adult', 'senior')),
  sex text not null check (sex in ('male', 'female')),
  status text not null default 'available' check (status in ('available', 'in_process', 'adopted')),
  vaccinated boolean not null default false,
  castrated boolean not null default false,
  dewormed boolean not null default false,
  vaccination_details text,
  special_needs text,
  photos text[] not null default '{}'::text[],
  headline text,
  story text,
  temperament text[] not null default '{}'::text[],
  temperament_description text,
  guardian_id text not null,
  guardian_name text not null,
  guardian_type text not null check (guardian_type in ('individual', 'ngo')),
  guardian_phone text,
  guardian_email text,
  city text,
  state text,
  neighborhood text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Índices para otimização de busca na tabela pets
-- (idx_pets_status e idx_pets_species removidos: o catálogo filtra no navegador, nenhuma query usa esses filtros)
create index if not exists idx_pets_guardian_id on public.pets (guardian_id);

-- Evita que integrações incompletas atribuam raça, idade ou localização fictícias.
alter table public.pets alter column breed drop default;
alter table public.pets alter column approximate_age drop default;
alter table public.pets alter column city drop default;
alter table public.pets alter column state drop default;
alter table public.pets alter column neighborhood drop default;

-- 3. Tabela de Candidaturas de Adoção (applications)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets (id) on delete set null,
  candidate_name text not null,
  candidate_email text not null,
  candidate_phone text,
  guardian_id text not null,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'completed')),
  candidate jsonb not null default '{}'::jsonb,
  housing jsonb not null default '{}'::jsonb,
  routine jsonb not null default '{}'::jsonb,
  finance jsonb not null default '{}'::jsonb,
  dossier jsonb not null default '{}'::jsonb,
  automated_analysis jsonb not null default '{}'::jsonb,
  guardian_notes text default '',
  pet_name text,
  pet_photo text,
  pet_species text,
  guardian_name text,
  guardian_type text,
  candidate_id text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Índices para otimização de busca na tabela applications
-- (idx_applications_status removido: nenhuma query filtra por status no banco)
create index if not exists idx_applications_pet_id on public.applications (pet_id);
create index if not exists idx_applications_guardian_id on public.applications (guardian_id);
create index if not exists idx_applications_candidate_email on public.applications (candidate_email);
create index if not exists idx_applications_guardian_criado
  on public.applications (guardian_id, created_at desc);

-- Garante compatibilidade com bancos criados antes da adoção dos campos de atualização.
alter table public.pets
  add column if not exists updated_at timestamp with time zone not null default timezone('utc'::text, now());
alter table public.applications
  add column if not exists updated_at timestamp with time zone not null default timezone('utc'::text, now());

-- 4. Tabela de Mensagens da Candidatura (application_messages)
create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  sender_role text not null check (sender_role in ('adopter', 'candidate', 'guardian', 'system')),
  message text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Índice para busca de mensagens por candidatura
-- (idx_app_messages_created_at removido: a ordenação é feita no navegador)
create index if not exists idx_app_messages_app_id on public.application_messages (application_id);

-- 5. Tabela de Perfis de Usuário (profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('adopter', 'guardian')),
  name text not null,
  email text not null,
  primary_phone text,
  secondary_phone text,
  avatar text,
  -- Campos específicos de Adotante
  cpf text,
  rg text,
  birth_date text,
  profession text,
  social_media text,
  housing_type text,
  has_adequate_space boolean,
  has_other_pets boolean,
  other_pets_details text,
  has_children boolean,
  species_preference text,
  size_preference text,
  -- Campos comuns e de Guardião / ONG
  guardian_type text check (guardian_type in ('individual', 'ngo')),
  responsible_name text,
  document text,
  city text,
  state text,
  neighborhood text,
  description text,
  bio text,
  verified boolean default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Garantir que colunas recentes existam mesmo se a tabela já foi criada anteriormente
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists housing_type text;
alter table public.profiles add column if not exists has_adequate_space boolean;
alter table public.profiles add column if not exists has_other_pets boolean;
alter table public.profiles add column if not exists other_pets_details text;
alter table public.profiles add column if not exists has_children boolean;
alter table public.profiles add column if not exists species_preference text;
alter table public.profiles add column if not exists size_preference text;

-- Campos de leitura usados pelo site e pelas políticas RLS das candidaturas.
-- Precisam existir antes da criação das políticas, inclusive em bancos já existentes.
alter table public.applications add column if not exists pet_name text;
alter table public.applications add column if not exists pet_photo text;
alter table public.applications add column if not exists pet_species text;
alter table public.applications add column if not exists guardian_name text;
alter table public.applications add column if not exists guardian_type text;
alter table public.applications add column if not exists candidate_id text;
create index if not exists idx_applications_candidate_id on public.applications (candidate_id);

-- (idx_profiles_role e idx_profiles_email removidos: profiles só é consultada pela chave primária 'id')

-- 6. Tabela de Favoritos / Curtidas (favorites)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, pet_id)
);

create index if not exists idx_favorites_user_id on public.favorites (user_id);
create index if not exists idx_favorites_pet_id on public.favorites (pet_id);

-- 7. Configuração de Row Level Security (RLS)
alter table public.pets enable row level security;
alter table public.applications enable row level security;
alter table public.application_messages enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

-- Políticas para Pets (catálogo é público para leitura; gerenciamento por autenticados)
drop policy if exists "Allow public read access for pets" on public.pets;
create policy "Allow public read access for pets"
  on public.pets for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow insert for pets" on public.pets;
create policy "Allow insert for pets"
  on public.pets for insert
  to authenticated
  with check (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

drop policy if exists "Allow update for pets" on public.pets;
create policy "Allow update for pets"
  on public.pets for update
  to authenticated
  using (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  )
  with check (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

drop policy if exists "Allow delete for pets" on public.pets;
create policy "Allow delete for pets"
  on public.pets for delete
  to authenticated
  using (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

-- Políticas para Profiles
-- Cada usuário lê apenas o PRÓPRIO perfil. O site nunca lê perfis de terceiros, e o perfil contém
-- dados sensíveis (CPF/CNPJ, e-mail, telefone), por isso NÃO há leitura pública de perfis de ONGs.
drop policy if exists "Allow user to read own profile or public guardian profiles" on public.profiles;
drop policy if exists "Allow public read for guardian profiles" on public.profiles;
drop policy if exists "Allow user to read own profile" on public.profiles;
create policy "Allow user to read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Allow user to insert own profile" on public.profiles;
create policy "Allow user to insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Allow user to update own profile" on public.profiles;
create policy "Allow user to update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- A exclusão da conta deve ocorrer pelo fluxo de Auth (que faz o cascade do perfil),
-- e não apagando diretamente a linha de perfil pela Data API.
drop policy if exists "Allow user to delete own profile" on public.profiles;

-- Políticas para Favorites (apenas o próprio usuário acessa seus favoritos)
drop policy if exists "Allow user to read own favorites" on public.favorites;
create policy "Allow user to read own favorites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Allow user to insert own favorites" on public.favorites;
create policy "Allow user to insert own favorites"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Allow user to delete own favorites" on public.favorites;
create policy "Allow user to delete own favorites"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Políticas para Candidaturas (Adotante vê as suas, Guardião vê as recebidas)
-- E-mails são comparados sem diferenciar maiúsculas/minúsculas.
drop policy if exists "Allow participants to view applications" on public.applications;
create policy "Allow participants to view applications"
  on public.applications for select
  to authenticated
  using (
    guardian_id = (select auth.uid())::text
    or candidate_id = (select auth.uid())::text
    or lower(candidate_email) = lower((select auth.jwt() ->> 'email'))
    or (candidate ->> 'id') = (select auth.uid())::text
  );

-- A candidatura nasce sempre como 'pending' e, quando ligada a um pet real, o guardian_id
-- precisa ser o dono desse pet (impede criar candidatura já aprovada ou apontada para outra ONG).
drop policy if exists "Allow candidate to insert application" on public.applications;
create policy "Allow candidate to insert application"
  on public.applications for insert
  to authenticated
  with check (
    status = 'pending'
    and candidate_id = (select auth.uid())::text
    and (
      lower(candidate_email) = lower((select auth.jwt() ->> 'email'))
      or (candidate ->> 'id') = (select auth.uid())::text
    )
    and (
      pet_id is null
      or exists (
        select 1 from public.pets p
        where p.id = pet_id
        and p.guardian_id = applications.guardian_id
      )
    )
  );

drop policy if exists "Allow guardian to update application" on public.applications;
create policy "Allow guardian to update application"
  on public.applications for update
  to authenticated
  using (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  )
  with check (
    guardian_id = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

-- Políticas para Mensagens de Candidatura
drop policy if exists "Allow participants to read application messages" on public.application_messages;
create policy "Allow participants to read application messages"
  on public.application_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
      and (
        a.guardian_id = (select auth.uid())::text
        or a.candidate_id = (select auth.uid())::text
        or lower(a.candidate_email) = lower((select auth.jwt() ->> 'email'))
        or (a.candidate ->> 'id') = (select auth.uid())::text
      )
    )
  );

drop policy if exists "Allow participants to insert application messages" on public.application_messages;
create policy "Allow participants to insert application messages"
  on public.application_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())::text
    and exists (
      select 1 from public.applications a
      where a.id = application_id
      and (
        (
          sender_role = 'guardian'
          and a.guardian_id = (select auth.uid())::text
        )
        or (
          sender_role in ('adopter', 'candidate')
          and (
            a.candidate_id = (select auth.uid())::text
            or lower(a.candidate_email) = lower((select auth.jwt() ->> 'email'))
            or (a.candidate ->> 'id') = (select auth.uid())::text
          )
        )
      )
    )
  );

-- 8. Documentação de Integridade de Dados Cadastrais (ConnectPet)
-- Regras de validação aplicadas na camada de aplicação e documentadas no banco:
-- - CNPJ (guardians/ong): 14 dígitos numéricos formatados no padrão '00.000.000/0000-00' (máx 18 chars com máscara)
--   com verificação matemática obrigatória dos dois dígitos verificadores (Módulo 11).
-- - CPF (adopters): 11 dígitos numéricos formatados no padrão '000.000.000-00' (máx 14 chars com máscara).
-- - Telefone/WhatsApp: 10 ou 11 dígitos numéricos no padrão '(00) 0000-0000' ou '(00) 00000-0000'.
-- - Avatares: URLs remotas de storage; dados brutos em base64 não devem ser persistidos em auth.users.user_metadata
--   para prevenir estouro de cabeçalhos HTTP (erro 431).
-- 9. Fotos dos Animais (Supabase Storage)
-- Bucket público para leitura (as fotos aparecem no catálogo sem login).
-- Limite de 5 MB por arquivo e apenas JPG, PNG e WebP (igual à validação da aplicação).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Padrão de caminho dos arquivos: <auth.uid()>/<uuid>.<extensão>
-- Cada usuário autenticado só escreve/altera/remove arquivos dentro da própria pasta.
drop policy if exists "Pet photos: authenticated upload to own folder" on storage.objects;
create policy "Pet photos: authenticated upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

-- O Storage devolve os metadados do objeto apó o INSERT; por isso o proprietário
-- também precisa poder selecionar os arquivos existentes em sua própria pasta.
drop policy if exists "Pet photos: owner can read own files" on storage.objects;
create policy "Pet photos: owner can read own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and owner_id = (select auth.uid())
  );

drop policy if exists "Pet photos: owner can update own files" on storage.objects;
create policy "Pet photos: owner can update own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  )
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles perfil
      where perfil.id = (select auth.uid())
        and perfil.role = 'guardian'
    )
  );

drop policy if exists "Pet photos: owner can delete own files" on storage.objects;
create policy "Pet photos: owner can delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A leitura das URLs públicas continua sendo feita pelo endpoint público do bucket.
-- A política SELECT acima não permite listagem anônima e limita usuários autenticados aos próprios objetos.

-- ==============================================================================
-- 10. Correções da análise do banco (triggers, colunas e proteções adicionais)
-- Tudo abaixo é idempotente: pode ser executado mais de uma vez com segurança.
-- ==============================================================================

-- 10.1 Remove no banco os índices que o site não usa (caso já tenham sido criados antes)
drop index if exists public.idx_pets_status;
drop index if exists public.idx_pets_species;
drop index if exists public.idx_profiles_role;
drop index if exists public.idx_profiles_email;
drop index if exists public.idx_applications_status;
drop index if exists public.idx_app_messages_created_at;

-- 10.2 Limite de 6 fotos por animal também no banco (o mesmo limite do front-end).
-- "not valid" aplica a regra apenas a novos cadastros/edições, sem falhar por pets antigos.
alter table public.pets drop constraint if exists pets_photos_max_6;
alter table public.pets
  add constraint pets_photos_max_6 check (cardinality(photos) <= 6) not valid;

-- 10.3 Dados da candidatura que o site lê (nome/foto do pet, dados da ONG, id do candidato).
-- Funcionam como "foto instantânea": continuam existindo mesmo se o pet for excluído depois.
alter table public.applications add column if not exists pet_name text;
alter table public.applications add column if not exists pet_photo text;
alter table public.applications add column if not exists pet_species text;
alter table public.applications add column if not exists guardian_name text;
alter table public.applications add column if not exists guardian_type text;
alter table public.applications add column if not exists candidate_id text;

-- Preenche automaticamente esses campos a cada nova candidatura (BEFORE INSERT)
create or replace function public.applications_preencher_dados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pet_id is not null then
    select p.name, p.photos[1], p.species, p.guardian_name, p.guardian_type
      into new.pet_name, new.pet_photo, new.pet_species, new.guardian_name, new.guardian_type
      from public.pets p
      where p.id = new.pet_id;
  end if;

  new.candidate_id := coalesce(new.candidate_id, (select auth.uid())::text, new.candidate ->> 'id');
  return new;
end;
$$;

drop trigger if exists trg_applications_preencher_dados on public.applications;
create trigger trg_applications_preencher_dados
  before insert on public.applications
  for each row execute function public.applications_preencher_dados();

-- Depois de enviada, a candidatura só permite alterar o andamento e as notas da ONG.
-- Impede que um participante troque pet, candidato, responsável ou respostas do dossiê.
create or replace function public.applications_proteger_dados_enviados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.pet_id := old.pet_id;
  new.candidate_name := old.candidate_name;
  new.candidate_email := old.candidate_email;
  new.candidate_phone := old.candidate_phone;
  new.guardian_id := old.guardian_id;
  new.candidate := old.candidate;
  new.housing := old.housing;
  new.routine := old.routine;
  new.finance := old.finance;
  new.dossier := old.dossier;
  new.automated_analysis := old.automated_analysis;
  new.created_at := old.created_at;
  new.pet_name := old.pet_name;
  new.pet_photo := old.pet_photo;
  new.pet_species := old.pet_species;
  new.guardian_name := old.guardian_name;
  new.guardian_type := old.guardian_type;
  new.candidate_id := old.candidate_id;
  return new;
end;
$$;

-- Preenche as candidaturas já existentes
drop trigger if exists trg_applications_proteger_dados_enviados on public.applications;

update public.applications a
  set pet_name = p.name,
      pet_photo = p.photos[1],
      pet_species = p.species,
      guardian_name = p.guardian_name,
      guardian_type = p.guardian_type
  from public.pets p
  where a.pet_id = p.id
    and a.pet_name is null;

update public.applications
  set candidate_id = candidate ->> 'id'
  where candidate_id is null
    and candidate ? 'id';

create trigger trg_applications_proteger_dados_enviados
  before update on public.applications
  for each row execute function public.applications_proteger_dados_enviados();

-- Deriva a identidade exibida em cada mensagem do perfil autenticado.
-- Mensagens de sistema criadas por trigger preservam os valores internos controlados pelo banco.
create or replace function public.application_messages_preencher_remetente()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  perfil record;
begin
  if new.sender_role = 'system' and pg_trigger_depth() > 1 then
    return new;
  end if;

  if (select auth.uid()) is null then
    raise exception 'É necessário estar autenticado para enviar mensagens.';
  end if;

  select p.name, p.role
    into perfil
    from public.profiles p
    where p.id = (select auth.uid());

  if not found then
    raise exception 'Perfil autenticado não encontrado.';
  end if;

  new.sender_id := (select auth.uid())::text;
  new.sender_name := perfil.name;
  new.sender_role := case when perfil.role = 'guardian' then 'guardian' else 'candidate' end;
  return new;
end;
$$;

drop trigger if exists trg_application_messages_preencher_remetente on public.application_messages;
create trigger trg_application_messages_preencher_remetente
  before insert on public.application_messages
  for each row execute function public.application_messages_preencher_remetente();

-- 10.4 Ao receber uma candidatura, o pet passa para "Em Processo" no banco.
-- O adotante não tem permissão de editar pets, por isso a função roda com privilégios do dono (security definer).
create or replace function public.applications_marcar_pet_em_processo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
    and new.candidate_id is distinct from (select auth.uid())::text then
    raise exception 'Candidato autenticado não corresponde à candidatura.';
  end if;

  if new.pet_id is not null then
    update public.pets
      set status = 'in_process'
      where id = new.pet_id
        and status = 'available';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_applications_marcar_pet_em_processo on public.applications;
create trigger trg_applications_marcar_pet_em_processo
  after insert on public.applications
  for each row execute function public.applications_marcar_pet_em_processo();

-- 10.5 Mantém datas de atualização e protege o fluxo das candidaturas.
create or replace function public.atualizar_data_modificacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_pets_atualizar_data_modificacao on public.pets;
create trigger trg_pets_atualizar_data_modificacao
  before update on public.pets
  for each row execute function public.atualizar_data_modificacao();

drop trigger if exists trg_applications_atualizar_data_modificacao on public.applications;
create trigger trg_applications_atualizar_data_modificacao
  before update on public.applications
  for each row execute function public.atualizar_data_modificacao();

-- Evita saltos que contornem a triagem. A reabertura de uma adoção concluída é permitida
-- somente para "em avaliação", deixando a correção explícita e reversível.
create or replace function public.applications_validar_transicao_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending' and new.status in ('under_review', 'rejected'))
    or (old.status = 'under_review' and new.status in ('pending', 'approved', 'rejected'))
    or (old.status = 'approved' and new.status in ('under_review', 'rejected', 'completed'))
    or (old.status = 'rejected' and new.status = 'under_review')
    or (old.status = 'completed' and new.status = 'under_review')
  ) then
    raise exception 'Transição de status inválida: % para %.', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_applications_validar_transicao_status on public.applications;
create trigger trg_applications_validar_transicao_status
  before update of status on public.applications
  for each row execute function public.applications_validar_transicao_status();

-- Registra a mensagem de sistema e sincroniza a conclusão ou reabertura com o pet.
-- A função valida o responsável antes de atualizar o pet com privilégios internos do banco.
create or replace function public.applications_registrar_mudanca_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if (select auth.uid()) is not null
      and new.guardian_id is distinct from (select auth.uid())::text then
      raise exception 'Responsável autenticado não corresponde à candidatura.';
    end if;

    insert into public.application_messages (application_id, sender_id, sender_name, sender_role, message)
    values (
      new.id,
      'system',
      'Sistema ConnectPet',
      'system',
      'Status da candidatura alterado para: ' ||
      case new.status
        when 'pending' then 'Pendente'
        when 'under_review' then 'Em Avaliação'
        when 'approved' then 'Aprovada'
        when 'rejected' then 'Não Aprovada'
        when 'completed' then 'Adoção Concluída'
        else new.status
      end || '.'
    );

    if new.status = 'completed' and new.pet_id is not null then
      update public.pets
        set status = 'adopted'
        where id = new.pet_id
          and guardian_id = new.guardian_id;
    elsif new.pet_id is not null then
      update public.pets p
        set status = case
          when exists (
            select 1
            from public.applications concluida
            where concluida.pet_id = new.pet_id
              and concluida.guardian_id = new.guardian_id
              and concluida.id <> new.id
              and concluida.status = 'completed'
          ) then 'adopted'
          when exists (
            select 1
            from public.applications aberta
            where aberta.pet_id = new.pet_id
              and aberta.guardian_id = new.guardian_id
              and aberta.status in ('pending', 'under_review', 'approved')
          ) then 'in_process'
          else 'available'
        end
        where p.id = new.pet_id
          and p.guardian_id = new.guardian_id
          -- Não desfaz uma adoção marcada manualmente. A exceção é a reabertura explícita
          -- de uma candidatura concluída, que precisa recalcular o andamento do pet.
          and (p.status is distinct from 'adopted' or old.status = 'completed');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_applications_registrar_mudanca_status on public.applications;
create trigger trg_applications_registrar_mudanca_status
  after update of status on public.applications
  for each row execute function public.applications_registrar_mudanca_status();

-- Corrige pets de candidaturas que já haviam sido concluídas antes desta sincronização.
update public.pets p
  set status = 'adopted'
  where p.status is distinct from 'adopted'
    and exists (
      select 1
      from public.applications a
      where a.pet_id = p.id
        and a.guardian_id = p.guardian_id
        and a.status = 'completed'
    );

-- 10.6 Criação automática do perfil (profiles) quando um usuário se cadastra.
-- Evita perfil ausente quando o cadastro exige confirmação de e-mail (ainda sem sessão para gravar via RLS).
-- Uma falha é propagada para impedir a criação silenciosa de uma conta sem perfil utilizável.
-- Observação: "verified" nasce sempre falso; a verificação de ONGs deve ser feita pelo administrador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  papel text := case when meta ->> 'role' = 'guardian' then 'guardian' else 'adopter' end;
begin
  insert into public.profiles (
    id, role, name, email, primary_phone,
    cpf, birth_date, profession, social_media,
    guardian_type, document, city, state, neighborhood
  )
  values (
    new.id,
    papel,
    coalesce(nullif(meta ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Usuário'),
    coalesce(new.email, ''),
    meta ->> 'primaryPhone',
    case when papel = 'adopter' then meta ->> 'cpf' end,
    case when papel = 'adopter' then meta ->> 'birthDate' end,
    case when papel = 'adopter' then meta ->> 'profession' end,
    meta ->> 'socialMedia',
    case when papel = 'guardian'
      then case when meta ->> 'guardianType' in ('individual', 'ngo') then meta ->> 'guardianType' else 'ngo' end
    end,
    case when papel = 'guardian' then meta ->> 'document' end,
    meta ->> 'city',
    meta ->> 'state',
    case when papel = 'guardian' then meta ->> 'neighborhood' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10.7 Proteção da tabela profiles: atualiza updated_at automaticamente e impede que o próprio
-- usuário se marque como "verified" pela API (só o painel/admin do Supabase pode alterar esse campo).
create or replace function public.profiles_antes_de_gravar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc'::text, now());

  if coalesce((select auth.jwt() ->> 'role'), '') = 'authenticated' then
    if tg_op = 'INSERT' then
      new.verified := false;
    else
      new.verified := old.verified;
      new.role := old.role;
      new.email := old.email;
      new.cpf := old.cpf;
      if nullif(old.birth_date, '') is not null then
        new.birth_date := old.birth_date;
      end if;
      new.guardian_type := old.guardian_type;
      new.document := old.document;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_antes_de_gravar on public.profiles;
create trigger trg_profiles_antes_de_gravar
  before insert or update on public.profiles
  for each row execute function public.profiles_antes_de_gravar();

-- 10.8 Funções de trigger não devem poder ser chamadas diretamente pela API pública
revoke execute on function public.applications_preencher_dados() from public, anon, authenticated;
revoke execute on function public.applications_proteger_dados_enviados() from public, anon, authenticated;
revoke execute on function public.application_messages_preencher_remetente() from public, anon, authenticated;
revoke execute on function public.applications_marcar_pet_em_processo() from public, anon, authenticated;
revoke execute on function public.atualizar_data_modificacao() from public, anon, authenticated;
revoke execute on function public.applications_validar_transicao_status() from public, anon, authenticated;
revoke execute on function public.applications_registrar_mudanca_status() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.profiles_antes_de_gravar() from public, anon, authenticated;

-- ==============================================================================
-- 11. Exposição explícita da Data API e avatares de perfil
-- Necessário para projetos que não concedem acesso automático às novas tabelas.
-- As políticas RLS acima continuam responsáveis por restringir as linhas.
-- ==============================================================================
grant usage on schema public to anon, authenticated;
grant select on table public.pets to anon;
grant select, insert, update, delete on table public.pets to authenticated;
grant select, insert, update on table public.profiles to authenticated;
revoke delete on table public.profiles from authenticated;
grant select, insert, delete on table public.favorites to authenticated;
grant select, insert on table public.applications to authenticated;
revoke update on table public.applications from authenticated;
grant update (status, guardian_notes) on table public.applications to authenticated;
grant select, insert on table public.application_messages to authenticated;

-- Bucket público somente para a leitura das imagens de perfil já conhecidas por URL.
-- Escrita e remoção continuam limitadas à pasta do próprio usuário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatars: upload na própria pasta" on storage.objects;
create policy "Avatars: upload na própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Avatars: proprietário lê os próprios arquivos" on storage.objects;
create policy "Avatars: proprietário lê os próprios arquivos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())
  );

drop policy if exists "Avatars: proprietário remove os próprios arquivos" on storage.objects;
create policy "Avatars: proprietário remove os próprios arquivos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())
  );

-- Mantém os dados públicos do responsável sincronizados nos anúncios existentes.
create or replace function public.sincronizar_perfil_guardiao_nos_pets()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role = 'guardian' then
    update public.pets
      set guardian_name = new.name,
          guardian_phone = new.primary_phone,
          guardian_email = new.email,
          city = new.city,
          state = new.state,
          neighborhood = new.neighborhood
      where guardian_id = new.id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sincronizar_perfil_guardiao_nos_pets on public.profiles;
create trigger trg_sincronizar_perfil_guardiao_nos_pets
  after update of name, primary_phone, email, city, state, neighborhood on public.profiles
  for each row execute function public.sincronizar_perfil_guardiao_nos_pets();

revoke execute on function public.sincronizar_perfil_guardiao_nos_pets() from public, anon, authenticated;


