import { useState, useEffect } from "react";
import { TYPE_COLORS } from "../../lib/pokeapi";
import { calculateDefensiveTyping } from "../../utils/typeEffectiveness";
import styles from "./PokemonModal.module.css";

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

interface PokemonModalProps {
  pokemon: Pokemon;
  isOpen: boolean;
  onClose: () => void;
  onToggleTeam?: (pokemonId: string) => void;
}

interface PokemonStat {
  name: string;
  base_stat: number;
}

interface Ability {
  name: string;
  effect: string;
  isHidden: boolean;
}

interface EvolutionStage {
  species: string;
  sprite: string;
  trigger?: string;
  minLevel?: number;
  item?: string;
  heldItem?: string;
  minHappiness?: number;
  minBeauty?: number;
  minAffection?: number;
  timeOfDay?: string;
  location?: string;
  knownMove?: string;
  partySpecies?: string;
}

// Mapeamento de itens de evolução
const ITEM_TRANSLATIONS: Record<string, string> = {
  "thunder-stone": "Pedra do Trovão",
  "fire-stone": "Pedra de Fogo",
  "water-stone": "Pedra d'Água",
  "leaf-stone": "Pedra da Folha",
  "moon-stone": "Pedra da Lua",
  "sun-stone": "Pedra do Sol",
  "shiny-stone": "Pedra Brilhante",
  "dusk-stone": "Pedra do Crepúsculo",
  "dawn-stone": "Pedra da Aurora",
  "ice-stone": "Pedra de Gelo",
  "metal-coat": "Revestimento Metálico",
  "kings-rock": "Rocha do Rei",
  upgrade: "Upgrade",
  protector: "Protetor",
  electirizer: "Eletrizador",
  magmarizer: "Magmatizador",
  "dragon-scale": "Escama de Dragão",
  "prism-scale": "Escama Prismática",
  "reaper-cloth": "Pano Sinistro",
  "razor-claw": "Garra Afiada",
  "razor-fang": "Presa Afiada",
  "dubious-disc": "Disco Duvidoso",
  "oval-stone": "Pedra Oval",
  "deep-sea-tooth": "Dente Abissal",
  "deep-sea-scale": "Escama Abissal",
  "tart-apple": "Maçã Ácida",
  "sweet-apple": "Maçã Doce",
  "cracked-pot": "Pote Rachado",
  "chipped-pot": "Pote Lascado",
  "galarica-cuff": "Bracelete Galarico",
  "galarica-wreath": "Coroa Galarica",
};

const getEvolutionTrigger = (stage: EvolutionStage): string | null => {
  if (!stage.trigger) return null;

  const parts: string[] = [];

  // Level up
  if (stage.trigger === "level-up") {
    if (stage.minLevel) {
      parts.push(`Nível ${stage.minLevel}`);
    } else if (stage.minHappiness) {
      parts.push(`Felicidade ${stage.minHappiness}+`);
    } else if (stage.minAffection) {
      parts.push(`Afeição ${stage.minAffection}+`);
    } else if (stage.minBeauty) {
      parts.push(`Beleza ${stage.minBeauty}+`);
    } else if (stage.location) {
      parts.push(`Local específico`);
    } else if (stage.timeOfDay === "day") {
      parts.push(`De dia`);
    } else if (stage.timeOfDay === "night") {
      parts.push(`À noite`);
    } else if (stage.knownMove) {
      parts.push(`Aprender golpe`);
    } else if (stage.partySpecies) {
      parts.push(`Com Pokémon específico`);
    } else {
      parts.push(`Subir de nível`);
    }

    if (stage.heldItem) {
      const itemName = ITEM_TRANSLATIONS[stage.heldItem] || stage.heldItem;
      parts.push(`segurando ${itemName}`);
    }
  }

  // Use item
  if (stage.trigger === "use-item" && stage.item) {
    const itemName = ITEM_TRANSLATIONS[stage.item] || stage.item;
    parts.push(`Usar ${itemName}`);
  }

  // Trade
  if (stage.trigger === "trade") {
    parts.push("Troca");
    if (stage.heldItem) {
      const itemName = ITEM_TRANSLATIONS[stage.heldItem] || stage.heldItem;
      parts.push(`segurando ${itemName}`);
    }
  }

  // Outros triggers
  if (stage.trigger === "shed") {
    parts.push("Evolução automática");
  }

  if (stage.trigger === "spin") {
    parts.push("Girar");
  }

  if (stage.trigger === "tower-of-darkness") {
    parts.push("Torre das Trevas");
  }

  if (stage.trigger === "tower-of-waters") {
    parts.push("Torre das Águas");
  }

  if (stage.trigger === "three-critical-hits") {
    parts.push("3 críticos em uma luta");
  }

  if (stage.trigger === "take-damage") {
    parts.push("Receber dano");
  }

  if (stage.trigger === "agile-style-move") {
    parts.push("Usar estilo ágil");
  }

  if (stage.trigger === "strong-style-move") {
    parts.push("Usar estilo forte");
  }

  if (stage.trigger === "recoil-damage") {
    parts.push("Sofrer recuo");
  }

  return parts.length > 0 ? parts.join(" ") : null;
};

// Função para escurecer uma cor hex
const darkenColor = (hex: string, percent: number = 30): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
  const g = Math.max(
    0,
    Math.floor(((num >> 8) & 0x00ff) * (1 - percent / 100)),
  );
  const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export function PokemonModal({
  pokemon,
  isOpen,
  onClose,
  onToggleTeam,
}: PokemonModalProps) {
  const [stats, setStats] = useState<PokemonStat[]>([]);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [height, setHeight] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !pokemon.species_name) return;

    const fetchPokemonData = async () => {
      setLoading(true);
      try {
        // Buscar stats, abilities, height, weight
        const pokeResponse = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemon.species_name.toLowerCase()}`,
        );
        if (pokeResponse.ok) {
          const pokeData = await pokeResponse.json();
          setStats(
            pokeData.stats.map((s: any) => ({
              name: s.stat.name,
              base_stat: s.base_stat,
            })),
          );

          // Altura e Peso (converter de decímetros e hectogramas)
          setHeight(pokeData.height / 10);
          setWeight(pokeData.weight / 10);

          // Buscar habilidades com descrições
          const abilitiesPromises = pokeData.abilities.map(async (a: any) => {
            try {
              const abilityRes = await fetch(a.ability.url);
              if (abilityRes.ok) {
                const abilityData = await abilityRes.json();
                const effectEntry = abilityData.effect_entries.find(
                  (e: any) => e.language.name === "en",
                );
                return {
                  name: a.ability.name,
                  effect:
                    effectEntry?.short_effect ||
                    effectEntry?.effect ||
                    "Sem descrição disponível",
                  isHidden: a.is_hidden,
                };
              }
            } catch (err) {
              console.error("Erro ao buscar habilidade:", err);
            }
            return null;
          });

          const resolvedAbilities = (
            await Promise.all(abilitiesPromises)
          ).filter((a): a is Ability => a !== null);
          setAbilities(resolvedAbilities);

          // Buscar species para pegar evolution chain e descrição
          const speciesResponse = await fetch(pokeData.species.url);
          if (speciesResponse.ok) {
            const speciesData = await speciesResponse.json();

            // Buscar flavor text (descrição da Pokédex)
            const flavorTextEntry = speciesData.flavor_text_entries.find(
              (entry: any) => entry.language.name === "en",
            );
            if (flavorTextEntry) {
              setDescription(
                flavorTextEntry.flavor_text
                  .replace(/\f/g, " ")
                  .replace(/\n/g, " "),
              );
            }

            // Evolution chain
            const evolutionResponse = await fetch(
              speciesData.evolution_chain.url,
            );
            if (evolutionResponse.ok) {
              const evolutionData = await evolutionResponse.json();
              const chain = parseEvolutionChain(evolutionData.chain);
              setEvolutionChain(chain);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do Pokémon:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonData();
  }, [isOpen, pokemon.species_name]);

  const parseEvolutionChain = (chain: any): EvolutionStage[] => {
    const stages: EvolutionStage[] = [];

    const traverse = (node: any, previousDetails?: any) => {
      const speciesName = node.species.name;
      const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokeIdFromUrl(node.species.url)}.png`;

      let trigger = undefined;
      let minLevel = undefined;
      let item = undefined;
      let heldItem = undefined;
      let minHappiness = undefined;
      let minBeauty = undefined;
      let minAffection = undefined;
      let timeOfDay = undefined;
      let location = undefined;
      let knownMove = undefined;
      let partySpecies = undefined;

      // Usar os detalhes passados (que são da evolução PARA este pokémon)
      if (previousDetails) {
        trigger = previousDetails.trigger?.name;
        minLevel = previousDetails.min_level;
        item = previousDetails.item?.name;
        heldItem = previousDetails.held_item?.name;
        minHappiness = previousDetails.min_happiness;
        minBeauty = previousDetails.min_beauty;
        minAffection = previousDetails.min_affection;
        timeOfDay = previousDetails.time_of_day;
        location = previousDetails.location?.name;
        knownMove = previousDetails.known_move?.name;
        partySpecies = previousDetails.party_species?.name;
      }

      stages.push({
        species: speciesName,
        sprite,
        trigger,
        minLevel,
        item,
        heldItem,
        minHappiness,
        minBeauty,
        minAffection,
        timeOfDay,
        location,
        knownMove,
        partySpecies,
      });

      if (node.evolves_to && node.evolves_to.length > 0) {
        const nextNode = node.evolves_to[0];
        const nextDetails =
          nextNode.evolution_details && nextNode.evolution_details.length > 0
            ? nextNode.evolution_details[0]
            : undefined;
        traverse(nextNode, nextDetails);
      }
    };

    traverse(chain);
    return stages;
  };

  const getPokeIdFromUrl = (url: string): string => {
    const parts = url.split("/");
    return parts[parts.length - 2];
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles["modal-backdrop"]} onClick={handleBackdropClick}>
      <div className={styles["modal-content"]}>
        <button className={styles["close-button"]} onClick={onClose}>
          ✕
        </button>

        <div className={styles["modal-header"]}>
          <div className={styles["sprite-large"]}>
            {pokemon.sprite_url ? (
              <img
                src={pokemon.sprite_url}
                alt={pokemon.species_name}
                className={styles["sprite-img"]}
              />
            ) : (
              <span className={styles["sprite-placeholder"]}>?</span>
            )}
          </div>

          <div className={styles["header-info"]}>
            <h2 className={styles["nickname"]}>{pokemon.nickname}</h2>
            <p className={styles["species"]}>{pokemon.species_name}</p>

            {(pokemon.type_1 || pokemon.type_2) && (
              <div className={styles["types"]}>
                {pokemon.type_1 && (
                  <span
                    className={styles["type-badge"]}
                    style={{
                      backgroundColor: TYPE_COLORS[pokemon.type_1] || "#999",
                    }}
                  >
                    {pokemon.type_1}
                  </span>
                )}
                {pokemon.type_2 && (
                  <span
                    className={styles["type-badge"]}
                    style={{
                      backgroundColor: TYPE_COLORS[pokemon.type_2] || "#999",
                    }}
                  >
                    {pokemon.type_2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {description && (
          <div className={styles["pokedex-entry"]}>
            <p className={styles["pokedex-text"]}>{description}</p>
          </div>
        )}

        <div className={styles["modal-body"]}>
          <div className={styles["info-grid"]}>
            {pokemon.game && (
              <div className={styles["info-item"]}>
                <span className={styles["info-label"]}>🎮 Jogo:</span>
                <span className={styles["info-value"]}>
                  {pokemon.game.name}
                </span>
              </div>
            )}

            {pokemon.caught_at && (
              <div className={styles["info-item"]}>
                <span className={styles["info-label"]}>📍 Capturado em:</span>
                <span className={styles["info-value"]}>
                  {pokemon.caught_at}
                </span>
              </div>
            )}

            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>📅 Status:</span>
              <span
                className={`${styles["status-badge"]} ${
                  pokemon.is_active
                    ? styles["status-active"]
                    : styles["status-inactive"]
                }`}
              >
                {pokemon.is_active ? "No time" : "Na box"}
              </span>
            </div>

            <div className={styles["info-item"]}>
              <span className={styles["info-label"]}>🕐 Adicionado:</span>
              <span className={styles["info-value"]}>
                {formatDate(pokemon.created_at)}
              </span>
            </div>
          </div>

          {/* Altura e Peso */}
          {(height > 0 || weight > 0) && (
            <div className={styles["physical-stats"]}>
              {height > 0 && (
                <div className={styles["physical-stat"]}>
                  <span className={styles["stat-icon"]}>📏</span>
                  <span className={styles["stat-label"]}>Altura:</span>
                  <span className={styles["stat-value-physical"]}>
                    {height.toFixed(1)}m
                  </span>
                </div>
              )}
              {weight > 0 && (
                <div className={styles["physical-stat"]}>
                  <span className={styles["stat-icon"]}>⚖️</span>
                  <span className={styles["stat-label"]}>Peso:</span>
                  <span className={styles["stat-value-physical"]}>
                    {weight.toFixed(1)}kg
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Habilidades */}
          {abilities.length > 0 && (
            <div className={styles["section"]}>
              <h3 className={styles["section-title"]}>✨ Habilidades</h3>
              <div className={styles["abilities-grid"]}>
                {abilities.map((ability) => (
                  <div
                    key={ability.name}
                    className={`${styles["ability-card"]} ${
                      ability.isHidden ? styles["hidden-ability"] : ""
                    }`}
                    title={ability.effect}
                  >
                    <div className={styles["ability-header"]}>
                      <span className={styles["ability-name"]}>
                        {ability.name.replace("-", " ")}
                      </span>
                      {ability.isHidden && (
                        <span className={styles["hidden-badge"]}>Oculta</span>
                      )}
                    </div>
                    <p className={styles["ability-effect"]}>{ability.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type Effectiveness */}
          {(pokemon.type_1 || pokemon.type_2) && (
            <div className={styles["section"]}>
              <h3 className={styles["section-title"]}>
                ⚔️ Efetividade de Tipos
              </h3>
              {(() => {
                const typing = calculateDefensiveTyping(
                  pokemon.type_1,
                  pokemon.type_2,
                );
                return (
                  <>
                    {typing.weaknesses.length > 0 && (
                      <div className={styles["type-category"]}>
                        <h4 className={styles["category-title"]}>Fraquezas</h4>
                        <div className={styles["type-badges"]}>
                          {typing.weaknesses.map((t) => {
                            const bgColor = TYPE_COLORS[t.type] || "#999";
                            return (
                              <span
                                key={t.type}
                                className={`${styles["type-pill"]} ${styles["weakness"]}`}
                                style={{
                                  backgroundColor: bgColor,
                                  borderColor: darkenColor(bgColor, 35),
                                }}
                              >
                                {t.type} ×{t.multiplier}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {typing.resistances.length > 0 && (
                      <div className={styles["type-category"]}>
                        <h4 className={styles["category-title"]}>
                          Resistências
                        </h4>
                        <div className={styles["type-badges"]}>
                          {typing.resistances.map((t) => {
                            const bgColor = TYPE_COLORS[t.type] || "#999";
                            return (
                              <span
                                key={t.type}
                                className={`${styles["type-pill"]} ${styles["resistance"]}`}
                                style={{
                                  backgroundColor: bgColor,
                                  borderColor: darkenColor(bgColor, 35),
                                }}
                              >
                                {t.type} ×{t.multiplier}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {typing.immunities.length > 0 && (
                      <div className={styles["type-category"]}>
                        <h4 className={styles["category-title"]}>Imunidades</h4>
                        <div className={styles["type-badges"]}>
                          {typing.immunities.map((t) => {
                            const bgColor = TYPE_COLORS[t.type] || "#999";
                            return (
                              <span
                                key={t.type}
                                className={`${styles["type-pill"]} ${styles["immunity"]}`}
                                style={{
                                  backgroundColor: bgColor,
                                  borderColor: darkenColor(bgColor, 35),
                                }}
                              >
                                {t.type} ×0
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div className={styles["section"]}>
              <h3 className={styles["section-title"]}>📊 Status Base</h3>
              <div className={styles["stats-grid"]}>
                {stats.map((stat) => (
                  <div key={stat.name} className={styles["stat-row"]}>
                    <span className={styles["stat-name"]}>
                      {stat.name.toUpperCase().replace("-", " ")}
                    </span>
                    <div className={styles["stat-bar-container"]}>
                      <div
                        className={styles["stat-bar"]}
                        style={{
                          width: `${Math.min((stat.base_stat / 200) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className={styles["stat-value"]}>
                      {stat.base_stat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evolution Chain */}
          {evolutionChain.length > 1 && (
            <div className={styles["section"]}>
              <h3 className={styles["section-title"]}>🔄 Linha Evolutiva</h3>
              <div className={styles["evolution-chain"]}>
                {evolutionChain.map((stage, index) => (
                  <>
                    <div
                      key={stage.species}
                      className={styles["evolution-stage"]}
                    >
                      <div
                        className={`${styles["evolution-sprite"]} ${
                          stage.species === pokemon.species_name
                            ? styles["current"]
                            : ""
                        }`}
                      >
                        <img src={stage.sprite} alt={stage.species} />
                      </div>
                      <span className={styles["evolution-name"]}>
                        {stage.species}
                      </span>
                    </div>
                    {index < evolutionChain.length - 1 && (
                      <div
                        key={`connector-${index}`}
                        className={styles["evolution-connector"]}
                      >
                        <div className={styles["evolution-line"]} />
                        {(() => {
                          const nextStage = evolutionChain[index + 1];
                          const requirement = getEvolutionTrigger(nextStage);
                          return requirement ? (
                            <span className={styles["evolution-requirement"]}>
                              {requirement}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </>
                ))}
              </div>
            </div>
          )}

          {onToggleTeam && (
            <button
              onClick={() => {
                onToggleTeam(pokemon.id);
                onClose();
              }}
              className={styles["action-button"]}
            >
              {pokemon.is_active ? "← Mover para Box" : "→ Adicionar ao Time"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
