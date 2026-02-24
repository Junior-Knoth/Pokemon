import { useEffect, useState } from "react";
import {
  Filter,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "./ThumbZone.module.css";
import FilterSheet from "./FilterSheet";

export default function ThumbZone({ initialFilters, onApply }) {
  const [hasScroll, setHasScroll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    function check() {
      setHasScroll(document.documentElement.scrollHeight > window.innerHeight);
    }
    check();
    window.addEventListener("resize", check);
    window.addEventListener("scroll", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("scroll", check);
    };
  }, []);

  function goTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBottom() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }

  function openFilters() {
    setShowFilters(true);
  }

  function closeFilters() {
    setShowFilters(false);
  }

  function handleApply(filters) {
    // forward filters to parent
    onApply?.(filters);
    console.log("Applied filters", filters);
  }

  return (
    <>
      <div className={styles.thumbZone}>
        <div className={styles.left}>
          {hasScroll ? (
            <div className={styles.verticalButtons}>
              <button
                className={styles.small}
                onClick={goTop}
                aria-label="Ir para o topo"
              >
                <ChevronUp size={22} />
              </button>
              <button
                className={styles.small}
                onClick={goBottom}
                aria-label="Ir para o final"
              >
                <ChevronDown size={22} />
              </button>
            </div>
          ) : (
            <div style={{ width: 56 }} />
          )}
        </div>

        <div className={styles.center}>
          <button className={styles.add} aria-label="Adicionar pokémon">
            Adicionar pokémon
          </button>
        </div>

        <div className={styles.right}>
          <button
            className={styles.filter}
            aria-label="Filtros"
            onClick={openFilters}
          >
            <Filter size={22} />
          </button>
        </div>
      </div>
      <FilterSheet
        open={showFilters}
        onClose={closeFilters}
        onApply={handleApply}
        initial={initialFilters}
      />
    </>
  );
}
