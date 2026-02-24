import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import PokemonCard from "./PokemonCard";
import styles from "./PokemonGrid.module.css";

export default function PokemonGrid({
  selected,
  filters,
  search,
  rows = 5,
  cols = 3,
}) {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected?.id) {
      setPokemons([]);
      return;
    }
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("pokemons")
        .select(
          "id, nickname, species_name, sprite_url, type_1, type_2, is_active",
        )
        .eq("game_id", selected.id)
        .order("created_at", { ascending: true });
      setLoading(false);
      if (error) {
        console.error("Erro ao buscar pokemons:", error);
        return;
      }
      if (mounted) setPokemons(data || []);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selected]);

  const max = rows * cols;

  // apply client-side filters (status and types)
  const applied = pokemons.filter((p) => {
    if (!filters) return true;
    const { status, types } = filters || {};

    // normalize is_active which may come as boolean, string or null
    const raw = p.is_active;
    const activeStr = String(
      raw === null || raw === undefined ? "" : raw,
    ).toLowerCase();
    const isActive =
      activeStr === "true" ||
      activeStr === "t" ||
      activeStr === "1" ||
      raw === true;

    if (status === "active" && !isActive) return false;
    if (status === "noc" && isActive) return false;

    if (types && types.length > 0) {
      const chosen = types.map((t) => String(t).toLowerCase());
      const t1 = String(p.type_1 || "").toLowerCase();
      const t2 = String(p.type_2 || "").toLowerCase();
      if (!chosen.includes(t1) && !chosen.includes(t2)) return false;
    }
    return true;
  });

  // apply search filter (nickname or species_name)
  const searchLower = (typeof search === "string" ? search : "")
    .trim()
    .toLowerCase();
  const searched = searchLower
    ? applied.filter((p) => {
        const nick = String(p.nickname || "").toLowerCase();
        const species = String(p.species_name || "").toLowerCase();
        return nick.includes(searchLower) || species.includes(searchLower);
      })
    : applied;

  const visible = searched.slice(0, max);

  if (!selected)
    return (
      <div className={styles.empty}>Selecione um jogo para ver Pokémons</div>
    );

  return (
    <section
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {loading && <div className={styles.loading}>Carregando...</div>}
      {visible.map((p) => (
        <PokemonCard key={p.id} pokemon={p} />
      ))}
    </section>
  );
}
