import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { fetchPokemonFromAPI, TYPE_COLORS } from "../../lib/pokeapi";
import type { PokeAPIPokemon } from "../../lib/pokeapi";
import { PokemonCard } from "../../components/PokemonCard";
import { usePokemon } from "../../context/PokemonContext";
import { Header } from "../../components/Header/Header";
import styles from "./Pokemons.module.css";

interface Game {
  id: string;
  name: string;
}

interface PokemonVariety {
  name: string;
  displayName: string;
  pokemon: {
    name: string;
    url: string;
  };
}

interface PokemonsProps {
  onNavigate: (view: string) => void;
}

export function Pokemons({ onNavigate }: PokemonsProps) {
  const {
    pokemons,
    loading,
    activeGameId,
    setActiveGameId,
    fetchPokemons,
    toggleTeamStatus,
  } = usePokemon();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredPokemons, setFilteredPokemons] = useState(pokemons);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isEvolveModalOpen, setIsEvolveModalOpen] = useState(false);
  const [evolvingPokemon, setEvolvingPokemon] = useState<any>(null);
  const [possibleEvolutions, setPossibleEvolutions] = useState<any[]>([]);
  const [selectedEvolution, setSelectedEvolution] = useState<string>("");
  const [evolutionPreview, setEvolutionPreview] =
    useState<PokeAPIPokemon | null>(null);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);

  const [filters, setFilters] = useState({
    species: "",
    nickname: "",
    type: "",
  });
  const hasFilters = Boolean(
    filters.species || filters.nickname || filters.type,
  );

  // Form state
  const [formData, setFormData] = useState({
    game_id: "",
    nickname: "",
    species_name: "",
    caught_at: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pokemonPreview, setPokemonPreview] = useState<PokeAPIPokemon | null>(
    null,
  );
  const [pokemonVarieties, setPokemonVarieties] = useState<PokemonVariety[]>(
    [],
  );
  const [selectedVariety, setSelectedVariety] = useState<string>("");

  useEffect(() => {
    fetchGames();
  }, []);

  // Atualizar pokémons filtrados quando mudar seleção ou lista completa
  useEffect(() => {
    if (activeGameId) {
      setFilteredPokemons(pokemons.filter((p) => p.game_id === activeGameId));
    } else {
      setFilteredPokemons(pokemons);
    }
  }, [activeGameId, pokemons]);

  // Separar Pokémon em Party e Box
  const partyPokemons = filteredPokemons.filter((p) => p.is_active);
  const boxPokemons = filteredPokemons.filter((p) => !p.is_active);

  // Sistema de paginação para Box (30 Pokémon por página)
  const POKEMON_PER_PAGE = 30;
  const [currentBoxPage, setCurrentBoxPage] = useState(1);
  const totalBoxPages = Math.max(
    1,
    Math.ceil(boxPokemons.length / POKEMON_PER_PAGE),
  );

  const paginatedBoxPokemons = boxPokemons.slice(
    (currentBoxPage - 1) * POKEMON_PER_PAGE,
    currentBoxPage * POKEMON_PER_PAGE,
  );

  const handlePreviousPage = () => {
    setCurrentBoxPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentBoxPage((prev) => Math.min(totalBoxPages, prev + 1));
  };

  // Reset página ao mudar de jogo
  useEffect(() => {
    setCurrentBoxPage(1);
  }, [activeGameId]);

  // Reaplica filtros ao mudar a lista ou jogo
  useEffect(() => {
    if (filters.species || filters.nickname || filters.type) {
      applyFilters();
    } else {
      if (activeGameId) {
        setFilteredPokemons(pokemons.filter((p) => p.game_id === activeGameId));
      } else {
        setFilteredPokemons(pokemons);
      }
    }
  }, [pokemons, activeGameId]);

  const applyFilters = () => {
    let list = pokemons.slice();

    if (activeGameId) {
      list = list.filter((p) => p.game_id === activeGameId);
    }

    if (filters.species.trim()) {
      const q = filters.species.trim().toLowerCase();
      list = list.filter((p) =>
        (p.species_name || "").toLowerCase().includes(q),
      );
    }

    if (filters.nickname.trim()) {
      const q = filters.nickname.trim().toLowerCase();
      list = list.filter((p) => (p.nickname || "").toLowerCase().includes(q));
    }

    if (filters.type.trim()) {
      const t = filters.type.trim();
      list = list.filter((p) => p.type_1 === t || p.type_2 === t);
    }

    setFilteredPokemons(list);
    setCurrentBoxPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilters({ species: "", nickname: "", type: "" });
    if (activeGameId) {
      setFilteredPokemons(pokemons.filter((p) => p.game_id === activeGameId));
    } else {
      setFilteredPokemons(pokemons);
    }
    setCurrentBoxPage(1);
  };

  const exportPokemonList = async () => {
    try {
      // Buscar todos os pokémons com informações de jogo
      const { data: allPokemons, error } = await supabase
        .from("pokemons")
        .select(
          `
          id,
          nickname,
          species_name,
          game_id,
          is_active,
          games (name)
        `,
        )
        .order("game_id")
        .order("nickname");

      if (error) throw error;

      if (!allPokemons || allPokemons.length === 0) {
        alert("Nenhum Pokémon para exportar!");
        return;
      }

      // Agrupar pokémons por jogo
      const pokemonsByGame: { [key: string]: any[] } = {};

      allPokemons.forEach((pokemon: any) => {
        const gameName = pokemon.games?.name || "Sem Jogo";
        if (!pokemonsByGame[gameName]) {
          pokemonsByGame[gameName] = [];
        }
        pokemonsByGame[gameName].push(pokemon);
      });

      // Gerar conteúdo do arquivo
      let content = "=== MINHA LISTA DE POKÉMON ===\n\n";

      Object.keys(pokemonsByGame)
        .sort()
        .forEach((gameName) => {
          content += `-- ${gameName} --\n`;
          pokemonsByGame[gameName].forEach((pokemon) => {
            const displayName = pokemon.nickname || pokemon.species_name;
            const speciesInfo =
              pokemon.nickname && pokemon.nickname !== pokemon.species_name
                ? ` - ${pokemon.species_name}`
                : "";
            const status = pokemon.is_active ? " [PARTY]" : "";
            content += `${displayName}${speciesInfo}${status}\n`;
          });
          content += `\n`;
        });

      content += `\nTotal de Pokémon: ${allPokemons.length}\n`;
      content += `Total de Jogos: ${Object.keys(pokemonsByGame).length}\n`;
      content += `\n=== FIM DA LISTA ===`;

      // Criar e baixar arquivo
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.download = `meus_pokemons_${date}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("Lista exportada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erro ao exportar lista:", err);
      setError("Erro ao exportar lista de Pokémon");
      setTimeout(() => setError(""), 3000);
    }
  };

  const fetchGames = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("games")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setGames(data || []);

      // Se tiver activeGameId salvo mas o jogo não existir mais, limpar
      if (activeGameId && data && !data.some((g) => g.id === activeGameId)) {
        setActiveGameId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jogos");
    }
  };

  const handleToggleTeam = async (pokemonId: string) => {
    try {
      await toggleTeamStatus(pokemonId);
    } catch (err) {
      // O erro já é tratado no contexto com alert
      console.error("Erro ao alterar status:", err);
    }
  };

  const handleDeletePokemon = async (pokemonId: string) => {
    try {
      const { error } = await supabase
        .from("pokemons")
        .delete()
        .eq("id", pokemonId);

      if (error) throw error;

      setSuccess("Pokémon deletado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);

      // Atualizar lista
      await fetchPokemons(activeGameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar Pokémon");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEvolvePokemon = async (pokemon: any) => {
    setEvolvingPokemon(pokemon);
    setIsEvolveModalOpen(true);
    setLoadingEvolutions(true);
    setPossibleEvolutions([]);
    setSelectedEvolution("");
    setEvolutionPreview(null);
    setEvolutionSuccess(false);

    try {
      // Buscar cadeia de evolução na PokeAPI
      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemon.species_name}`,
      );
      if (!speciesRes.ok) throw new Error("Espécie não encontrada");
      const speciesData = await speciesRes.json();

      const chainRes = await fetch(speciesData.evolution_chain.url);
      if (!chainRes.ok) throw new Error("Cadeia de evolução não encontrada");
      const chainData = await chainRes.json();

      // Extrair evoluções possíveis
      const evolutions: any[] = [];

      // Normalizar nome do Pokémon (remover sufixos de forma regional)
      const normalizedSpecies = pokemon.species_name
        .split("-")[0]
        .toLowerCase();

      const extractEvolutions = (chain: any, currentSpecies: string) => {
        // Comparar com o nome base (sem sufixos)
        const chainSpeciesBase = chain.species.name.split("-")[0].toLowerCase();

        if (
          (chainSpeciesBase === currentSpecies ||
            chain.species.name === pokemon.species_name) &&
          chain.evolves_to.length > 0
        ) {
          chain.evolves_to.forEach((evo: any) => {
            // Para formas regionais, usar o nome completo da espécie original
            const evolvedName =
              pokemon.species_name.includes("-") &&
              !evo.species.name.includes("-")
                ? `${evo.species.name}-${pokemon.species_name.split("-")[1]}`
                : evo.species.name;

            evolutions.push({
              name: evolvedName,
              originalName: evo.species.name,
              displayName: evolvedName
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" "),
            });
          });
        }
        chain.evolves_to.forEach((evo: any) =>
          extractEvolutions(evo, currentSpecies),
        );
      };
      extractEvolutions(chainData.chain, normalizedSpecies);

      if (evolutions.length === 0) {
        setError("Este Pokémon não possui evoluções disponíveis.");
        setTimeout(() => setError(""), 3000);
        setIsEvolveModalOpen(false);
        return;
      }

      setPossibleEvolutions(evolutions);

      // Se houver apenas 1 evolução, selecionar automaticamente
      if (evolutions.length === 1) {
        await handleSelectEvolution(evolutions[0].name);
      }
    } catch (err) {
      setError("Erro ao buscar evoluções. Verifique o nome da espécie.");
      setTimeout(() => setError(""), 3000);
      setIsEvolveModalOpen(false);
    } finally {
      setLoadingEvolutions(false);
    }
  };

  const handleSelectEvolution = async (evolutionName: string) => {
    if (!evolutionName) return;

    setSelectedEvolution(evolutionName);
    setEvolutionPreview(null);

    try {
      // Tentar buscar com o nome completo primeiro
      let data = await fetchPokemonFromAPI(evolutionName);

      // Se falhar e for uma forma regional, tentar com o nome base
      if (!data && evolutionName.includes("-")) {
        const baseName = evolutionName.split("-")[0];
        data = await fetchPokemonFromAPI(baseName);
      }

      if (data) {
        setEvolutionPreview(data);
      } else {
        setError("Não foi possível carregar dados desta evolução");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Erro ao buscar dados da evolução");
      setTimeout(() => setError(""), 3000);
    }
  };

  const confirmEvolution = async () => {
    if (!evolutionPreview || !evolvingPokemon) return;

    try {
      const spriteUrl =
        evolutionPreview.sprites.other?.["official-artwork"]?.front_default ||
        evolutionPreview.sprites.front_default;
      const type1 = evolutionPreview.types[0]?.type.name || null;
      const type2 = evolutionPreview.types[1]?.type.name || null;

      const { error: updateError } = await supabase
        .from("pokemons")
        .update({
          species_name: selectedEvolution,
          sprite_url: spriteUrl,
          type_1: type1,
          type_2: type2,
        })
        .eq("id", evolvingPokemon.id);

      if (updateError) throw updateError;

      setEvolutionSuccess(true);
      await fetchPokemons(activeGameId);

      setTimeout(() => {
        setIsEvolveModalOpen(false);
        setEvolutionSuccess(false);
        setEvolvingPokemon(null);
        setPossibleEvolutions([]);
        setSelectedEvolution("");
        setEvolutionPreview(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao evoluir Pokémon");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleVerifySpecies = async () => {
    if (!formData.species_name.trim()) {
      setError("Digite o nome da espécie para verificar");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setPokemonPreview(null);
      setPokemonVarieties([]);
      setSelectedVariety("");

      // Buscar na species para pegar todas as variedades
      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${formData.species_name.toLowerCase()}`,
      );

      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();

        // Se houver múltiplas variedades, mostrar opções
        if (speciesData.varieties && speciesData.varieties.length > 1) {
          const varieties = speciesData.varieties.map((v: any) => ({
            name: v.pokemon.name,
            displayName: v.pokemon.name
              .split("-")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" "),
            pokemon: v.pokemon,
          }));
          setPokemonVarieties(varieties);
          setSuccess(
            `${varieties.length} variações encontradas! Selecione uma abaixo.`,
          );
          setTimeout(() => setSuccess(""), 4000);
        } else {
          // Se tiver apenas uma variedade, buscar diretamente
          const data = await fetchPokemonFromAPI(formData.species_name);
          if (data) {
            setPokemonPreview(data);
            setSuccess("Pokémon encontrado na PokeAPI!");
            setTimeout(() => setSuccess(""), 3000);
          } else {
            setError("Pokémon não encontrado na PokeAPI. Verifique o nome.");
          }
        }
      } else {
        // Tentar buscar diretamente se não encontrar species
        const data = await fetchPokemonFromAPI(formData.species_name);
        if (data) {
          setPokemonPreview(data);
          setSuccess("Pokémon encontrado na PokeAPI!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Pokémon não encontrado na PokeAPI. Verifique o nome.");
        }
      }
    } catch (err) {
      setError("Erro ao verificar Pokémon na PokeAPI");
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectVariety = async (varietyName: string) => {
    setSelectedVariety(varietyName);
    try {
      setVerifying(true);
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${varietyName}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPokemonPreview(data);
        setSuccess("Variação selecionada!");
        setTimeout(() => setSuccess(""), 2000);
      }
    } catch (err) {
      setError("Erro ao buscar variação");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.game_id) {
      setError("Selecione um jogo");
      return;
    }

    if (!formData.nickname.trim()) {
      setError("O nickname é obrigatório");
      return;
    }

    if (!formData.species_name.trim()) {
      setError("O nome da espécie é obrigatório");
      return;
    }

    // Verificar se o Pokémon existe na PokeAPI antes de salvar
    if (!pokemonPreview) {
      setError("Verifique o nome da espécie na PokeAPI antes de salvar");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // Extrair dados da PokeAPI para salvar no banco
      const spriteUrl =
        pokemonPreview.sprites.other?.["official-artwork"]?.front_default ||
        pokemonPreview.sprites.front_default;
      const type1 = pokemonPreview.types[0]?.type.name || null;
      const type2 = pokemonPreview.types[1]?.type.name || null;

      const { error: insertError } = await supabase.from("pokemons").insert([
        {
          game_id: formData.game_id,
          nickname: formData.nickname.trim(),
          species_name: formData.species_name.trim().toLowerCase(),
          caught_at: formData.caught_at.trim() || null,
          is_active: false, // Sempre começa na Box
          sprite_url: spriteUrl,
          type_1: type1,
          type_2: type2,
        },
      ]);

      if (insertError) throw insertError;

      setSuccess("Pokémon adicionado com sucesso!");
      setFormData({
        game_id: formData.game_id, // Mantém o jogo selecionado
        nickname: "",
        species_name: "",
        caught_at: "",
      });
      setPokemonPreview(null);

      // Recarregar lista do contexto
      await fetchPokemons();

      // Fechar modal após sucesso
      setTimeout(() => {
        setSuccess("");
        setIsAddModalOpen(false);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao adicionar Pokémon",
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpar preview quando mudar o nome da espécie
    if (name === "species_name") {
      setPokemonPreview(null);
    }
  };

  // Calcular contagem de tipos
  const getTypeCount = () => {
    const typeCount: Record<string, number> = {};
    
    pokemons.forEach((pokemon) => {
      if (pokemon.type_1) {
        typeCount[pokemon.type_1] = (typeCount[pokemon.type_1] || 0) + 1;
      }
      if (pokemon.type_2) {
        typeCount[pokemon.type_2] = (typeCount[pokemon.type_2] || 0) + 1;
      }
    });
    
    // Ordenar por quantidade (maior para menor)
    return Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  };

  return (
    <div className={styles["container"]}>
      <Header title="Meus Pokémon">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-header-primary"
        >
          + Adicionar Pokémon
        </button>
        <button
          onClick={exportPokemonList}
          className="btn-header-secondary"
          title="Exportar lista completa de Pokémons"
        >
          📥 Exportar Lista
        </button>
      </Header>

      {/* Modal de Adicionar Pokémon */}
      {isAddModalOpen && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2 className={styles["modal-title"]}>Adicionar Novo Pokémon</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={styles["modal-close"]}
              >
                ✕
              </button>
            </div>

            {error && <div className={styles["error"]}>{error}</div>}
            {success && <div className={styles["success"]}>{success}</div>}

            {games.length === 0 && (
              <div className={styles["warning"]}>
                Você precisa cadastrar pelo menos um jogo antes de adicionar
                Pokémon.{" "}
                <button
                  onClick={() => onNavigate("games")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#856404",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Ir para Jogos
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles["form"]}>
                <div className={styles["form-group"]}>
                  <label htmlFor="game_id" className={styles["label"]}>
                    Jogo *
                  </label>
                  <select
                    id="game_id"
                    name="game_id"
                    value={formData.game_id}
                    onChange={handleInputChange}
                    disabled={submitting || games.length === 0}
                    className={styles["select"]}
                    required
                  >
                    <option value="">-- Selecionar jogo --</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles["form-group"]}>
                  <label htmlFor="nickname" className={styles["label"]}>
                    Nickname *
                  </label>
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="Ex: Freddie"
                    disabled={submitting}
                    className="input-default"
                    required
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label htmlFor="caught_at" className={styles["label"]}>
                    Capturado em
                  </label>
                  <input
                    id="caught_at"
                    name="caught_at"
                    type="text"
                    value={formData.caught_at}
                    onChange={handleInputChange}
                    placeholder="Ex: Route 4"
                    disabled={submitting}
                    className="input-default"
                  />
                </div>

                <div className={styles["form-group-full"]}>
                  <label htmlFor="species_name" className={styles["label"]}>
                    Nome da Espécie (PokeAPI) *
                  </label>
                  <div className={styles["species-group"]}>
                    <input
                      id="species_name"
                      name="species_name"
                      type="text"
                      value={formData.species_name}
                      onChange={handleInputChange}
                      placeholder="Ex: toxtricity, pikachu, charizard"
                      disabled={submitting}
                      className="input-default"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerifySpecies}
                      disabled={
                        verifying || submitting || !formData.species_name.trim()
                      }
                      className={styles["verify-button"]}
                    >
                      {verifying ? "Verificando..." : "Verificar"}
                    </button>
                  </div>

                  {pokemonVarieties.length > 0 && (
                    <div className={styles["varieties-selector"]}>
                      <label className={styles["label"]}>
                        Selecione a variação:
                      </label>
                      <select
                        value={selectedVariety}
                        onChange={(e) => handleSelectVariety(e.target.value)}
                        className={styles["select"]}
                        disabled={verifying}
                      >
                        <option value="">-- Escolha uma variação --</option>
                        {pokemonVarieties.map((variety) => (
                          <option key={variety.name} value={variety.name}>
                            {variety.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pokemonPreview && (
                    <div className={styles["pokemon-preview"]}>
                      <div className={styles["preview-header"]}>
                        <img
                          src={
                            pokemonPreview.sprites.other?.["official-artwork"]
                              ?.front_default ||
                            pokemonPreview.sprites.front_default
                          }
                          alt={pokemonPreview.name}
                          className={styles["preview-sprite"]}
                        />
                        <div className={styles["preview-info"]}>
                          <div className={styles["preview-name"]}>
                            {pokemonPreview.name}
                          </div>
                          <div className={styles["preview-types"]}>
                            {pokemonPreview.types.map((typeInfo) => (
                              <span
                                key={typeInfo.type.name}
                                className={styles["preview-type-badge"]}
                                style={{
                                  backgroundColor:
                                    TYPE_COLORS[typeInfo.type.name] || "#999",
                                }}
                              >
                                {typeInfo.type.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles["button-group"]}>
                <button
                  type="submit"
                  disabled={submitting || !pokemonPreview || games.length === 0}
                  className="btn-header-primary"
                >
                  {submitting ? "Adicionando..." : "Adicionar Pokémon"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      game_id: "",
                      nickname: "",
                      species_name: "",
                      caught_at: "",
                    });
                    setPokemonPreview(null);
                  }}
                  disabled={submitting}
                  className="btn-header-secondary"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-header-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Filtro de Pokémon (nível superior para evitar problemas de stacking) */}
      {isFilterModalOpen && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2 className={styles["modal-title"]}>Filtrar Pokémon</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className={styles["modal-close"]}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "var(--spacing-lg)" }}>
              <div className={styles["form"]}>
                <div className={styles["form-group"]}>
                  <label className={styles["label"]}>Nome da Espécie</label>
                  <input
                    value={filters.species}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        species: e.target.value,
                      }))
                    }
                    placeholder="Ex: pikachu"
                    className="input-default"
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label className={styles["label"]}>Nickname</label>
                  <input
                    value={filters.nickname}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        nickname: e.target.value,
                      }))
                    }
                    placeholder="Ex: Freddie"
                    className="input-default"
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label className={styles["label"]}>Tipo</label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="select-default"
                  >
                    <option value="">-- Qualquer tipo --</option>
                    {Object.keys(TYPE_COLORS).map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className={styles["button-group"]}
                style={{ marginTop: "var(--spacing-lg)" }}
              >
                <button onClick={applyFilters} className="btn-header-primary">
                  Aplicar
                </button>
                <button onClick={clearFilters} className="btn-header-secondary">
                  Limpar
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="btn-header-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Evolução de Pokémon */}
      {isEvolveModalOpen && evolvingPokemon && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => !evolutionSuccess && setIsEvolveModalOpen(false)}
        >
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2 className={styles["modal-title"]}>Evoluir Pokémon</h2>
              {!evolutionSuccess && (
                <button
                  onClick={() => setIsEvolveModalOpen(false)}
                  className={styles["modal-close"]}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ padding: "var(--spacing-lg)" }}>
              {evolutionSuccess ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                      marginBottom: "var(--spacing-lg)",
                    }}
                  >
                    Parabéns! Seu {evolvingPokemon.nickname} (
                    {evolvingPokemon.species_name}) evoluiu para um(a){" "}
                    {selectedEvolution}!
                  </div>
                  {evolutionPreview && (
                    <img
                      src={
                        evolutionPreview.sprites.other?.["official-artwork"]
                          ?.front_default ||
                        evolutionPreview.sprites.front_default
                      }
                      alt={selectedEvolution}
                      style={{
                        width: "200px",
                        height: "200px",
                        imageRendering: "pixelated",
                      }}
                    />
                  )}
                </div>
              ) : loadingEvolutions ? (
                <div
                  style={{ textAlign: "center", padding: "var(--spacing-xl)" }}
                >
                  Buscando evoluções...
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "var(--spacing-lg)" }}>
                    <strong>Pokémon:</strong> {evolvingPokemon.nickname} (
                    {evolvingPokemon.species_name})
                  </div>

                  <div className={styles["form-group"]}>
                    <label className={styles["label"]}>
                      Selecione a evolução:
                    </label>
                    <select
                      value={selectedEvolution}
                      onChange={(e) => handleSelectEvolution(e.target.value)}
                      className="select-default"
                    >
                      <option value="">-- Escolha uma evolução --</option>
                      {possibleEvolutions.map((evo) => (
                        <option key={evo.name} value={evo.name}>
                          {evo.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {evolutionPreview && (
                    <div className={styles["pokemon-preview"]}>
                      <div className={styles["preview-header"]}>
                        <img
                          src={
                            evolutionPreview.sprites.other?.["official-artwork"]
                              ?.front_default ||
                            evolutionPreview.sprites.front_default
                          }
                          alt={evolutionPreview.name}
                          className={styles["preview-sprite"]}
                        />
                        <div className={styles["preview-info"]}>
                          <div className={styles["preview-name"]}>
                            {evolutionPreview.name}
                          </div>
                          <div className={styles["preview-types"]}>
                            {evolutionPreview.types.map((typeInfo) => (
                              <span
                                key={typeInfo.type.name}
                                className={styles["preview-type-badge"]}
                                style={{
                                  backgroundColor:
                                    TYPE_COLORS[typeInfo.type.name] || "#999",
                                }}
                              >
                                {typeInfo.type.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={styles["button-group"]}
                    style={{ marginTop: "var(--spacing-lg)" }}
                  >
                    <button
                      onClick={confirmEvolution}
                      disabled={!selectedEvolution || !evolutionPreview}
                      className="btn-header-primary"
                    >
                      Confirmar Evolução
                    </button>
                    <button
                      onClick={() => setIsEvolveModalOpen(false)}
                      className="btn-header-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className={styles["main"]}>
        {/* Lista de Pokémon - Party vs Box */}
        {loading ? (
          <div className={styles["loading"]}>Carregando Pokémon...</div>
        ) : !activeGameId ? (
          <div className={styles["empty-state"]}>
            Selecione um jogo acima para visualizar seu time e box de Pokémon.
          </div>
        ) : (
          <div className={styles["pokemon-layout"]}>
            {/* Party Section - Coluna Esquerda */}
            <aside className={styles["party-sidebar"]}>
              <h3 className={styles["party-sidebar-title"]}>Meu Time</h3>

              <div className={styles["party-slots"]}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const pokemon = partyPokemons[index];

                  if (pokemon) {
                    return (
                      <PokemonCard
                        key={pokemon.id}
                        pokemon={pokemon}
                        onToggleTeam={handleToggleTeam}
                        onDelete={handleDeletePokemon}
                        onEvolve={handleEvolvePokemon}
                        isInParty={true}
                      />
                    );
                  }

                  return (
                    <div
                      key={`empty-${index}`}
                      className={styles["party-empty-slot"]}
                    >
                      <div className={styles["party-empty-icon"]}>○</div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Box Section - Coluna Direita */}
            <main className={styles["box-main"]}>
              <div className={styles["box-header"]}>
                <div className={styles["box-header-actions"]}>
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasFilters}
                    className="btn-header-secondary"
                    title="Limpar filtros"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentBoxPage === 1}
                    className={styles["box-nav-button"]}
                  >
                    ◀
                  </button>
                </div>

                <h3 className={styles["box-header-title"]}>
                  Box {currentBoxPage}
                </h3>

                <div className={styles["box-header-actions"]}>
                  <button
                    onClick={handleNextPage}
                    disabled={
                      currentBoxPage === totalBoxPages ||
                      boxPokemons.length === 0
                    }
                    className={styles["box-nav-button"]}
                  >
                    ▶
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(true)}
                    className="btn-header-secondary"
                    title="Filtrar Pokémon"
                  >
                    Filtrar
                  </button>
                </div>
              </div>

              {boxPokemons.length === 0 ? (
                <div className={styles["box-empty"]}>
                  Todos os Pokémon estão no seu time!
                </div>
              ) : (
                <div className={styles["box-grid"]}>
                  {paginatedBoxPokemons.map((pokemon) => (
                    <PokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      onToggleTeam={handleToggleTeam}
                      onDelete={handleDeletePokemon}
                      onEvolve={handleEvolvePokemon}
                      isInParty={false}
                    />
                  ))}

                  {/* Slots vazios para completar o grid */}
                  {Array.from({
                    length: Math.max(
                      0,
                      POKEMON_PER_PAGE - paginatedBoxPokemons.length,
                    ),
                  }).map((_, index) => (
                    <div
                      key={`box-empty-${index}`}
                      className={styles["box-empty-slot"]}
                    />
                  ))}
                </div>
              )}
              
              {/* Footer com contagem de tipos */}
              {pokemons.length > 0 && (
                <div className={styles["type-footer"]}>
                  <div className={styles["type-footer-title"]}>
                    Pokémon por tipo:
                  </div>
                  <div className={styles["type-footer-list"]}>
                    {getTypeCount().map(({ type, count }) => (
                      <div key={type} className={styles["type-footer-item"]}>
                        <span
                          className={styles["type-footer-badge"]}
                          style={{
                            backgroundColor: TYPE_COLORS[type] || "#999",
                          }}
                        >
                          {type}
                        </span>
                        <span className={styles["type-footer-count"]}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </main>
    </div>
  );
}
