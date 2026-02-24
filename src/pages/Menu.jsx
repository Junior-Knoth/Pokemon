import styles from "./Menu.module.css";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import ThumbZone from "../components/ThumbZone";
import PokemonGrid from "../components/PokemonGrid";
import SearchBar from "../components/SearchBar";

export default function Menu({ selected, onSelect }) {
  const [filters, setFilters] = useState({ status: "all", types: [] });
  const [query, setQuery] = useState("");
  // sort state: 'none' | 'recent' | 'alpha-asc' | 'alpha-desc'
  const [sort, setSort] = useState("none");
  // store previous sort so alpha can revert back to it on 3rd click
  const [prevSortBeforeAlpha, setPrevSortBeforeAlpha] = useState(null);

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

  return (
    <div className={styles.container}>
      <Header selected={selected} onSelect={onSelect} />
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
      />
      <div className={styles.bottomSpacer} />
      <ThumbZone initialFilters={filters} onApply={setFilters} />
    </div>
  );
}
