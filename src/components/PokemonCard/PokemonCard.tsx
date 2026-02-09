import { useState } from "react";
import { TYPE_COLORS } from "../../lib/pokeapi";
import { PokemonModal } from "../PokemonModal";
import styles from "./PokemonCard.module.css";

interface Pokemon {
  id: string;
  nickname: string;
  species_name: string;
  caught_at: string | null;
  is_active: boolean | null;
  sprite_url: string | null;
  type_1: string | null;
  type_2: string | null;
  created_at: string | null;
  game?: {
    name: string;
  };
}

interface PokemonCardProps {
  pokemon: Pokemon;
  onToggleTeam?: (pokemonId: string) => void;
  isInParty?: boolean;
}

export function PokemonCard({
  pokemon,
  onToggleTeam,
  isInParty = false,
}: PokemonCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPrimaryType = () => {
    return pokemon.type_1;
  };

  const primaryType = getPrimaryType();
  const borderColor = primaryType
    ? TYPE_COLORS[primaryType]
    : "var(--border-color)";

  // Versão compacta para Party
  if (isInParty) {
    return (
      <>
        <div
          className={`${styles["card-compact"]} ${styles["party-card"]}`}
          style={
            { borderColor, "--type-color": borderColor } as React.CSSProperties
          }
          onClick={() => setIsModalOpen(true)}
        >
          <div className={styles["sprite-compact"]}>
            {pokemon.sprite_url ? (
              <img
                src={pokemon.sprite_url}
                alt={pokemon.species_name}
                className={styles["sprite-img-compact"]}
              />
            ) : (
              <span className={styles["sprite-loading-compact"]}>?</span>
            )}
          </div>
          <h3 className={styles["nickname-compact"]}>{pokemon.nickname}</h3>
        </div>

        <PokemonModal
          pokemon={pokemon}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onToggleTeam={onToggleTeam}
        />
      </>
    );
  }

  // Versão compacta para Box (também clicável)
  return (
    <>
      <div
        className={styles["card"]}
        style={
          { borderColor, "--type-color": borderColor } as React.CSSProperties
        }
        onClick={() => setIsModalOpen(true)}
      >
        <div className={styles["sprite-compact"]}>
          {pokemon.sprite_url ? (
            <img
              src={pokemon.sprite_url}
              alt={pokemon.species_name}
              className={styles["sprite-img-compact"]}
            />
          ) : (
            <span className={styles["sprite-loading-compact"]}>?</span>
          )}
        </div>
        <h3 className={styles["nickname-compact"]}>{pokemon.nickname}</h3>
      </div>

      <PokemonModal
        pokemon={pokemon}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToggleTeam={onToggleTeam}
      />
    </>
  );
}
