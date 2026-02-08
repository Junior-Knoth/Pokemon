-- 1. Habilitar a extensão para gerar UUIDs automáticos
create extension if not exists "uuid-ossp";

-- 2. TABELA DE JOGOS (Ex: Sword, Scarlet, Emerald)
create table games (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null, -- ex: Pokémon Sword
  region text, -- ex: Galar
  platform text, -- ex: Nintendo Switch
  created_at timestamp with time zone default now()
);

-- 3. TABELA DE POKÉMONS (Sua Box Global)
create table pokemons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  game_id uuid references games(id) on delete cascade not null,
  nickname text not null, -- ex: Freddie
  species_name text not null, -- ex: toxtricity (para bater na PokeAPI)
  caught_at text, -- ex: Route 4
  is_active boolean default true, -- Se está no time atual
  created_at timestamp with time zone default now()
);

-- 4. TABELA DE BATALHAS (Ginásios, Rivals, etc)
create table battles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  game_id uuid references games(id) on delete cascade not null,
  opponent_name text not null, -- ex: Piers
  event_type text check (event_type in ('Gym', 'Rival', 'Elite Four', 'Lore', 'Titan', 'Legendary')),
  result text check (result in ('Win', 'Loss', 'Draw')) default 'Win',
  lore_text text, -- Onde você escreve como foi a luta
  battle_date timestamp with time zone default now()
);

-- 5. TABELA DE PARTICIPAÇÃO (Quais Pokémon lutaram e como estavam)
create table battle_participation (
  id uuid primary key default uuid_generate_v4(),
  battle_id uuid references battles(id) on delete cascade not null,
  pokemon_id uuid references pokemons(id) on delete cascade not null,
  level_at_time int,
  moveset jsonb, -- Salva array de golpes: ["Dig", "Crunch", "etc"]
  is_mvp boolean default false
);

-- CONFIGURAÇÃO DE RLS (SEGURANÇA)
-- Habilitar RLS em todas as tabelas
alter table games enable row level security;
alter table pokemons enable row level security;
alter table battles enable row level security;
alter table battle_participation enable row level security;

-- Criar políticas para que apenas o dono dos dados possa vê-los e editá-los
-- Nota: "auth.uid()" pega o ID do usuário logado no momento.

create policy "Users can manage their own games" on games
  for all using (auth.uid() = user_id);

create policy "Users can manage their own pokemons" on pokemons
  for all using (auth.uid() = user_id);

create policy "Users can manage their own battles" on battles
  for all using (auth.uid() = user_id);

-- Para a participação, a segurança vem através das tabelas pai (battles/pokemons)
create policy "Users can manage battle participation" on battle_participation
  for all using (
    exists (
      select 1 from battles where battles.id = battle_participation.battle_id 
      and battles.user_id = auth.uid()
    )
  );