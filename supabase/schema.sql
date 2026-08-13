-- Gestão Inteligente — schema núcleo (fase 1)
-- Clientes, Obras, Orçamentos, Financeiro, Almoxarifado, RDO, Config da empresa
-- Todas as tabelas usam owner_id (auth.uid()) + RLS para isolar dados por usuário.

create extension if not exists "pgcrypto";

-- ========== CONFIG DA EMPRESA ==========
create table if not exists empresa_config (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  nome_empresa text,
  nome_curto text,
  cor_primaria text default '#0f2e5e',
  cor_secundaria text default '#1f4f95',
  logo_url text,
  cnpj text,
  telefone text,
  email text,
  site text,
  endereco text,
  slogan text,
  responsavel_tecnico text,
  crea_cau text,
  recados text,
  podcast_link text,
  updated_at timestamptz default now()
);

-- ========== CLIENTES ==========
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text default 'Pessoa Física',
  status text default 'Ativo',
  cpf_cnpj text,
  rg_ie text,
  telefone text,
  telefone2 text,
  email text,
  responsavel_contato text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  origem text,
  observacoes text,
  created_at timestamptz default now()
);

-- ========== OBRAS ==========
create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cliente_id uuid references clientes(id) on delete set null,
  status text default 'Em andamento',
  area_construida numeric,
  endereco text,
  observacoes text,
  created_at timestamptz default now()
);

-- ========== COMPOSIÇÕES CUSTOM (a base SINAPI fica estática no front-end) ==========
create table if not exists composicoes_custom (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  codigo text,
  base text default 'CUSTOM',
  descricao text not null,
  unidade text,
  custo numeric default 0,
  categoria text,
  created_at timestamptz default now()
);

-- ========== ORÇAMENTOS ==========
create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid references obras(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  numero text,
  titulo text not null,
  status text default 'Rascunho',
  bdi_perc numeric default 0,
  taxa_adm_perc numeric default 0,
  created_at timestamptz default now()
);

create table if not exists orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  orcamento_id uuid not null references orcamentos(id) on delete cascade,
  composicao_id uuid,
  descricao text not null,
  unidade text,
  quantidade numeric default 0,
  custo_unitario numeric default 0,
  created_at timestamptz default now()
);

-- ========== ALMOXARIFADO ==========
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  unidade text,
  codigo text,
  minimo numeric default 0,
  custo numeric default 0,
  created_at timestamptz default now()
);

create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid references produtos(id) on delete cascade,
  obra_id uuid references obras(id) on delete set null,
  tipo text check (tipo in ('entrada','saida')) not null,
  quantidade numeric not null default 0,
  valor numeric default 0,
  data date default current_date,
  observacoes text,
  created_at timestamptz default now()
);

-- ========== FINANCEIRO ==========
create table if not exists financeiro (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tipo text check (tipo in ('pagar','receber')) not null,
  descricao text not null,
  obra_id uuid references obras(id) on delete set null,
  data date default current_date,
  valor numeric default 0,
  status text default 'aberto',
  created_at timestamptz default now()
);

create table if not exists bdis (
  owner_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references obras(id) on delete cascade,
  adm_central numeric default 0,
  adm_local numeric default 0,
  lucro numeric default 0,
  primary key (obra_id)
);

-- ========== RDO ==========
create table if not exists rdos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid references obras(id) on delete cascade,
  data date default current_date,
  clima text,
  praticabilidade text,
  equipe jsonb default '[]',
  empreiteiros jsonb default '[]',
  atividades text,
  ocorrencias text,
  fotos jsonb default '[]',
  created_at timestamptz default now()
);

-- ========== ROW LEVEL SECURITY ==========
alter table empresa_config enable row level security;
alter table clientes enable row level security;
alter table obras enable row level security;
alter table composicoes_custom enable row level security;
alter table orcamentos enable row level security;
alter table orcamento_itens enable row level security;
alter table produtos enable row level security;
alter table movimentacoes enable row level security;
alter table financeiro enable row level security;
alter table bdis enable row level security;
alter table rdos enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'empresa_config','clientes','obras','composicoes_custom','orcamentos',
    'orcamento_itens','produtos','movimentacoes','financeiro','bdis','rdos'
  ])
  loop
    execute format('drop policy if exists "owner_all_%1$s" on %1$I', t);
    execute format(
      'create policy "owner_all_%1$s" on %1$I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t
    );
  end loop;
end $$;
