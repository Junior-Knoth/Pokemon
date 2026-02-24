import { useEffect, useState } from "react";
import { Mars, Venus, HelpCircle, Slash } from "lucide-react";
import styles from "./PokemonCard.module.css";
import PokemonDetail from "./PokemonDetail";

export default function PokemonCard({ pokemon, onDeleted }) {
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
  const borderColor = typeColors[primaryType] || "rgba(255,255,255,0.03)";

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
          {/* gender badge */}
          {(() => {
            const raw = pokemon?.gender;
            // normalize empty / 'null' strings to actual null
            let g = null;
            if (raw !== null && raw !== undefined) {
              const s = String(raw).trim();
              if (s !== "" && s.toLowerCase() !== "null") g = s.toLowerCase();
            }

            const maleValues = new Set(["male", "m", "masculino", "masc"]);
            const femaleValues = new Set(["female", "f", "feminino", "fem"]);
            const noneValues = new Set([
              "none",
              "genderless",
              "sem genero",
              "sem-genero",
              "sem gênero",
              "genderless",
              "nenhum",
              "none",
            ]);

            let Icon = HelpCircle;
            let style = { width: 18, height: 18, color: "white" };
            let wrapperStyle = {
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            };

            if (g !== null && maleValues.has(g)) {
              Icon = Mars;
              wrapperStyle.background = "#2188ff"; // blue
            } else if (g !== null && femaleValues.has(g)) {
              Icon = Venus;
              wrapperStyle.background = "#ff3860"; // red
            } else if (g !== null && noneValues.has(g)) {
              Icon = Slash;
              wrapperStyle.background = "#e6e6e6"; // light gray
              style.color = "#333";
            } else if (g === null) {
              // unknown (null or empty in DB) -> gradient
              Icon = HelpCircle;
              wrapperStyle.background =
                "linear-gradient(135deg,#2188ff,#ff3860)";
            } else {
              // fallback unknown for other unexpected strings
              Icon = HelpCircle;
              wrapperStyle.background =
                "linear-gradient(135deg,#2188ff,#ff3860)";
            }

            const titleText =
              g !== null
                ? maleValues.has(g)
                  ? "Masculino"
                  : femaleValues.has(g)
                    ? "Feminino"
                    : noneValues.has(g)
                      ? "Sem gênero"
                      : "Desconhecido"
                : "Desconhecido";

            return (
              <div title={titleText} style={wrapperStyle}>
                <Icon {...style} />
              </div>
            );
          })()}
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
        />
      ) : null}
    </>
  );
}
