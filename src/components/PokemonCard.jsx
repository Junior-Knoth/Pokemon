import { useEffect, useState } from "react";
import { Mars, Venus, HelpCircle, Slash } from "lucide-react";
import styles from "./PokemonCard.module.css";
import PokemonDetail from "./PokemonDetail";

export default function PokemonCard({ pokemon, onDeleted, onUpdated }) {
  const [sprite, setSprite] = useState(pokemon.sprite_url || null);
  const [showDetail, setShowDetail] = useState(false);

  const typeColors = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD",
  };

  const primaryType = String(
    pokemon.type_1 || pokemon.type1 || "",
  ).toLowerCase();
  // border color now reflects gender: male -> blue, female -> red, none/unknown -> white
  const rawGender = pokemon?.gender;
  let gNorm = null;
  if (rawGender !== null && rawGender !== undefined) {
    const s = String(rawGender).trim();
    if (s !== "" && s.toLowerCase() !== "null") gNorm = s.toLowerCase();
  }
  const maleValues = new Set(["male", "m", "masculino", "masc"]);
  const femaleValues = new Set(["female", "f", "feminino", "fem"]);
  const noneValues = new Set([
    "none",
    "genderless",
    "sem genero",
    "sem-genero",
    "sem gênero",
    "nenhum",
  ]);
  let borderColor;
  if (gNorm !== null && maleValues.has(gNorm)) {
    borderColor = "#2188ff"; // blue
  } else if (gNorm !== null && femaleValues.has(gNorm)) {
    borderColor = "#ff3860"; // red
  } else {
    // none or unknown -> white
    borderColor = "#ffffff";
  }

  useEffect(() => {
    // If the incoming pokemon prop has an explicit sprite_url that's different
    // from our local `sprite` state, update it so the card reflects edits
    if (pokemon?.sprite_url && pokemon.sprite_url !== sprite) {
      setSprite(pokemon.sprite_url);
      return;
    }
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
    <>
      <article
        className={styles.card}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowDetail(true);
        }}
        style={{ cursor: "pointer", border: `1px solid ${borderColor}` }}
      >
        <div className={styles.imageWrapper} style={{ position: "relative" }}>
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
      {showDetail ? (
        <PokemonDetail
          pokemon={pokemon}
          onClose={() => setShowDetail(false)}
          onDeleted={(deleted) => {
            onDeleted?.(deleted);
            setShowDetail(false);
          }}
          onUpdated={(updated) => {
            onUpdated?.(updated);
            setShowDetail(false);
          }}
        />
      ) : null}
    </>
  );
}
