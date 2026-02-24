import { useEffect, useState } from "react";
import styles from "./PokemonDetail.module.css";

export default function PokemonDetail({ pokemon, onClose }) {
  if (!pokemon) return null;

  useEffect(() => {
    // Lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  function capitalizeWord(s) {
    if (!s && s !== "") return s;
    const str = String(s);
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatSpecies(name) {
    if (!name && name !== "") return "";
    const s = String(name).replace(/[-_]/g, " ").trim();
    return s
      .split(/\s+/)
      .map((w) => capitalizeWord(w.toLowerCase()))
      .join(" ");
  }

  function formatGender(raw) {
    if (raw === null || raw === undefined) return "Desconhecido";
    const s = String(raw).trim().toLowerCase();
    const map = {
      male: "Masculino",
      m: "Masculino",
      female: "Feminino",
      f: "Feminino",
      none: "Sem gênero",
      genderless: "Sem gênero",
      "sem genero": "Sem gênero",
      "sem-genero": "Sem gênero",
      "sem gênero": "Sem gênero",
      nenhum: "Sem gênero",
    };
    if (map[s]) return map[s];
    // fallback: capitalize first letter
    return capitalizeWord(s);
  }

  // Type effectiveness chart (attack -> { strong: [], weak: [], immune: [] })
  const typeChart = {
    normal: { strong: [], weak: ["rock", "steel"], immune: ["ghost"] },
    fire: {
      strong: ["grass", "ice", "bug", "steel"],
      weak: ["fire", "water", "rock", "dragon"],
      immune: [],
    },
    water: {
      strong: ["fire", "ground", "rock"],
      weak: ["water", "grass", "dragon"],
      immune: [],
    },
    electric: {
      strong: ["water", "flying"],
      weak: ["electric", "grass", "dragon"],
      immune: ["ground"],
    },
    grass: {
      strong: ["water", "ground", "rock"],
      weak: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
      immune: [],
    },
    ice: {
      strong: ["grass", "ground", "flying", "dragon"],
      weak: ["fire", "water", "ice", "steel"],
      immune: [],
    },
    fighting: {
      strong: ["normal", "ice", "rock", "dark", "steel"],
      weak: ["poison", "flying", "psychic", "bug", "fairy"],
      immune: [],
    },
    poison: {
      strong: ["grass", "fairy"],
      weak: ["poison", "ground", "rock", "ghost"],
      immune: ["steel"],
    },
    ground: {
      strong: ["fire", "electric", "poison", "rock", "steel"],
      weak: ["grass", "bug"],
      immune: ["flying"],
    },
    flying: {
      strong: ["grass", "fighting", "bug"],
      weak: ["electric", "rock", "steel"],
      immune: [],
    },
    psychic: {
      strong: ["fighting", "poison"],
      weak: ["psychic", "steel"],
      immune: ["dark"],
    },
    bug: {
      strong: ["grass", "psychic", "dark"],
      weak: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
      immune: [],
    },
    rock: {
      strong: ["fire", "ice", "flying", "bug"],
      weak: ["fighting", "ground", "steel"],
      immune: [],
    },
    ghost: {
      strong: ["psychic", "ghost"],
      weak: ["dark"],
      immune: ["normal", "fighting"],
    },
    dragon: { strong: ["dragon"], weak: ["steel"], immune: ["fairy"] },
    dark: {
      strong: ["psychic", "ghost"],
      weak: ["fighting", "dark", "fairy"],
      immune: [],
    },
    steel: {
      strong: ["ice", "rock", "fairy"],
      weak: ["fire", "water", "electric", "steel"],
      immune: [],
    },
    fairy: {
      strong: ["fighting", "dragon", "dark"],
      weak: ["fire", "poison", "steel"],
      immune: [],
    },
  };

  function computeMatchups(t1, t2) {
    const attackTypes = Object.keys(typeChart);
    const results = attackTypes.map((atk) => {
      const chart = typeChart[atk];
      function multAgainst(def) {
        if (!def) return 1;
        const d = String(def).toLowerCase();
        if (chart.immune.includes(d)) return 0;
        if (chart.strong.includes(d)) return 2;
        if (chart.weak.includes(d)) return 0.5;
        return 1;
      }
      const m1 = multAgainst(t1);
      const m2 = multAgainst(t2);
      const mult = m1 * m2;
      return { type: atk, mult };
    });
    return results;
  }

  const t1 = (pokemon.type_1 || pokemon.type1 || "").toLowerCase();
  const t2 = (pokemon.type_2 || pokemon.type2 || "").toLowerCase();
  const matchups = computeMatchups(t1 || null, t2 || null);
  const immunities = matchups
    .filter((m) => m.mult === 0)
    .sort((a, b) => a.type.localeCompare(b.type));
  const weaknesses = matchups
    .filter((m) => m.mult > 1)
    .sort((a, b) => b.mult - a.mult || a.type.localeCompare(b.type));
  const resistances = matchups
    .filter((m) => m.mult > 0 && m.mult < 1)
    .sort((a, b) => a.mult - b.mult || a.type.localeCompare(b.type));

  // Helper to render a type name prettily
  function pretty(t) {
    if (!t) return "-";
    return String(t).charAt(0).toUpperCase() + String(t).slice(1);
  }

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

  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const name = (
          pokemon.species_name ||
          pokemon.species ||
          ""
        ).toLowerCase();
        if (!name) return;
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const map = {};
        (data.stats || []).forEach((s) => {
          map[s.stat.name] = s.base_stat;
        });
        setStats(map);
      } catch (e) {
        // ignore
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [pokemon.species_name, pokemon.species]);

  const statOrder = [
    ["hp", "HP"],
    ["attack", "Atk"],
    ["defense", "Def"],
    ["special-attack", "Sp. Atk"],
    ["special-defense", "Sp. Def"],
    ["speed", "Speed"],
  ];

  const totalBase = statOrder.reduce(
    (acc, [key]) => acc + (stats?.[key] ?? 0),
    0,
  );

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Fechar">
          ✕
        </button>
        <div className={styles.header}>
          <div className={styles.imageWrap}>
            {pokemon.sprite_url ? (
              <img
                src={pokemon.sprite_url}
                alt={pokemon.species_name}
                className={styles.image}
              />
            ) : null}
          </div>
          <div className={styles.meta}>
            <h2 className={styles.title}>
              {pokemon.nickname || formatSpecies(pokemon.species_name)}
            </h2>
            <div className={styles.sub}>
              {formatSpecies(pokemon.species_name)}
            </div>
            <div className={styles.small}>
              Gênero: {formatGender(pokemon.gender)}
            </div>
            {(t1 || t2) && (
              <div className={styles.typesRow}>
                {t1 ? (
                  <div
                    className={styles.typeTag}
                    style={{
                      borderBottom: `2px solid ${typeColors[t1] || "transparent"}`,
                    }}
                  >
                    {pretty(t1)}
                  </div>
                ) : null}
                {t2 ? (
                  <div
                    className={styles.typeTag}
                    style={{
                      borderBottom: `2px solid ${typeColors[t2] || "transparent"}`,
                    }}
                  >
                    {pretty(t2)}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.matchups}>
            <div className={styles.matchupColumn}>
              <div className={styles.matchupTitle}>Fraquezas</div>
              <div className={styles.typeList}>
                {weaknesses.length === 0 ? (
                  <div className={styles.typePill}>Nenhuma</div>
                ) : (
                  weaknesses.map((w) => (
                    <div
                      key={w.type}
                      className={styles.typePill}
                      style={{
                        borderBottom: `3px solid ${typeColors[w.type] || "transparent"}`,
                      }}
                    >
                      <span>{pretty(w.type)}</span>{" "}
                      <span>{w.mult !== 1 ? `×${w.mult}` : ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.matchupColumn}>
              <div className={styles.matchupTitle}>Resistências</div>
              <div className={styles.typeList}>
                {resistances.length === 0 ? (
                  <div className={styles.typePill}>Nenhuma</div>
                ) : (
                  resistances.map((r) => (
                    <div
                      key={r.type}
                      className={styles.typePill}
                      style={{
                        borderBottom: `3px solid ${typeColors[r.type] || "transparent"}`,
                      }}
                    >
                      <span>{pretty(r.type)}</span>{" "}
                      <span>{r.mult !== 1 ? `×${r.mult}` : ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {immunities.length > 0 && (
              <div className={styles.matchupColumn}>
                <div className={styles.matchupTitle}>Imunidades</div>
                <div className={styles.typeList}>
                  {immunities.map((i) => (
                    <div
                      key={i.type}
                      className={styles.typePill}
                      style={{
                        borderBottom: `3px solid ${typeColors[i.type] || "transparent"}`,
                      }}
                    >
                      {pretty(i.type)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.statsSection}>
            <div className={styles.statsTitle}>Base Stats</div>
            {stats ? (
              <div className={styles.statsGrid}>
                {statOrder.map(([key, label]) => {
                  const v = stats[key] ?? 0;
                  const pct = Math.max(
                    0,
                    Math.min(100, Math.round((v / 255) * 100)),
                  );
                  return (
                    <div key={key} className={styles.statRow}>
                      <div className={styles.statLabel}>{label}</div>
                      <div className={styles.statBarWrap}>
                        <div
                          className={styles.statBarFill}
                          style={{
                            width: `${pct}%`,
                            background:
                              typeColors[t1] || "rgba(255,255,255,0.06)",
                          }}
                        />
                      </div>
                      <div className={styles.statValue}>{v}</div>
                    </div>
                  );
                })}
                <div className={styles.statTotal}>
                  <div className={styles.statLabel}>Total</div>
                  <div
                    className={styles.statBarWrap}
                    style={{ visibility: "hidden" }}
                  />
                  <div className={styles.statValue}>{totalBase}</div>
                </div>
              </div>
            ) : (
              <div className={styles.statsLoading}>Carregando...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
