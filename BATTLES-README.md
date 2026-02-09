# Sistema de Batalhas - Guia de Instalação

## 📋 Passos para Configuração

### 1. Criar as Tabelas no Supabase

1. Acesse seu projeto no Supabase
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `battles-schema.sql`
5. Clique em **Run** para executar o script

### 2. Verificar as Tabelas

Após executar o SQL, você deve ter:

- **battles**: Tabela principal de batalhas
  - Campos: id, game_id, opponent_name, event_type, result, lore, battle_date
- **battle_participation**: Registros de participação
  - Campos: id, battle_id, pokemon_id, level

### 3. Funcionalidades Implementadas

✅ **Página de Batalhas** (`/battles`)

- Timeline com visual de diário de jornada
- Cards mostrando batalhas do jogo ativo

✅ **Formulário de Nova Batalha**

- Nome do Oponente
- Tipo de Evento (Gym 🏛️, Rival ⚔️, Elite Four 👑, Lore 📖)
- Resultado (Win ✅ / Loss ❌)
- Textarea para Lore da batalha

✅ **Seleção de Pokémon**

- Lista dos Pokémon do jogo atual
- Checkboxes para selecionar participantes
- Limite de 6 Pokémon por batalha
- Campo de nível individual para cada participante

✅ **Salvamento em Duas Etapas**

- Primeiro cria o registro em `battles`
- Depois usa o `battle_id` para salvar em `battle_participation`

✅ **Timeline Visual**

- Cards com mini-sprites dos participantes
- Ícones por tipo de evento
- Badge de vitória/derrota
- Data da batalha

✅ **Expansão de Lore**

- Clique no card para expandir
- Mostra o texto completo da história
- Animação suave de expansão

### 4. Como Usar

1. Selecione um jogo no contexto (página Pokémon)
2. Navegue para "Batalhas" no Dashboard
3. Clique em "+ Nova Batalha"
4. Preencha os dados da batalha
5. Selecione os Pokémon que participaram (máx. 6)
6. Defina o nível de cada participante
7. Clique em "Registrar Batalha"

### 5. Estilização

O sistema usa **CSS Modules** com tema escuro:

- Visual de diário de jornada
- Timeline vertical com linha do tempo
- Cards com efeito hover
- Cores por resultado (verde = vitória, vermelho = derrota)
- Animações suaves

### 6. Navegação

- Dashboard → Ver Batalhas
- Página Batalhas → Botão Voltar
- Integrado com PokemonContext (jogo ativo)

---

## 🎮 Próximos Passos Sugeridos

- Filtros por tipo de evento
- Estatísticas (taxa de vitória, Pokémon mais usado)
- Edição/exclusão de batalhas
- Exportar diário de batalhas
