import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import PokemonCard from "./PokemonCard";
import styles from "./PokemonGrid.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PokemonGrid({
  selected,
  filters,
  search,
  rows = 5,
  cols = 3,
  sort = "none",
  reloadKey = 0,
  added = [],
}) {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [removedIds, setRemovedIds] = useState(() => new Set());

  useEffect(() => {
    if (!selected?.id) {
      setPokemons([]);
      return;
    }
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("pokemons")
        .select(
          "id, nickname, species_name, sprite_url, type_1, type_2, is_active, gender, created_at",
        )
        .eq("game_id", selected.id)
        .order("created_at", { ascending: true });
      setLoading(false);
      if (error) {
        console.error("Erro ao buscar pokemons:", error);
        return;
      }
      if (mounted) setPokemons(data || []);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selected, reloadKey]);

  const max = rows * cols;

  // merge server pokemons with locally added ones for this selected game
  const addedList = Array.isArray(added)
    ? added.filter((a) => a && a.game_id === selected?.id)
    : [];
  const combined = [
    ...addedList,
    ...pokemons.filter(
      (p) => !addedList.some((a) => String(a.id) === String(p.id)),
    ),
  ];

  // filter out any locally removed ids (to avoid needing a reload)
  const combinedFiltered = combined.filter(
    (p) => !removedIds.has(String(p.id)),
  );

  // reset page when key data changes
  useEffect(() => {
    setPage(0);
  }, [selected?.id, filters, search, sort, added]);

  function handleDeleted(deleted) {
    if (!deleted || !deleted.id) return;
    setRemovedIds((s) => {
      const next = new Set(Array.from(s));
      next.add(String(deleted.id));
      return next;
    });
  }

  // apply client-side filters (status and types)
  const applied = combinedFiltered.filter((p) => {
    if (!filters) return true;
    const { status, types } = filters || {};

    // normalize is_active which may come as boolean, string or null
    const raw = p.is_active;
    const activeStr = String(
      raw === null || raw === undefined ? "" : raw,
    ).toLowerCase();
    const isActive =
      activeStr === "true" ||
      activeStr === "t" ||
      activeStr === "1" ||
      raw === true;

    if (status === "active" && !isActive) return false;
    if (status === "noc" && isActive) return false;

    if (types && types.length > 0) {
      const chosen = types.map((t) => String(t).toLowerCase());
      const t1 = String(p.type_1 || "").toLowerCase();
      const t2 = String(p.type_2 || "").toLowerCase();
      if (!chosen.includes(t1) && !chosen.includes(t2)) return false;
    }
    return true;
  });

  // apply search filter (nickname or species_name)
  const searchLower = (typeof search === "string" ? search : "")
    .trim()
    .toLowerCase();
  const searched = searchLower
    ? applied.filter((p) => {
        const nick = String(p.nickname || "").toLowerCase();
        const species = String(p.species_name || "").toLowerCase();
        return nick.includes(searchLower) || species.includes(searchLower);
      })
    : applied;

  const total = searched.length;
  const totalPages = Math.max(1, Math.ceil(total / max));
  const start = page * max;
  const visible = searched.slice(start, start + max);

  // apply sorting
  let finalList = searched;
  if (sort === "recent") {
    // sort by created_at desc
    finalList = [...searched].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
  } else if (sort === "alpha-asc") {
    finalList = [...searched].sort((a, b) => {
      const aa = String(a.nickname || a.species_name || "").toLowerCase();
      const bb = String(b.nickname || b.species_name || "").toLowerCase();
      return aa.localeCompare(bb);
    });
  } else if (sort === "alpha-desc") {
    finalList = [...searched].sort((a, b) => {
      const aa = String(a.nickname || a.species_name || "").toLowerCase();
      const bb = String(b.nickname || b.species_name || "").toLowerCase();
      return bb.localeCompare(aa);
    });
  }

  const visibleSorted = finalList.slice(start, start + max);

  if (!selected)
    return (
      <div className={styles.empty}>Selecione um jogo para ver Pokémons</div>
    );

  return (
    <section
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {loading && <div className={styles.loading}>Carregando...</div>}
      {visibleSorted.map((p) => (
        <PokemonCard key={p.id} pokemon={p} onDeleted={handleDeleted} />
      ))}
      <div
        style={{
          gridColumn: `1 / -1`,
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          className={styles.pagerButton}
          aria-label="Página anterior"
          onClick={() => setPage((s) => Math.max(0, s - 1))}
          disabled={page <= 0}
        >
          <ChevronLeft />
        </button>
        <div
          className={styles.pagerInfo}
        >{`${page * max + 1}-${Math.min((page + 1) * max, total)} de ${total}`}</div>
        <button
          className={styles.pagerButton}
          aria-label="Próxima página"
          onClick={() => setPage((s) => Math.min(totalPages - 1, s + 1))}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
