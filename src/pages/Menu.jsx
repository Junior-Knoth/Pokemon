import styles from "./Menu.module.css";
import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import ThumbZone from "../components/ThumbZone";
import PokemonGrid from "../components/PokemonGrid";
import SearchBar from "../components/SearchBar";

export default function Menu({ selected, onSelect }) {
  const [filters, setFilters] = useState({ status: "all", types: [] });
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [localAdds, setLocalAdds] = useState([]);
  const exportFnRef = useRef(null);
  // sort state: 'none' | 'recent' | 'alpha-asc' | 'alpha-desc'
  const [sort, setSort] = useState("none");
  // store previous sort so alpha can revert back to it on 3rd click
  const [prevSortBeforeAlpha, setPrevSortBeforeAlpha] = useState(null);
  useEffect(() => {
    // clear locally added pokemons when switching selected game
    setLocalAdds([]);
  }, [selected?.id]);

  function handleRecentClick() {
    setSort((s) => {
      if (s === "recent") return "none";
      // remember previous sort when switching to recent so alpha can revert later
      setPrevSortBeforeAlpha(s);
      return "recent";
    });
  }

  function handleAlphaClick() {
    setSort((s) => {
      if (s === "alpha-asc") return "alpha-desc";
      if (s === "alpha-desc") return prevSortBeforeAlpha || "none";
      // starting alpha cycle: remember current sort to allow revert
      setPrevSortBeforeAlpha(s);
      return "alpha-asc";
    });
  }

  function handleExport() {
    const fn = exportFnRef.current;
    if (typeof fn !== "function") {
      alert("Nenhum dado disponível para exportar");
      return;
    }
    try {
      const list = fn() || [];
      const json = JSON.stringify(list, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pokemons.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error", e);
      alert("Erro ao exportar");
    }
  }

  return (
    <div className={styles.container}>
      <Header selected={selected} onSelect={onSelect} onExport={handleExport} />
      <SearchBar
        value={query}
        onChange={setQuery}
        sort={sort}
        onRecentClick={handleRecentClick}
        onAlphaClick={handleAlphaClick}
      />
      <PokemonGrid
        selected={selected}
        filters={filters}
        search={query}
        sort={sort}
        reloadKey={reloadKey}
        added={localAdds}
        onUpdated={(row) => {
          // update localAdds immediately if the edited pokemon is in the localAdds list
          setLocalAdds((prev) =>
            prev.map((p) =>
              String(p.id) === String(row.id) ? { ...p, ...row } : p,
            ),
          );
        }}
        registerExport={(fn) => {
          exportFnRef.current = fn;
        }}
      />
      <div className={styles.bottomSpacer} />
      <ThumbZone
        initialFilters={filters}
        onApply={setFilters}
        selected={selected}
        onCreated={(p) => setLocalAdds((s) => [p, ...s])}
      />
    </div>
  );
}
