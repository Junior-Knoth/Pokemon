import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface Pokemon {
  id: string;
  user_id: string;
  game_id: string;
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

interface PokemonContextData {
  pokemons: Pokemon[];
  loading: boolean;
  error: string | null;
  activeGameId: string | null;
  setActiveGameId: (gameId: string | null) => void;
  fetchPokemons: () => Promise<void>;
  fetchPokemonsByGame: (gameId: string) => Promise<void>;
  addPokemon: (
    pokemon: Omit<Pokemon, "id" | "user_id" | "created_at">,
  ) => Promise<void>;
  refreshPokemons: () => Promise<void>;
  toggleTeamStatus: (pokemonId: string) => Promise<void>;
  countActivePokemons: (gameId: string) => number;
}

const PokemonContext = createContext<PokemonContextData | undefined>(undefined);

interface PokemonProviderProps {
  children: ReactNode;
}

const ACTIVE_GAME_KEY = "pokemon-active-game-id";

export function PokemonProvider({ children }: PokemonProviderProps) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGameId, setActiveGameIdState] = useState<string | null>(() => {
    // Tentar ler do localStorage ao iniciar
    const saved = localStorage.getItem(ACTIVE_GAME_KEY);
    return saved || null;
  });

  const setActiveGameId = (gameId: string | null) => {
    setActiveGameIdState(gameId);
    if (gameId) {
      localStorage.setItem(ACTIVE_GAME_KEY, gameId);
    } else {
      localStorage.removeItem(ACTIVE_GAME_KEY);
    }
  };

  // Carregar Pokémon do jogo ativo ao iniciar
  useEffect(() => {
    if (activeGameId) {
      fetchPokemonsByGame(activeGameId);
    } else {
      fetchPokemons();
    }
  }, [activeGameId]);

  const fetchPokemons = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("pokemons")
        .select(
          `
          *,
          game:games(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setPokemons(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar Pokémon";
      setError(errorMessage);
      console.error("Erro ao buscar Pokémon:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemonsByGame = async (gameId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("pokemons")
        .select(
          `
          *,
          game:games(name)
        `,
        )
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setPokemons(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar Pokémon";
      setError(errorMessage);
      console.error("Erro ao buscar Pokémon por jogo:", err);
    } finally {
      setLoading(false);
    }
  };

  const addPokemon = async (
    pokemon: Omit<Pokemon, "id" | "user_id" | "created_at">,
  ) => {
    try {
      const { error: insertError } = await supabase
        .from("pokemons")
        .insert([pokemon]);

      if (insertError) throw insertError;

      // Recarregar lista após adicionar
      await fetchPokemons();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao adicionar Pokémon";
      setError(errorMessage);
      throw err;
    }
  };

  const refreshPokemons = async () => {
    await fetchPokemons();
  };

  const toggleTeamStatus = async (pokemonId: string) => {
    try {
      // Encontrar o Pokémon
      const pokemon = pokemons.find((p) => p.id === pokemonId);
      if (!pokemon) {
        throw new Error("Pokémon não encontrado");
      }

      const newStatus = !pokemon.is_active;

      // Se estiver tentando adicionar ao time (is_active = true), verificar limite
      if (newStatus) {
        const activeCount = countActivePokemons(pokemon.game_id);
        if (activeCount >= 6) {
          alert(
            "Você já tem 6 Pokémon no time! Remova um antes de adicionar outro.",
          );
          return;
        }
      }

      // Atualizar no Supabase
      const { error: updateError } = await supabase
        .from("pokemons")
        .update({ is_active: newStatus })
        .eq("id", pokemonId);

      if (updateError) throw updateError;

      // Atualizar estado local
      setPokemons((prev) =>
        prev.map((p) =>
          p.id === pokemonId ? { ...p, is_active: newStatus } : p,
        ),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao alterar status do Pokémon";
      setError(errorMessage);
      throw err;
    }
  };

  const countActivePokemons = (gameId: string): number => {
    return pokemons.filter((p) => p.game_id === gameId && p.is_active).length;
  };

  return (
    <PokemonContext.Provider
      value={{
        pokemons,
        loading,
        error,
        activeGameId,
        setActiveGameId,
        fetchPokemons,
        fetchPokemonsByGame,
        addPokemon,
        refreshPokemons,
        toggleTeamStatus,
        countActivePokemons,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
}

export function usePokemon() {
  const context = useContext(PokemonContext);

  if (context === undefined) {
    throw new Error("usePokemon must be used within a PokemonProvider");
  }

  return context;
}
