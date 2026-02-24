import { useState } from "react";
import styles from "./EvolutionSheet.module.css";
import { supabase } from "../supabase/client";

export default function EvolutionSheet({
  open,
  onClose,
  pokemon,
  evolutions = [],
  onConfirmed,
}) {
  if (!open) return null;

  const current = (pokemon.species_name || pokemon.species || "").toLowerCase();
  const options = evolutions.filter((e) => e.name !== current);

  // prefer immediate next evo when available
  const defaultOption =
    options.find((o) => o.from === current) || options[0] || null;
  const [selected, setSelected] = useState(
    defaultOption ? defaultOption.name : null,
  );
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    try {
      // fetch target pokemon details for sprite and types
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(selected)}`,
      );
      let sprite = null;
      let type1 = null;
      let type2 = null;
      if (res.ok) {
        const data = await res.json();
        sprite =
          data.sprites?.other?.["official-artwork"]?.front_default ||
          data.sprites?.front_default ||
          null;
        const types = (data.types || [])
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type.name);
        type1 = types[0] || null;
        type2 = types[1] || null;
      }

      const updates = { species_name: selected };
      if (sprite) updates.sprite_url = sprite;
      if (type1) updates.type_1 = type1;
      if (type2) updates.type_2 = type2;

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
      console.error("Evolve error", e);
      // silent for now
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Evoluir</h3>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Seu Pokémon</div>
          <div className={styles.row}>
            <div className={styles.cardSmall}>
              {pokemon.sprite_url ? (
                <img
                  src={pokemon.sprite_url}
                  alt={pokemon.species_name}
                  className={styles.thumb}
                />
              ) : (
                <div className={styles.placeholder} />
              )}
              <div className={styles.cardName}>
                {pokemon.nickname || pokemon.species_name}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Evolui para</div>
          <div className={styles.options}>
            {options.length === 0 ? (
              <div className={styles.note}>Nenhuma evolução disponível</div>
            ) : (
              options.map((o) => (
                <button
                  key={o.name}
                  className={`${styles.option} ${selected === o.name ? styles.active : ""}`}
                  onClick={() => setSelected(o.name)}
                >
                  <div className={styles.optCard}>
                    {o.sprite ? (
                      <img
                        src={o.sprite}
                        alt={o.name}
                        className={styles.optThumb}
                      />
                    ) : (
                      <div className={styles.placeholder} />
                    )}
                    <div className={styles.optName}>{o.name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

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
            disabled={loading || !selected}
          >
            {loading ? "Processando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
