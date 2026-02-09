import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { usePokemon } from "../../context/PokemonContext";
import styles from "./Battles.module.css";

interface Game {
  id: string;
  name: string;
}

interface Pokemon {
  id: string;
  nickname: string;
  species_name: string;
  sprite_url: string;
}

interface OpponentPokemon {
  species: string;
  sprite_url: string;
}

type MatchupStatus = "won" | "lost" | "switched";

interface Matchup {
  id: string;
  myPokemon: Pokemon | null;
  opponentPokemon: OpponentPokemon | null;
  status: MatchupStatus;
}

interface BattleLog {
  matchups: Array<{
    myPokemon: {
      id: string;
      nickname: string;
      species_name: string;
      sprite_url: string;
    };
    opponentPokemon: {
      species: string;
      sprite_url: string;
    };
    status: MatchupStatus;
  }>;
  mvpPokemonId?: string;
}

interface Battle {
  id: string;
  opponent_name: string;
  event_type: "Gym" | "Rival" | "Elite Four" | "Lore";
  result: "Win" | "Loss";
  lore: string | null;
  battle_date: string;
  participants: Array<{
    pokemon_id: string;
    level: number;
    pokemon: Pokemon;
  }>;
  battle_log?: BattleLog;
}

const EVENT_ICONS = {
  Gym: "🏛️",
  Rival: "⚔️",
  "Elite Four": "👑",
  Lore: "📖",
};

interface BattlesProps {
  onNavigate?: (view: string) => void;
}

export function Battles({ onNavigate }: BattlesProps) {
  const { activeGameId, setActiveGameId } = usePokemon();
  const [games, setGames] = useState<Game[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [gamePokemons, setGamePokemons] = useState<Pokemon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedBattleId, setExpandedBattleId] = useState<string | null>(null);
  const [expandedCombatLogs, setExpandedCombatLogs] = useState<Set<string>>(
    new Set(),
  );

  // Form states
  const [opponentName, setOpponentName] = useState("");
  const [eventType, setEventType] = useState<
    "Gym" | "Rival" | "Elite Four" | "Lore"
  >("Gym");
  const [result, setResult] = useState<"Win" | "Loss">("Win");
  const [matchups, setMatchups] = useState<Matchup[]>([
    {
      id: crypto.randomUUID(),
      myPokemon: null,
      opponentPokemon: null,
      status: "won",
    },
  ]);
  const [mvpPokemonId, setMvpPokemonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBattleId, setEditingBattleId] = useState<string | null>(null);

  // Modal de seleção de Pokémon
  const [isSelectingPokemon, setIsSelectingPokemon] = useState(false);
  const [selectedMatchupId, setSelectedMatchupId] = useState<string | null>(
    null,
  );
  const [pokemonSearchQuery, setPokemonSearchQuery] = useState("");

  // Filtro de oponente
  const [opponentFilter, setOpponentFilter] = useState("");

  // Estado para verificação de oponente
  const [verifyingOpponent, setVerifyingOpponent] = useState<string | null>(
    null,
  );

  const handleGoBack = () => {
    if (onNavigate) {
      onNavigate("dashboard");
    } else {
      window.history.back();
    }
  };
  // Carregar lista de jogos
  useEffect(() => {
    fetchGames();
  }, []);
  // Carregar Pokémon do jogo atual
  useEffect(() => {
    console.log("Active Game ID:", activeGameId);
    if (activeGameId) {
      loadGamePokemons();
    } else {
      setGamePokemons([]);
    }
  }, [activeGameId]);

  // Carregar batalhas do jogo atual
  useEffect(() => {
    if (activeGameId) {
      loadBattles();
    }
  }, [activeGameId]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGames(data || []);

      // Se tiver activeGameId salvo mas o jogo não existir mais, limpar
      if (activeGameId && data && !data.some((g) => g.id === activeGameId)) {
        setActiveGameId(null);
      }
    } catch (err) {
      console.error("Erro ao carregar jogos:", err);
    }
  };

  const loadGamePokemons = async () => {
    if (!activeGameId) {
      setGamePokemons([]);
      return;
    }

    const { data, error } = await supabase
      .from("pokemons")
      .select("id, nickname, species_name, sprite_url")
      .eq("game_id", activeGameId)
      .order("nickname");

    if (error) {
      console.error("Erro ao carregar Pokémon:", error);
      return;
    }

    console.log("Pokémon carregados:", data);
    setGamePokemons(data || []);
  };

  const loadBattles = async () => {
    if (!activeGameId) return;

    const { data, error } = await supabase
      .from("battles")
      .select(
        `
        id,
        opponent_name,
        event_type,
        result,
        lore,
        battle_date,
        battle_participation (
          pokemon_id,
          level,
          pokemons (
            id,
            nickname,
            species_name,
            sprite_url
          )
        )
      `,
      )
      .eq("game_id", activeGameId)
      .order("battle_date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar batalhas:", error);
      return;
    }

    // Transformar dados para o formato esperado
    const formattedBattles = (data || []).map((battle) => ({
      ...battle,
      participants: battle.battle_participation.map((p: any) => ({
        pokemon_id: p.pokemon_id,
        level: p.level,
        pokemon: p.pokemons,
      })),
      battle_log: battle.lore ? tryParseBattleLog(battle.lore) : undefined,
    }));

    setBattles(formattedBattles);
  };

  const tryParseBattleLog = (lore: string): BattleLog | undefined => {
    try {
      const parsed = JSON.parse(lore);
      if (parsed.matchups && Array.isArray(parsed.matchups)) {
        return parsed as BattleLog;
      }
    } catch {
      // Se não for JSON, retorna undefined
    }
    return undefined;
  };

  // Funções de manipulação de matchups
  const addMatchup = () => {
    setMatchups([
      ...matchups,
      {
        id: crypto.randomUUID(),
        myPokemon: null,
        opponentPokemon: null,
        status: "won",
      },
    ]);
  };

  const removeMatchup = (id: string) => {
    if (matchups.length === 1) return; // Manter pelo menos um
    setMatchups(matchups.filter((m) => m.id !== id));

    // Se o Pokémon removido era o MVP, limpar MVP
    const removedMatchup = matchups.find((m) => m.id === id);
    if (
      removedMatchup?.myPokemon &&
      mvpPokemonId === removedMatchup.myPokemon.id
    ) {
      setMvpPokemonId(null);
    }
  };

  const updateMatchupStatus = (matchupId: string, status: MatchupStatus) => {
    setMatchups(
      matchups.map((m) => (m.id === matchupId ? { ...m, status } : m)),
    );
  };

  const toggleMvp = (pokemonId: string) => {
    setMvpPokemonId(mvpPokemonId === pokemonId ? null : pokemonId);
  };

  const clearOpponent = (matchupId: string) => {
    setMatchups(
      matchups.map((m) =>
        m.id === matchupId ? { ...m, opponentPokemon: null } : m,
      ),
    );
  };

  const openPokemonSelector = (matchupId: string) => {
    setSelectedMatchupId(matchupId);
    setIsSelectingPokemon(true);
    setPokemonSearchQuery("");
  };

  const selectMyPokemon = (pokemon: Pokemon) => {
    setMatchups(
      matchups.map((m) =>
        m.id === selectedMatchupId ? { ...m, myPokemon: pokemon } : m,
      ),
    );
    setIsSelectingPokemon(false);
    setSelectedMatchupId(null);
  };

  const verifyOpponent = async (matchupId: string, speciesName: string) => {
    if (!speciesName.trim()) return;

    setVerifyingOpponent(matchupId);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${speciesName.toLowerCase()}`,
      );

      if (!response.ok) {
        alert("Pokémon não encontrado na PokéAPI!");
        return;
      }

      const data = await response.json();
      const opponentPokemon: OpponentPokemon = {
        species: data.name,
        sprite_url:
          data.sprites.front_default ||
          data.sprites.other?.["official-artwork"]?.front_default,
      };

      setMatchups(
        matchups.map((m) =>
          m.id === matchupId ? { ...m, opponentPokemon } : m,
        ),
      );
    } catch (error) {
      console.error("Erro ao buscar Pokémon:", error);
      alert("Erro ao verificar Pokémon!");
    } finally {
      setVerifyingOpponent(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeGameId) {
      alert("Selecione um jogo primeiro!");
      return;
    }

    // Validar matchups
    const validMatchups = matchups.filter(
      (m) => m.myPokemon && m.opponentPokemon,
    );

    if (validMatchups.length === 0) {
      alert(
        "Adicione pelo menos um confronto completo (seu Pokémon vs Oponente)!",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Criar battle_log JSON
      const battleLog: BattleLog = {
        matchups: validMatchups.map((m) => ({
          myPokemon: {
            id: m.myPokemon!.id,
            nickname: m.myPokemon!.nickname,
            species_name: m.myPokemon!.species_name,
            sprite_url: m.myPokemon!.sprite_url,
          },
          opponentPokemon: {
            species: m.opponentPokemon!.species,
            sprite_url: m.opponentPokemon!.sprite_url,
          },
          status: m.status,
        })),
        mvpPokemonId: mvpPokemonId || undefined,
      };

      let battleData;

      if (editingBattleId) {
        // Modo edição: Atualizar batalha existente
        const { data, error: battleError } = await supabase
          .from("battles")
          .update({
            opponent_name: opponentName,
            event_type: eventType,
            result: result,
            lore: JSON.stringify(battleLog),
          })
          .eq("id", editingBattleId)
          .select()
          .single();

        if (battleError) throw battleError;
        battleData = data;

        // Deletar participações antigas
        await supabase
          .from("battle_participation")
          .delete()
          .eq("battle_id", editingBattleId);
      } else {
        // Modo criação: Inserir nova batalha
        const { data, error: battleError } = await supabase
          .from("battles")
          .insert({
            game_id: activeGameId,
            opponent_name: opponentName,
            event_type: eventType,
            result: result,
            lore: JSON.stringify(battleLog),
          })
          .select()
          .single();

        if (battleError) throw battleError;
        battleData = data;
      }

      // Etapa 2: Criar registros de participação (Pokémon únicos do meu time)
      const uniquePokemonIds = [
        ...new Set(validMatchups.map((m) => m.myPokemon!.id)),
      ];

      const participations = uniquePokemonIds.map((pokemon_id) => ({
        battle_id: battleData.id,
        pokemon_id,
        level: 50, // Nível padrão
      }));

      const { error: participationError } = await supabase
        .from("battle_participation")
        .insert(participations);

      if (participationError) throw participationError;

      alert(
        editingBattleId
          ? "Batalha atualizada com sucesso!"
          : "Batalha registrada com sucesso!",
      );
      setIsFormOpen(false);
      resetForm();
      loadBattles(); // Recarregar batalhas
    } catch (error) {
      console.error("Erro ao salvar batalha:", error);
      alert("Erro ao salvar batalha!");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBattleExpansion = (battleId: string) => {
    setExpandedBattleId(expandedBattleId === battleId ? null : battleId);
  };

  const toggleCombatLog = (battleId: string) => {
    setExpandedCombatLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(battleId)) {
        newSet.delete(battleId);
      } else {
        newSet.add(battleId);
      }
      return newSet;
    });
  };

  const downloadBattleSummary = (battle: Battle) => {
    const date = new Date(battle.battle_date).toLocaleDateString("pt-BR");
    const resultText = battle.result === "Win" ? "VITÓRIA" : "DERROTA";
    
    let summary = `=== RESUMO DE BATALHA ===\n\n`;
    summary += `Oponente: ${battle.opponent_name}\n`;
    summary += `Tipo: ${battle.event_type}\n`;
    summary += `Resultado: ${resultText}\n`;
    summary += `Data: ${date}\n`;
    summary += `\n=== CONFRONTOS ===\n\n`;

    if (battle.battle_log && battle.battle_log.matchups.length > 0) {
      battle.battle_log.matchups.forEach((matchup, index) => {
        const myPokeName = matchup.myPokemon.nickname || matchup.myPokemon.species_name;
        const oppPokeName = matchup.opponentPokemon.species;
        const statusText = 
          matchup.status === "won" ? "VENCEU" : 
          matchup.status === "lost" ? "DERROTADO" : 
          "TROCADO";
        
        const mvpMark = battle.battle_log?.mvpPokemonId === matchup.myPokemon.id ? " ⭐ MVP" : "";
        
        summary += `${index + 1}. ${myPokeName}${mvpMark} VS ${oppPokeName} → ${statusText}\n`;
      });

      if (battle.battle_log.mvpPokemonId) {
        const mvpMatchup = battle.battle_log.matchups.find(
          m => m.myPokemon.id === battle.battle_log!.mvpPokemonId
        );
        if (mvpMatchup) {
          const mvpName = mvpMatchup.myPokemon.nickname || mvpMatchup.myPokemon.species_name;
          summary += `\n=== DESTAQUE ===\nMVP: ${mvpName}\n`;
        }
      }
    } else if (battle.participants.length > 0) {
      summary += "Participantes:\n";
      battle.participants.forEach((p, index) => {
        const pokeName = p.pokemon.nickname || p.pokemon.species_name;
        summary += `${index + 1}. ${pokeName} (Nível ${p.level})\n`;
      });
    }

    if (battle.lore && !battle.battle_log) {
      summary += `\n=== HISTÓRIA ===\n${battle.lore}\n`;
    }

    summary += `\n=== FIM DO RESUMO ===`;

    // Criar e baixar arquivo
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batalha_${battle.opponent_name.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openEditForm = (battle: Battle) => {
    setEditingBattleId(battle.id);
    setOpponentName(battle.opponent_name);
    setEventType(battle.event_type);
    setResult(battle.result);

    // Reconstruir matchups do battle_log
    if (battle.battle_log && battle.battle_log.matchups.length > 0) {
      const reconstructedMatchups: Matchup[] = battle.battle_log.matchups.map(
        (m) => ({
          id: crypto.randomUUID(),
          myPokemon: {
            id: m.myPokemon.id,
            nickname: m.myPokemon.nickname,
            species_name: m.myPokemon.species_name,
            sprite_url: m.myPokemon.sprite_url,
          },
          opponentPokemon: {
            species: m.opponentPokemon.species,
            sprite_url: m.opponentPokemon.sprite_url,
          },
          status: m.status,
        }),
      );
      setMatchups(reconstructedMatchups);
      setMvpPokemonId(battle.battle_log.mvpPokemonId || null);
    } else {
      // Fallback: criar matchup vazio
      setMatchups([
        {
          id: crypto.randomUUID(),
          myPokemon: null,
          opponentPokemon: null,
          status: "won",
        },
      ]);
      setMvpPokemonId(null);
    }

    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingBattleId(null);
    setOpponentName("");
    setEventType("Gym");
    setResult("Win");
    setMatchups([
      {
        id: crypto.randomUUID(),
        myPokemon: null,
        opponentPokemon: null,
        status: "won",
      },
    ]);
    setMvpPokemonId(null);
  };

  const deleteBattle = async (battleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta batalha?")) return;

    try {
      const { error } = await supabase
        .from("battles")
        .delete()
        .eq("id", battleId);

      if (error) throw error;

      setBattles(battles.filter((b) => b.id !== battleId));
      alert("Batalha excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir batalha:", error);
      alert("Erro ao excluir batalha!");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleGoBack}>
            ← Voltar
          </button>
          <h1 className={styles.title}>📜 Diário de Batalhas</h1>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.filterGroup}>
            <label htmlFor="game-filter" className={styles.filterLabel}>
              Jogo:
            </label>
            <select
              id="game-filter"
              value={activeGameId || ""}
              onChange={(e) => setActiveGameId(e.target.value || null)}
              className={styles.select}
            >
              <option value="">Selecione um jogo</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="opponent-filter" className={styles.filterLabel}>
              Oponente:
            </label>
            <input
              id="opponent-filter"
              type="text"
              placeholder="Buscar por oponente..."
              value={opponentFilter}
              onChange={(e) => setOpponentFilter(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            className={styles.addButton}
            onClick={() => {
              if (!activeGameId) {
                alert("Selecione um jogo primeiro!");
                return;
              }
              resetForm();
              setIsFormOpen(true);
            }}
          >
            + Nova Batalha
          </button>
        </div>
      </header>

      {/* Formulário Modal */}
      {isFormOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>
                  {editingBattleId
                    ? "Editar Batalha"
                    : "Registrar Nova Batalha"}
                </h2>
                {activeGameId && (
                  <p className={styles.gameIndicator}>
                    🎮{" "}
                    {games.find((g) => g.id === activeGameId)?.name ||
                      "Jogo Selecionado"}
                  </p>
                )}
              </div>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="opponent">Nome do Oponente</label>
                  <input
                    id="opponent"
                    type="text"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    required
                    placeholder="Ex: Brock, Gary, Lance..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="eventType">Tipo de Evento</label>
                  <select
                    id="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                  >
                    <option value="Gym">🏛️ Gym</option>
                    <option value="Rival">⚔️ Rival</option>
                    <option value="Elite Four">👑 Elite Four</option>
                    <option value="Lore">📖 Lore</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="result">Resultado</label>
                  <select
                    id="result"
                    value={result}
                    onChange={(e) => setResult(e.target.value as any)}
                  >
                    <option value="Win">✅ Vitória</option>
                    <option value="Loss">❌ Derrota</option>
                  </select>
                </div>
              </div>

              {/* Seção de Matchups */}
              <div className={styles.matchupsSection}>
                <div className={styles.matchupsSectionHeader}>
                  <h3>Log de Confrontos</h3>
                  <button
                    type="button"
                    className={styles.addMatchupButton}
                    onClick={addMatchup}
                  >
                    + Adicionar Matchup
                  </button>
                </div>

                <div className={styles.matchupsList}>
                  {matchups.map((matchup, index) => (
                    <div key={matchup.id} className={styles.matchupRow}>
                      <span className={styles.matchupNumber}>#{index + 1}</span>

                      {/* Botão MVP - Movido para a esquerda */}
                      {matchup.myPokemon && (
                        <button
                          type="button"
                          className={`${styles.mvpButton} ${
                            mvpPokemonId === matchup.myPokemon.id
                              ? styles.mvpActive
                              : ""
                          }`}
                          onClick={() => toggleMvp(matchup.myPokemon!.id)}
                          title="Marcar como MVP"
                        >
                          ⭐
                        </button>
                      )}

                      {/* Meu Pokémon */}
                      <div className={styles.matchupSlot}>
                        {matchup.myPokemon ? (
                          <div className={styles.selectedPokemon}>
                            <img
                              src={matchup.myPokemon.sprite_url}
                              alt={
                                matchup.myPokemon.nickname ||
                                matchup.myPokemon.species_name
                              }
                              className={styles.matchupSprite}
                            />
                            <span className={styles.matchupName}>
                              {matchup.myPokemon.nickname ||
                                matchup.myPokemon.species_name}
                            </span>
                            <button
                              type="button"
                              className={styles.changeButton}
                              onClick={() => openPokemonSelector(matchup.id)}
                            >
                              Trocar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.selectButton}
                            onClick={() => openPokemonSelector(matchup.id)}
                          >
                            Selecionar Meu Pokémon
                          </button>
                        )}
                      </div>

                      {/* VS */}
                      <div className={styles.vsIndicator}>VS</div>

                      {/* Pokémon Oponente */}
                      <div className={styles.matchupSlot}>
                        {matchup.opponentPokemon ? (
                          <div className={styles.selectedPokemon}>
                            <img
                              src={matchup.opponentPokemon.sprite_url}
                              alt={matchup.opponentPokemon.species}
                              className={styles.matchupSprite}
                            />
                            <span className={styles.matchupName}>
                              {matchup.opponentPokemon.species}
                            </span>
                            <button
                              type="button"
                              className={styles.changeButton}
                              onClick={() => clearOpponent(matchup.id)}
                            >
                              Trocar
                            </button>
                          </div>
                        ) : (
                          <div className={styles.opponentInputGroup}>
                            <input
                              type="text"
                              placeholder="Nome da espécie..."
                              className={styles.opponentInput}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  verifyOpponent(
                                    matchup.id,
                                    e.currentTarget.value,
                                  );
                                }
                              }}
                            />
                            <button
                              type="button"
                              className={styles.verifyButton}
                              disabled={verifyingOpponent === matchup.id}
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                verifyOpponent(matchup.id, input.value);
                              }}
                            >
                              {verifyingOpponent === matchup.id ? "..." : "✓"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status do Matchup - Movido para o lado direito */}
                      {matchup.myPokemon && matchup.opponentPokemon && (
                        <div className={styles.statusSelectorRight}>
                          <button
                            type="button"
                            className={`${styles.statusButton} ${
                              matchup.status === "won" ? styles.active : ""
                            }`}
                            onClick={() =>
                              updateMatchupStatus(matchup.id, "won")
                            }
                            title="Venceu"
                          >
                            ✅
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusButton} ${
                              matchup.status === "lost" ? styles.active : ""
                            }`}
                            onClick={() =>
                              updateMatchupStatus(matchup.id, "lost")
                            }
                            title="Derrotado"
                          >
                            ❌
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusButton} ${
                              matchup.status === "switched" ? styles.active : ""
                            }`}
                            onClick={() =>
                              updateMatchupStatus(matchup.id, "switched")
                            }
                            title="Trocado"
                          >
                            🔄
                          </button>
                        </div>
                      )}

                      {/* Botão Remover */}
                      {matchups.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeMatchupButton}
                          onClick={() => removeMatchup(matchup.id)}
                          title="Remover matchup"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading
                    ? editingBattleId
                      ? "Atualizando..."
                      : "Registrando..."
                    : editingBattleId
                      ? "Atualizar Batalha"
                      : "Registrar Batalha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Pokémon */}
      {isSelectingPokemon && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsSelectingPokemon(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Selecionar Meu Pokémon</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsSelectingPokemon(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.pokemonSelectorBody}>
              {/* Barra de Busca */}
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Buscar por apelido ou espécie..."
                  value={pokemonSearchQuery}
                  onChange={(e) => setPokemonSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
              </div>

              {/* Lista de Pokémon */}
              <div className={styles.pokemonSelectorList}>
                {gamePokemons
                  .filter((p) => {
                    const query = pokemonSearchQuery.toLowerCase();
                    return (
                      p.nickname.toLowerCase().includes(query) ||
                      p.species_name.toLowerCase().includes(query)
                    );
                  })
                  .map((pokemon) => {
                    const displayName =
                      pokemon.nickname || pokemon.species_name;
                    return (
                      <div
                        key={pokemon.id}
                        className={styles.pokemonSelectorItem}
                        onClick={() => selectMyPokemon(pokemon)}
                      >
                        <img
                          src={pokemon.sprite_url}
                          alt={displayName}
                          className={styles.pokemonSelectorSprite}
                        />
                        <div className={styles.pokemonSelectorInfo}>
                          <span className={styles.pokemonSelectorName}>
                            {displayName}
                          </span>
                          {pokemon.nickname && (
                            <span className={styles.pokemonSelectorSpecies}>
                              ({pokemon.species_name})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline de Batalhas */}
      <div className={styles.timeline}>
        {!activeGameId ? (
          <div className={styles.emptyTimeline}>
            <p>Selecione um jogo para visualizar suas batalhas.</p>
          </div>
        ) : battles.length === 0 ? (
          <div className={styles.emptyTimeline}>
            <p>Nenhuma batalha registrada ainda.</p>
            <p>Clique em "Nova Batalha" para começar seu diário!</p>
          </div>
        ) : (
          battles
            .filter((battle) =>
              battle.opponent_name
                .toLowerCase()
                .includes(opponentFilter.toLowerCase()),
            )
            .map((battle) => {
              const isCombatLogExpanded = expandedCombatLogs.has(battle.id);
              const hasCombatLog =
                battle.battle_log && battle.battle_log.matchups.length > 0;

              return (
                <div key={battle.id} className={styles.battleCard}>
                  {/* Header Compacto em Uma Linha */}
                  <div className={styles.battleHeaderCompact}>
                    <div className={styles.headerLeftSection}>
                      <span className={styles.eventIconCompact}>
                        {EVENT_ICONS[battle.event_type]}
                      </span>
                      <h3 className={styles.opponentNameCompact}>
                        {battle.opponent_name}
                      </h3>
                      <span className={styles.eventBadgeCompact}>
                        {battle.event_type}
                      </span>
                    </div>

                    <div className={styles.headerRightSection}>
                      <span
                        className={`${styles.resultBadgeCompact} ${styles[battle.result.toLowerCase()]}`}
                      >
                        {battle.result === "Win" ? "✅" : "❌"}
                      </span>
                      <span className={styles.battleDateCompact}>
                        {new Date(battle.battle_date).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "2-digit" },
                        )}
                      </span>
                      <div className={styles.battleActionsCompact}>
                        <button
                          className={styles.downloadButtonCompact}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadBattleSummary(battle);
                          }}
                          title="Baixar resumo para IA"
                        >
                          📥
                        </button>
                        <button
                          className={styles.editButtonCompact}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(battle);
                          }}
                          title="Editar batalha"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.deleteButtonCompact}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBattle(battle.id);
                          }}
                          title="Excluir batalha"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Combat Log Compacto e Colapsável */}
                  {hasCombatLog && (
                    <>
                      <button
                        className={styles.toggleCombatLogButton}
                        onClick={() => toggleCombatLog(battle.id)}
                      >
                        <span className={styles.toggleIcon}>
                          {isCombatLogExpanded ? "▼" : "▶"}
                        </span>
                        Combat Log
                        <span className={styles.matchupCount}>
                          ({battle.battle_log!.matchups.length})
                        </span>
                      </button>

                      {isCombatLogExpanded && (
                        <div className={styles.combatLogCompact}>
                          <div className={styles.combatLogHeader}>
                            ⚔ COMBAT LOG ⚔
                          </div>
                          {battle.battle_log!.matchups.map((matchup, index) => {
                            const isMvp =
                              battle.battle_log?.mvpPokemonId &&
                              matchup.myPokemon.id ===
                                battle.battle_log.mvpPokemonId;

                            return (
                              <div
                                key={index}
                                className={styles.matchupRowCompact}
                              >
                                {/* Meu Pokémon com Status Círculo */}
                                <div className={styles.myPokemonSection}>
                                  <div className={styles.spriteWithStatus}>
                                    <img
                                      src={matchup.myPokemon.sprite_url}
                                      alt={
                                        matchup.myPokemon.nickname ||
                                        matchup.myPokemon.species_name
                                      }
                                      className={`${styles.spriteCompact} ${
                                        isMvp ? styles.mvpSpriteCompact : ""
                                      }`}
                                    />
                                    {matchup.status && (
                                      <span
                                        className={`${styles.statusCircle} ${
                                          styles[matchup.status]
                                        }`}
                                        title={
                                          matchup.status === "won"
                                            ? "Venceu"
                                            : matchup.status === "lost"
                                              ? "Derrotado"
                                              : "Trocado"
                                        }
                                      >
                                        {matchup.status === "won" && "✓"}
                                        {matchup.status === "lost" && "✗"}
                                        {matchup.status === "switched" && "↻"}
                                      </span>
                                    )}
                                  </div>
                                  <span className={styles.pokemonNameCompact}>
                                    {matchup.myPokemon.nickname ||
                                      matchup.myPokemon.species_name}
                                    {isMvp && (
                                      <span className={styles.mvpBadgeCompact}>
                                        ⭐
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* VS */}
                                <div className={styles.vsCompact}>VS</div>

                                {/* Pokémon Oponente */}
                                <div className={styles.opponentPokemonSection}>
                                  <img
                                    src={matchup.opponentPokemon.sprite_url}
                                    alt={matchup.opponentPokemon.species}
                                    className={styles.spriteCompact}
                                  />
                                  <span className={styles.pokemonNameCompact}>
                                    {matchup.opponentPokemon.species}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Fallback para batalhas antigas sem battle_log */}
                  {!hasCombatLog && battle.participants.length > 0 && (
                    <div className={styles.participants}>
                      {battle.participants.map((p) => {
                        const pokemonName =
                          p.pokemon.nickname || p.pokemon.species_name;
                        return (
                          <div
                            key={p.pokemon_id}
                            className={styles.participantSprite}
                          >
                            <img src={p.pokemon.sprite_url} alt={pokemonName} />
                            <span className={styles.participantLevel}>
                              Nv.{p.level}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {battle.lore &&
                    !battle.battle_log &&
                    expandedBattleId === battle.id && (
                      <div className={styles.loreSection}>
                        <div className={styles.loreDivider}></div>
                        <p className={styles.loreText}>{battle.lore}</p>
                      </div>
                    )}

                  {battle.lore && !hasCombatLog && (
                    <button
                      className={styles.expandButton}
                      onClick={() => toggleBattleExpansion(battle.id)}
                    >
                      {expandedBattleId === battle.id
                        ? "Recolher ▲"
                        : "Ver História ▼"}
                    </button>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
