import { useEffect, useState } from "react";
import styles from "./EditPokemonModal.module.css";
import { Mars, Venus } from "lucide-react";
import { supabase } from "../supabase/client";

export default function EditPokemonModal({
  open,
  onClose,
  pokemon,
  onConfirmed,
}) {
  const [currentGame, setCurrentGame] = useState(
    pokemon?.game_id
      ? { id: pokemon.game_id, name: pokemon.game_name || "" }
      : null,
  );
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [nickname, setNickname] = useState(pokemon?.nickname || "");
  const [gender, setGender] = useState(pokemon?.gender ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentGame(
      pokemon?.game_id
        ? { id: pokemon.game_id, name: pokemon.game_name || "" }
        : null,
    );
    setNickname(pokemon?.nickname || "");
    setGender(pokemon?.gender ?? null);
  }, [open, pokemon]);

  function openGamePicker() {
    setShowGamePicker(true);
  }
  function closeGamePicker() {
    setShowGamePicker(false);
  }

  function GamePicker({ onClose, onPick }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      let mounted = true;
      async function load() {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (!uid) {
          setGames([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("games")
          .select("id, name")
          .eq("user_id", uid)
          .order("created_at", { ascending: true });
        setLoading(false);
        if (error) return;
        if (mounted) setGames(data || []);
      }
      load();
      return () => (mounted = false);
    }, []);

    return (
      <div className={styles.gamePickerBackdrop} onClick={onClose}>
        <div className={styles.gamePicker} onClick={(e) => e.stopPropagation()}>
          <h4 style={{ marginTop: 0 }}>Selecionar jogo</h4>
          {loading && <div className={styles.gameEmpty}>Carregando...</div>}
          {!loading && games.length === 0 && (
            <div className={styles.gameEmpty}>Nenhum jogo encontrado</div>
          )}
          {!loading &&
            games.map((g) => (
              <div
                key={g.id}
                className={styles.gameItem}
                onClick={() => onPick(g)}
              >
                {g.name}
              </div>
            ))}
        </div>
      </div>
    );
  }

  async function confirm() {
    if (!pokemon?.id) return;
    setLoading(true);
    try {
      const updates = {};
      if (currentGame?.id) updates.game_id = currentGame.id;
      updates.nickname = nickname?.trim() || null;
      updates.gender = gender ?? null;

      const { data, error } = await supabase
        .from("pokemons")
        .update(updates)
        .eq("id", pokemon.id)
        .select()
        .single();
      if (error) throw error;
      onConfirmed?.(data);
      onClose?.();
    } catch (e) {
      console.error("Edit error", e);
      alert("Falha ao editar pokémon.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Editar Pokémon</h3>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Jogo</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>{currentGame?.name ?? "Nenhum jogo selecionado"}</div>
            <button className={styles.editGameBtn} onClick={openGamePicker}>
              Editar
            </button>
          </div>
        </div>

        {showGamePicker ? (
          <GamePicker
            onClose={closeGamePicker}
            onPick={(g) => {
              setCurrentGame({ id: g.id, name: g.name });
              setShowGamePicker(false);
            }}
          />
        ) : null}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Gênero</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`${styles.genderBtn} ${gender === "male" ? styles.genderActive : ""}`}
              onClick={() => setGender(gender === "male" ? null : "male")}
              aria-label="Masculino"
            >
              <Mars />
            </button>
            <button
              className={`${styles.genderBtn} ${gender === "female" ? styles.genderActive : ""}`}
              onClick={() => setGender(gender === "female" ? null : "female")}
              aria-label="Feminino"
            >
              <Venus />
            </button>
            <button
              className={`${styles.genderText} ${gender === "none" ? styles.genderActive : ""}`}
              onClick={() => setGender(gender === "none" ? null : "none")}
            >
              Sem gênero
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Apelido</div>
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Apelido (opcional)"
          />
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancel}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.confirm}
            onClick={confirm}
            disabled={loading}
          >
            {loading ? "Processando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
