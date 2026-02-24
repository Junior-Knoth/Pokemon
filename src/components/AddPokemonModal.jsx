import { useEffect, useState, useRef } from "react";
import styles from "./AddPokemonModal.module.css";
import { Mars, Venus } from "lucide-react";
import { supabase } from "../supabase/client";

export default function AddPokemonModal({
  open,
  onClose,
  selectedGame,
  onCreated,
}) {
  const [currentGame, setCurrentGame] = useState(selectedGame || null);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [species, setSpecies] = useState("");
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState(false);
  const [sprite, setSprite] = useState(null);
  const [types, setTypes] = useState([]);
  const [gender, setGender] = useState(null); // 'male' | 'female' | 'none'
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setSpecies("");
      setChecking(false);
      setExists(false);
      setSprite(null);
      setTypes([]);
      setGender(null);
      setNickname("");
      setError(null);
    }
    // when modal opens, sync currentGame with prop
    setCurrentGame(selectedGame || null);
  }, [open]);

  // compute and update overlay position so suggestions are fixed to viewport
  useEffect(() => {
    function updateOverlay() {
      const el = inputRef.current;
      if (!el) {
        setOverlayStyle(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setOverlayStyle({
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
    updateOverlay();
    window.addEventListener("resize", updateOverlay);
    window.addEventListener("scroll", updateOverlay, true);
    return () => {
      window.removeEventListener("resize", updateOverlay);
      window.removeEventListener("scroll", updateOverlay, true);
    };
  }, [open, species]);

  useEffect(() => {
    setCurrentGame(selectedGame || null);
  }, [selectedGame]);

  // debounce species check while typing
  useEffect(() => {
    if (!species || species.trim() === "") {
      setExists(false);
      setSprite(null);
      setTypes([]);
      setError(null);
      return;
    }
    const id = setTimeout(async () => {
      const name = species.trim().toLowerCase();
      setChecking(true);
      setError(null);
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`,
        );
        if (!res.ok) {
          setExists(false);
          setSprite(null);
          setTypes([]);
        } else {
          const data = await res.json();
          setExists(true);
          const found =
            data.sprites?.other?.["official-artwork"]?.front_default ||
            data.sprites?.front_default ||
            null;
          setSprite(found);
          const t = (data.types || [])
            .map((it) => it.type?.name)
            .filter(Boolean);
          setTypes(t);
          setError(null);
        }
      } catch (e) {
        setError("Erro ao verificar PokéAPI");
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [species]);

  // preload all pokemon names for autocomplete (one-time per component instance)
  const allNamesRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [overlayStyle, setOverlayStyle] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (allNamesRef.current) return;
      try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        allNamesRef.current = (data.results || []).map((r) => r.name || "");
      } catch (e) {
        // ignore
      }
    }
    if (open) loadAll();
    return () => {
      mounted = false;
    };
  }, [open]);

  function fetchPokemonDetailsImmediate(name) {
    // used when selecting from autocomplete — fetch sprite and types immediately
    (async () => {
      if (!name) return;
      setChecking(true);
      setError(null);
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`,
        );
        if (!res.ok) {
          setExists(false);
          setSprite(null);
          setTypes([]);
        } else {
          const data = await res.json();
          setExists(true);
          const found =
            data.sprites?.other?.["official-artwork"]?.front_default ||
            data.sprites?.front_default ||
            null;
          setSprite(found);
          const t = (data.types || [])
            .map((it) => it.type?.name)
            .filter(Boolean);
          setTypes(t);
          setError(null);
        }
      } catch (e) {
        setError("Erro ao verificar PokéAPI");
      } finally {
        setChecking(false);
      }
    })();
  }

  function handleInputKeyDown(e) {
    if (!allNamesRef.current) return;
    const q = (species || "").trim().toLowerCase();
    const matches = allNamesRef.current
      .filter((n) => n && n.includes(q))
      .slice(0, 8);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (matches.length === 0) return;
      setHighlightedIndex((i) => Math.min(i + 1, matches.length - 1));
      setShowSuggestions(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (matches.length === 0) return;
      setHighlightedIndex((i) => Math.max(i - 1, 0));
      setShowSuggestions(true);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && matches[highlightedIndex]) {
        const m = matches[highlightedIndex];
        setSpecies(m);
        fetchPokemonDetailsImmediate(m);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        e.preventDefault();
      } else if (matches.length > 0) {
        const m = matches[0];
        setSpecies(m);
        fetchPokemonDetailsImmediate(m);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }

  function handleInputBlur() {
    // delay hiding to allow mouse selection handlers to run
    setTimeout(() => {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }, 120);
  }

  // hide suggestions when clicking outside input or suggestions list
  useEffect(() => {
    if (!showSuggestions) return;
    function onDocMouseDown(e) {
      const t = e.target;
      if (inputRef.current && inputRef.current.contains(t)) return;
      if (suggestionsRef.current && suggestionsRef.current.contains(t)) return;
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [showSuggestions]);

  async function handleCreate() {
    setError(null);
    if (!exists) {
      setError("Espécie inválida");
      return;
    }
    if (!currentGame?.id) {
      setError("Selecione um jogo antes de adicionar");
      return;
    }

    const insertObj = {
      species_name: species.trim().toLowerCase(),
      nickname: nickname.trim() || null,
      game_id: currentGame.id,
      sprite_url: sprite,
      type_1: types[0] || null,
      type_2: types[1] || null,
      gender: gender,
    };

    const { data, error: err } = await supabase
      .from("pokemons")
      .insert(insertObj)
      .select()
      .single();
    if (err) {
      console.error("Erro ao criar pokemon:", err);
      setError("Falha ao criar no Supabase");
      return;
    }
    onCreated?.(data);
    onClose?.();
  }

  function requestCreate() {
    // open confirmation overlay
    setShowConfirm(true);
  }

  function cancelCreate() {
    setShowConfirm(false);
  }

  function genderLabel(g) {
    if (g === "male") return "masculino";
    if (g === "female") return "feminino";
    if (g === "none") return "sem gênero";
    return "desconhecido";
  }

  // --- Game picker logic ---
  function openGamePicker() {
    setShowGamePicker(true);
  }

  function closeGamePicker() {
    setShowGamePicker(false);
  }

  function pickGame(g) {
    setCurrentGame({ id: g.id, name: g.name });
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
        if (error) {
          console.error("Erro ao carregar jogos:", error);
          return;
        }
        if (mounted) setGames(data || []);
      }
      load();
      return () => {
        mounted = false;
      };
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

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Adicionar Pokémon</h3>

        <div className={styles.gameRow}>
          <div>
            <div className={styles.gameName}>
              {currentGame?.name ?? "Nenhum jogo selecionado"}
            </div>
            <div style={{ fontSize: 12, color: "#9fb0c8" }}>
              {currentGame?.id ?? ""}
            </div>
          </div>
          <div>
            <button className={styles.editGameBtn} onClick={openGamePicker}>
              Editar
            </button>
          </div>
        </div>

        {showGamePicker ? (
          <GamePicker onClose={closeGamePicker} onPick={pickGame} />
        ) : null}

        <div className={styles.row}>
          <label className={styles.label}>Espécie</label>
          <div className={styles.rowInline}>
            <input
              className={styles.input}
              ref={inputRef}
              value={species}
              onChange={(e) => {
                setSpecies(e.target.value);
                setHighlightedIndex(-1);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Digite o nome da espécie (ex: pikachu)"
              autoComplete="off"
            />
            {/* autocomplete suggestions */}
            {species && allNamesRef.current && showSuggestions
              ? (() => {
                  const q = species.trim().toLowerCase();
                  if (!q) return null;
                  const matches = allNamesRef.current
                    .filter((n) => n && n.includes(q))
                    .slice(0, 8);
                  if (!matches || matches.length === 0) return null;
                  return (
                    <div
                      className={styles.autocompleteList}
                      style={overlayStyle}
                      role="listbox"
                    >
                      {matches.map((m, idx) => (
                        <div
                          key={m}
                          className={styles.autocompleteItem}
                          onMouseDown={(ev) => {
                            // use onMouseDown to ensure selection before blur
                            ev.preventDefault();
                            setSpecies(m);
                            fetchPokemonDetailsImmediate(m);
                            setShowSuggestions(false);
                            setHighlightedIndex(-1);
                          }}
                          style={
                            idx === highlightedIndex
                              ? { background: "rgba(255,255,255,0.04)" }
                              : undefined
                          }
                          role="option"
                          aria-selected={idx === highlightedIndex}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  );
                })()
              : null}
            <div className={styles.preview}>
              {checking ? <div className={styles.smallLoading}>...</div> : null}
              {sprite ? (
                <img src={sprite} alt="preview" className={styles.previewImg} />
              ) : null}
            </div>
          </div>
          {!exists && species ? (
            <div className={styles.invalid}>Espécie não encontrada</div>
          ) : null}
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Gênero</label>
          <div className={styles.genderRow}>
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

        <div className={styles.row}>
          <label className={styles.label}>Apelido</label>
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Apelido (opcional)"
          />
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.footer}>
          <button
            className={styles.apply}
            onClick={requestCreate}
            disabled={!exists}
          >
            Criar
          </button>
          <button className={styles.clear} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
      {showConfirm ? (
        <div className={styles.confirmBackdrop} onClick={cancelCreate}>
          <div
            className={styles.confirmBox}
            onClick={(e) => e.stopPropagation()}
          >
            <p>
              Você tem certeza que quer criar um {species || "(espécie)"}{" "}
              {genderLabel(gender)} chamado de {nickname || "(sem apelido)"}{" "}
              para o jogo {currentGame?.name || "(jogo)"}?
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className={styles.apply}
                onClick={async () => {
                  setShowConfirm(false);
                  await handleCreate();
                }}
              >
                Confirmar
              </button>
              <button className={styles.clear} onClick={cancelCreate}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
