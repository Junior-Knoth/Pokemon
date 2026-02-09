-- Remover tabelas existentes se necessário
DROP TABLE IF EXISTS battle_participation CASCADE;
DROP TABLE IF EXISTS battles CASCADE;

-- Tabela de Batalhas
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  opponent_name VARCHAR(100) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('Gym', 'Rival', 'Elite Four', 'Lore')),
  result VARCHAR(10) NOT NULL CHECK (result IN ('Win', 'Loss')),
  lore TEXT,
  battle_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Participação em Batalhas
CREATE TABLE battle_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  pokemon_id UUID NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level > 0 AND level <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_id, pokemon_id)
);

-- Índices para performance
CREATE INDEX idx_battles_game_id ON battles(game_id);
CREATE INDEX idx_battles_date ON battles(battle_date DESC);
CREATE INDEX idx_battle_participation_battle ON battle_participation(battle_id);
CREATE INDEX idx_battle_participation_pokemon ON battle_participation(pokemon_id);

-- Comentários
COMMENT ON TABLE battles IS 'Registro de batalhas do treinador';
COMMENT ON TABLE battle_participation IS 'Pokémon que participaram de cada batalha';
COMMENT ON COLUMN battles.event_type IS 'Tipo de evento: Gym, Rival, Elite Four, Lore';
COMMENT ON COLUMN battles.result IS 'Resultado da batalha: Win ou Loss';
COMMENT ON COLUMN battle_participation.level IS 'Nível do Pokémon durante a batalha';
