import styles from "./PokemonDetail.module.css";

export default function PokemonDetail({ pokemon, onClose }) {
  if (!pokemon) return null;

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
          </div>
        </div>

        <div className={styles.body}>
          <p>Detalhes adicionais serão implementados aqui.</p>
        </div>
      </div>
    </div>
  );
}
