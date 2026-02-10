import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Header } from "../components/Header/Header";
import styles from "./Games.module.css";

interface Game {
  id: string;
  name: string;
  region: string | null;
  platform: string | null;
  created_at: string | null;
}

interface GamesProps {
  onNavigate: (view: string) => void;
}

// Regiões principais da série (Kanto -> Paldea/Hisui)
const REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Hisui",
  "Paldea",
];

// Plataformas comuns para jogos Pokémon
const PLATFORMS = [
  "Game Boy",
  "Game Boy Color",
  "Game Boy Advance",
  "Nintendo DS",
  "Nintendo DSi",
  "Nintendo 3DS",
  "Nintendo Switch",
  "Nintendo Switch Lite",
  "Nintendo Switch OLED",
  "Mobile",
  "PC",
  "Other",
];
export function Games({ onNavigate }: GamesProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    platform: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Carregar jogos
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setGames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jogos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("O nome do jogo é obrigatório");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const { error: insertError } = await supabase.from("games").insert([
        {
          name: formData.name.trim(),
          region: formData.region.trim() || null,
          platform: formData.platform.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      setSuccess("Jogo adicionado com sucesso!");
      setFormData({ name: "", region: "", platform: "" });

      // Recarregar lista de jogos
      await fetchGames();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar jogo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={styles["container"]}>
      <Header title="Meus Jogos Pokémon" />

      <main className={styles["main"]}>
        {/* Formulário para adicionar jogo */}
        <section className={styles["section"]}>
          <h2 className={styles["section-title"]}>Adicionar Novo Jogo</h2>

          {error && <div className={styles["error"]}>{error}</div>}
          {success && <div className={styles["success"]}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles["form"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="name" className={styles["label"]}>
                  Nome do Jogo *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Pokémon Sword"
                  disabled={submitting}
                  className="input-default"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="region" className={styles["label"]}>
                  Região
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="select-default"
                >
                  <option value="">-- Selecionar região --</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="platform" className={styles["label"]}>
                  Plataforma
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="select-default"
                >
                  <option value="">-- Selecionar plataforma --</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles["button-group"]}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-header-primary"
              >
                {submitting ? "Adicionando..." : "Adicionar Jogo"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ name: "", region: "", platform: "" })
                }
                disabled={submitting}
                className="btn-header-secondary"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        {/* Lista de jogos */}
        <section className={styles["section"]}>
          <h2 className={styles["section-title"]}>Seus Jogos</h2>

          {loading ? (
            <div className={styles["loading"]}>Carregando jogos...</div>
          ) : games.length === 0 ? (
            <div className={styles["empty-state"]}>
              Nenhum jogo cadastrado ainda. Adicione seu primeiro jogo acima!
            </div>
          ) : (
            <div className={styles["games-grid"]}>
              {games.map((game) => (
                <div key={game.id} className={styles["game-card"]}>
                  <h3 className={styles["game-name"]}>{game.name}</h3>
                  <div className={styles["game-info"]}>
                    {game.region && (
                      <div className={styles["game-info-item"]}>
                        <span className={styles["game-info-label"]}>
                          Região:
                        </span>
                        <span>{game.region}</span>
                      </div>
                    )}
                    {game.platform && (
                      <div className={styles["game-info-item"]}>
                        <span className={styles["game-info-label"]}>
                          Plataforma:
                        </span>
                        <span>{game.platform}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles["game-date"]}>
                    Adicionado em {formatDate(game.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
