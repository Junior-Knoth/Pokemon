import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Gamepad2,
  Zap,
  Swords,
  LogOut,
  Database,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePokemon } from "../../context/PokemonContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSignOut?: () => void;
}

interface Game {
  id: string;
  name: string;
}

export function Sidebar({ currentView, onNavigate, onSignOut }: SidebarProps) {
  const { activeGameId, setActiveGameId } = usePokemon();
  const [games, setGames] = useState<Game[]>([]);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [activeGameName, setActiveGameName] = useState<string>("Nenhum jogo");

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (activeGameId && games.length > 0) {
      const game = games.find((g) => g.id === activeGameId);
      setActiveGameName(game?.name || "Nenhum jogo");
    } else if (!activeGameId) {
      setActiveGameName("Todos os Jogos");
    }
  }, [activeGameId, games]);

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

  const handleSelectGame = (gameId: string | null) => {
    setActiveGameId(gameId);
    setIsGameModalOpen(false);
  };

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "games", icon: Gamepad2, label: "Jogos" },
    { id: "pokemons", icon: Zap, label: "Pokémon" },
    { id: "battles", icon: Swords, label: "Batalhas" },
  ];

  return (
    <>
      <aside className={styles["sidebar"]}>
        <div className={styles["sidebar-header"]}>
          <Database className={styles["logo"]} size={24} />
          <span className={styles["logo-text"]}>PokéDB</span>
        </div>

        <nav className={styles["sidebar-nav"]}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`${styles["nav-item"]} ${
                  currentView === item.id ? styles["active"] : ""
                }`}
                title={item.label}
              >
                <Icon className={styles["nav-icon"]} size={20} />
                <span className={styles["nav-label"]}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles["sidebar-footer"]}>
          <button
            onClick={() => setIsGameModalOpen(true)}
            className={styles["game-selector"]}
            title={activeGameName}
          >
            <Gamepad2 className={styles["nav-icon"]} size={20} />
            <span className={styles["nav-label"]}>{activeGameName}</span>
            <ChevronDown className={styles["chevron"]} size={16} />
          </button>

          {onSignOut && (
            <button onClick={onSignOut} className={styles["logout-button"]}>
              <LogOut className={styles["nav-icon"]} size={20} />
              <span className={styles["nav-label"]}>Sair</span>
            </button>
          )}
        </div>
      </aside>

      {/* Modal de Seleção de Jogo */}
      {isGameModalOpen && (
        <div
          className={styles["modal-backdrop"]}
          onClick={() => setIsGameModalOpen(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles["modal-title"]}>Selecionar Jogo</h3>
            <div className={styles["game-list"]}>
              <button
                onClick={() => handleSelectGame(null)}
                className={`${styles["game-item"]} ${
                  !activeGameId ? styles["active"] : ""
                }`}
              >
                Todos os Jogos
              </button>
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className={`${styles["game-item"]} ${
                    activeGameId === game.id ? styles["active"] : ""
                  }`}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
