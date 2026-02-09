// Tipos para a PokeAPI
export interface PokeAPIType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokeAPISprites {
  front_default: string;
  other?: {
    "official-artwork"?: {
      front_default: string;
    };
  };
}

export interface PokeAPIPokemon {
  id: number;
  name: string;
  types: PokeAPIType[];
  sprites: PokeAPISprites;
}

// Cores por tipo de Pokémon
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

// Helper para buscar Pokémon na PokeAPI
export async function fetchPokemonFromAPI(
  speciesName: string,
): Promise<PokeAPIPokemon | null> {
  try {
    // 1. Tenta buscar o nome direto (ex: snorlax, pikachu)
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${speciesName.toLowerCase()}`,
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    // 2. Se deu erro (404), busca na espécie (ex: toxtricity, gourgeist)
    const speciesRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${speciesName.toLowerCase()}`,
    );

    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      // Pega o nome da primeira variedade (geralmente a padrão)
      const defaultVariety = speciesData.varieties[0].pokemon.name;

      // Busca novamente com o nome "correto" (ex: gourgeist-average, toxtricity-amped)
      const finalRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${defaultVariety}`,
      );

      if (finalRes.ok) {
        const data = await finalRes.json();
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar Pokémon:", error);
    return null;
  }
}
