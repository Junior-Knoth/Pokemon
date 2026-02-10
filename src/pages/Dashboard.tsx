import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePokemon } from "../context/PokemonContext";
import { Header } from "../components/Header/Header";
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
    loadDashboardData();
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
    let query = supabase.from("battles").select("result");

    if (activeGameId) {
      query = query.eq("game_id", activeGameId);
    }

    const { data: battles, error } = await query;

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
    // Buscar participações em batalhas vitóriosas do jogo ativo ou todos os jogos
    let query = supabase
      .from("battle_participation")
      .select(
        `
        pokemon_id,
        pokemon:pokemons(id, nickname, species_name, sprite_url),
        battle:battles!inner(result, game_id)
      `,
      )
      .eq("battle.result", "Win");

    if (activeGameId) {
      query = query.eq("battle.game_id", activeGameId);
    }

    const { data, error } = await query;

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
    let query = supabase
      .from("pokemons")
      .select("primary_type, secondary_type");

    if (activeGameId) {
      query = query.eq("game_id", activeGameId);
    }

    const { data: pokemons, error } = await query;

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
    let query = supabase
      .from("battles")
      .select("id, opponent_name, result, battle_date, event_type")
      .order("battle_date", { ascending: false })
      .limit(3);

    if (activeGameId) {
      query = query.eq("game_id", activeGameId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Erro ao carregar batalhas recentes:", error);
      return;
    }

    setRecentBattles(data);
  };

  const maxTypeCount = Math.max(...typeDistribution.map((t) => t.count), 1);

  return (
    <div className={styles["container"]}>
      <Header title="Dashboard">
        <button
          className="btn-header-primary"
          onClick={() => onNavigate("battles")}
        >
          ⚔️ Nova Batalha
        </button>
      </Header>

      <main className={styles["main"]}>
        {isLoading ? (
          <div className={styles["loading"]}>Carregando...</div>
        ) : (
          <>
            {/* Log de Estatísticas Compacto */}
            <div className={styles["log-section"]}>
              <h3 className={styles["log-title"]}>📊 Resumo</h3>
              <div className={styles["log-container"]}>
                <div className={styles["log-row"]}>
                  <span className={styles["log-label"]}>⚔️ Batalhas</span>
                  <span className={styles["log-value"]}>
                    {stats.totalBattles}
                  </span>
                </div>
                <div className={styles["log-row"]}>
                  <span className={styles["log-label"]}>✅ Vitórias</span>
                  <span className={styles["log-value"]}>{stats.wins}</span>
                </div>
                <div className={styles["log-row"]}>
                  <span className={styles["log-label"]}>❌ Derrotas</span>
                  <span className={styles["log-value"]}>{stats.losses}</span>
                </div>
                <div className={styles["log-row"]}>
                  <span className={styles["log-label"]}>📈 Win Rate</span>
                  <span className={styles["log-value"]}>
                    {stats.winRate.toFixed(1)}%
                  </span>
                </div>
                {topPokemon && (
                  <div className={styles["log-row"]}>
                    <span className={styles["log-label"]}>🏆 Herói</span>
                    <span className={styles["log-value"]}>
                      <img
                        src={topPokemon.sprite_url}
                        alt={topPokemon.nickname}
                        className={styles["log-sprite"]}
                      />
                      {topPokemon.nickname || topPokemon.species_name} (
                      {topPokemon.wins}W)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Log de Tipos */}
            {typeDistribution.length > 0 && (
              <div className={styles["log-section"]}>
                <h3 className={styles["log-title"]}>🎨 Tipos</h3>
                <div className={styles["log-container"]}>
                  {typeDistribution.map((item) => (
                    <div key={item.type} className={styles["log-row"]}>
                      <span className={styles["log-label"]}>{item.type}</span>
                      <span className={styles["log-value"]}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log de Batalhas Recentes */}
            {recentBattles.length > 0 && (
              <div className={styles["log-section"]}>
                <h3 className={styles["log-title"]}>📜 Batalhas Recentes</h3>
                <div className={styles["log-container"]}>
                  {recentBattles.map((battle) => (
                    <div key={battle.id} className={styles["log-row"]}>
                      <span className={styles["log-label"]}>
                        {battle.event_type === "Gym" && "🏛️"}
                        {battle.event_type === "Rival" && "⚔️"}
                        {battle.event_type === "Elite Four" && "👑"}
                        {battle.event_type === "Lore" && "📖"}
                        {" " + battle.opponent_name}
                      </span>
                      <span
                        className={`${styles["log-value"]} ${styles[battle.result.toLowerCase()]}`}
                      >
                        {battle.result === "Win" ? "✅" : "❌"}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => onNavigate("battles")}
                    className={styles["log-button"]}
                  >
                    Ver Todas →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
