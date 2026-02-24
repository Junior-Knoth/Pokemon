import styles from "./Menu.module.css";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import ThumbZone from "../components/ThumbZone";
import PokemonGrid from "../components/PokemonGrid";
import SearchBar from "../components/SearchBar";

export default function Menu({ selected, onSelect }) {
  const [filters, setFilters] = useState({ status: "all", types: [] });
  const [query, setQuery] = useState("");

  return (
    <div className={styles.container}>
      <Header selected={selected} onSelect={onSelect} />
      <SearchBar value={query} onChange={setQuery} />
      <PokemonGrid selected={selected} filters={filters} search={query} />
      <div className={styles.bottomSpacer} />
      <ThumbZone initialFilters={filters} onApply={setFilters} />
    </div>
  );
}
