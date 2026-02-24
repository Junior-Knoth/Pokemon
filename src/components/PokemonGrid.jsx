import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import PokemonCard from "./PokemonCard";
import styles from "./PokemonGrid.module.css";

export default function PokemonGrid({ selected, rows = 5, cols = 3 }) {
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
        .select("id, nickname, species_name, sprite_url")
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
  const visible = pokemons.slice(0, max);

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
