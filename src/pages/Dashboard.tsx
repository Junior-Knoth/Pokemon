import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePokemon } from "../context/PokemonContext";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  userEmail: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

interface Game {
  id: string;
  name: string;
}

interface Stats {
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface TopPokemon {
  id: string;
  nickname: string;
  species_name: string;
  sprite_url: string;
  wins: number;
}

interface TypeDistribution {
  type: string;
  count: number;
}

interface RecentBattle {
  id: string;
  opponent_name: string;
  result: "Win" | "Loss";
  battle_date: string;
  event_type: string;
}

export function Dashboard({
  userEmail,
  onNavigate,
  onSignOut,
}: DashboardProps) {
  const { activeGameId, setActiveGameId } = usePokemon();
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBattles: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  });
  const [topPokemon, setTopPokemon] = useState<TopPokemon | null>(null);
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>(
    [],
  );
  const [recentBattles, setRecentBattles] = useState<RecentBattle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (activeGameId) {
      loadDashboardData();
    }
  }, [activeGameId]);

  const loadGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Erro ao carregar jogos:", error);
      return;
    }

    setGames(data || []);

    // Se não houver jogo ativo e houver jogos, selecionar o primeiro
    if (!activeGameId && data && data.length > 0) {
      setActiveGameId(data[0].id);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadBattleStats(),
        loadTopPokemon(),
        loadTypeDistribution(),
        loadRecentBattles(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBattleStats = async () => {
    if (!activeGameId) return;

    const { data: battles, error } = await supabase
      .from("battles")
      .select("result")
      .eq("game_id", activeGameId);

    if (error) {
      console.error("Erro ao carregar estatísticas:", error);
      return;
    }

    const totalBattles = battles?.length || 0;
    const wins = battles?.filter((b) => b.result === "Win").length || 0;
    const losses = totalBattles - wins;
    const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

    setStats({ totalBattles, wins, losses, winRate });
  };

  const loadTopPokemon = async () => {
    if (!activeGameId) return;

    // Buscar participações em batalhas vitóriosas do jogo ativo
    const { data, error } = await supabase
      .from("battle_participation")
      .select(
        `
        pokemon_id,
        pokemon:pokemons(id, nickname, species_name, sprite_url),
        battle:battles!inner(result, game_id)
      `,
      )
      .eq("battle.result", "Win")
      .eq("battle.game_id", activeGameId);

    if (error || !data) {
      console.error("Erro ao carregar top pokemon:", error);
      return;
    }

    // Contar vitórias por Pokémon
    const winCounts: Record<string, { pokemon: any; count: number }> = {};

    data.forEach((participation: any) => {
      const pokemonId = participation.pokemon_id;
      if (!winCounts[pokemonId]) {
        winCounts[pokemonId] = {
          pokemon: participation.pokemon,
          count: 0,
        };
      }
      winCounts[pokemonId].count++;
    });

    // Encontrar o Pokémon com mais vitórias
    const topEntry = Object.values(winCounts).sort(
      (a, b) => b.count - a.count,
    )[0];

    if (topEntry) {
      setTopPokemon({
        id: topEntry.pokemon.id,
        nickname: topEntry.pokemon.nickname,
        species_name: topEntry.pokemon.species_name,
        sprite_url: topEntry.pokemon.sprite_url,
        wins: topEntry.count,
      });
    }
  };

  const loadTypeDistribution = async () => {
    if (!activeGameId) return;

    const { data: pokemons, error } = await supabase
      .from("pokemons")
      .select("primary_type, secondary_type")
      .eq("game_id", activeGameId);

    if (error || !pokemons) {
      console.error("Erro ao carregar tipos:", error);
      return;
    }

    const typeCounts: Record<string, number> = {};

    pokemons.forEach((p) => {
      if (p.primary_type) {
        typeCounts[p.primary_type] = (typeCounts[p.primary_type] || 0) + 1;
      }
      if (p.secondary_type) {
        typeCounts[p.secondary_type] = (typeCounts[p.secondary_type] || 0) + 1;
      }
    });

    const distribution = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 tipos

    setTypeDistribution(distribution);
  };

  const loadRecentBattles = async () => {
    if (!activeGameId) return;

    const { data, error } = await supabase
      .from("battles")
      .select("id, opponent_name, result, battle_date, event_type")
      .eq("game_id", activeGameId)
      .order("battle_date", { ascending: false })
      .limit(3);

    if (error || !data) {
      console.error("Erro ao carregar batalhas recentes:", error);
      return;
    }

    setRecentBattles(data);
  };

  const maxTypeCount = Math.max(...typeDistribution.map((t) => t.count), 1);

  return (
    <div className={styles["container"]}>
      <header className={styles["header"]}>
        <div className={styles["headerLeft"]}>
          <h1 className={styles["title"]}>🎮 Pokémon Database</h1>
        </div>
        <div className={styles["headerControls"]}>
          <div className={styles["filterGroup"]}>
            <label htmlFor="game-filter" className={styles["filterLabel"]}>
              Jogo:
            </label>
            <select
              id="game-filter"
              value={activeGameId || ""}
              onChange={(e) => setActiveGameId(e.target.value || null)}
              className={styles["select"]}
            >
              <option value="">Selecione um jogo</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className={styles["newBattleButton"]}
            onClick={() => onNavigate("battles")}
            disabled={!activeGameId}
          >
            ⚔️ Nova Batalha
          </button>
          <div className={styles["user-section"]}>
            <span className={styles["user-email"]}>{userEmail}</span>
            <button onClick={onSignOut} className={styles["logout-button"]}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className={styles["main"]}>
        <h2 className={styles["section-title"]}>
          📊 Dashboard de Estatísticas
        </h2>

        {isLoading ? (
          <div className={styles["loading"]}>Carregando estatísticas...</div>
        ) : !activeGameId ? (
          <div className={styles["emptyState"]}>
            <p>🎮 Selecione um jogo no cabeçalho para ver suas estatísticas</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Gerais */}
            <div className={styles["stats-grid"]}>
              <div className={styles["stat-card"]}>
                <div className={styles["stat-icon"]}>⚔️</div>
                <div className={styles["stat-content"]}>
                  <div className={styles["stat-value"]}>
                    {stats.totalBattles}
                  </div>
                  <div className={styles["stat-label"]}>Total de Batalhas</div>
                </div>
              </div>

              <div className={styles["stat-card"]}>
                <div className={styles["stat-icon"]}>📈</div>
                <div className={styles["stat-content"]}>
                  <div className={styles["stat-value"]}>
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <div className={styles["stat-label"]}>
                    Win Rate ({stats.wins}W / {stats.losses}L)
                  </div>
                </div>
              </div>

              <div className={styles["stat-card"]}>
                <div className={styles["stat-icon"]}>🏆</div>
                <div className={styles["stat-content"]}>
                  {topPokemon ? (
                    <>
                      <div className={styles["hero-pokemon"]}>
                        <img
                          src={topPokemon.sprite_url}
                          alt={topPokemon.nickname || topPokemon.species_name}
                          className={styles["hero-sprite"]}
                        />
                        <div>
                          <div className={styles["hero-name"]}>
                            {topPokemon.nickname || topPokemon.species_name}
                          </div>
                          <div className={styles["hero-wins"]}>
                            {topPokemon.wins} vitórias
                          </div>
                        </div>
                      </div>
                      <div className={styles["stat-label"]}>Herói do Time</div>
                    </>
                  ) : (
                    <div className={styles["stat-label"]}>Sem dados ainda</div>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico de Tipos */}
            {typeDistribution.length > 0 && (
              <div className={styles["chart-section"]}>
                <h3 className={styles["chart-title"]}>
                  🎨 Distribuição de Tipos
                </h3>
                <div className={styles["type-chart"]}>
                  {typeDistribution.map((item) => (
                    <div key={item.type} className={styles["type-bar-wrapper"]}>
                      <div className={styles["type-label"]}>{item.type}</div>
                      <div className={styles["type-bar-container"]}>
                        <div
                          className={styles["type-bar"]}
                          style={{
                            width: `${(item.count / maxTypeCount) * 100}%`,
                          }}
                        >
                          <span className={styles["type-count"]}>
                            {item.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed de Batalhas Recentes */}
            {recentBattles.length > 0 && (
              <div className={styles["recent-section"]}>
                <h3 className={styles["recent-title"]}>📜 Batalhas Recentes</h3>
                <div className={styles["recent-battles"]}>
                  {recentBattles.map((battle) => (
                    <div key={battle.id} className={styles["recent-battle"]}>
                      <div className={styles["battle-info"]}>
                        <div className={styles["battle-opponent"]}>
                          {battle.event_type === "Gym" && "🏛️"}
                          {battle.event_type === "Rival" && "⚔️"}
                          {battle.event_type === "Elite Four" && "👑"}
                          {battle.event_type === "Lore" && "📖"}
                          {" " + battle.opponent_name}
                        </div>
                        <div className={styles["battle-date"]}>
                          {new Date(battle.battle_date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </div>
                      </div>
                      <div
                        className={`${styles["battle-result"]} ${
                          styles[battle.result.toLowerCase()]
                        }`}
                      >
                        {battle.result === "Win" ? "✅ Vitória" : "❌ Derrota"}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onNavigate("battles")}
                  className={styles["view-all-button"]}
                >
                  Ver Todas as Batalhas →
                </button>
              </div>
            )}

            {/* Cards de Navegação */}
            <div className={styles["nav-section"]}>
              <h3 className={styles["nav-title"]}>⚡ Acesso Rápido</h3>
              <div className={styles["cards-grid"]}>
                <div className={styles["card"]}>
                  <h3 className={styles["card-title"]}>Meus Jogos</h3>
                  <p className={styles["card-description"]}>
                    Gerencie seus jogos Pokémon
                  </p>
                  <button
                    onClick={() => onNavigate("games")}
                    className={`${styles["card-button"]} ${styles["primary"]}`}
                  >
                    Ver Jogos
                  </button>
                </div>

                <div className={styles["card"]}>
                  <h3 className={styles["card-title"]}>Meus Pokémon</h3>
                  <p className={styles["card-description"]}>
                    Visualize sua coleção
                  </p>
                  <button
                    onClick={() => onNavigate("pokemons")}
                    className={`${styles["card-button"]} ${styles["success"]}`}
                  >
                    Ver Pokémon
                  </button>
                </div>

                <div className={styles["card"]}>
                  <h3 className={styles["card-title"]}>Batalhas</h3>
                  <p className={styles["card-description"]}>
                    Registre suas batalhas épicas
                  </p>
                  <button
                    onClick={() => onNavigate("battles")}
                    className={`${styles["card-button"]} ${styles["warning"]}`}
                  >
                    Ver Batalhas
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
