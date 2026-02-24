import { useEffect, useState } from "react";
import styles from "./PokemonCard.module.css";

export default function PokemonCard({ pokemon }) {
  const [sprite, setSprite] = useState(pokemon.sprite_url || null);

  useEffect(() => {
    if (sprite) return;
    let mounted = true;
    async function fetchSprite() {
      if (!pokemon?.species_name) return;
      try {
        const name = pokemon.species_name.toLowerCase();
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const found =
          data.sprites?.other?.["official-artwork"]?.front_default ||
          data.sprites?.front_default ||
          null;
        setSprite(found);
      } catch (e) {
        // silent
      }
    }
    fetchSprite();
    return () => {
      mounted = false;
    };
  }, [pokemon, sprite]);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {sprite ? (
          <img
            src={sprite}
            alt={pokemon.species_name}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} />
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.name}>
          {pokemon.nickname || pokemon.species_name}
        </div>
      </div>
    </article>
  );
}
