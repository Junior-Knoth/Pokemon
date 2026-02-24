import { useEffect, useState } from "react";
import {
  Filter,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "./ThumbZone.module.css";

export default function ThumbZone() {
  const [hasScroll, setHasScroll] = useState(false);

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

  return (
    <div className={styles.thumbZone}>
      <div className={styles.left}>
        {hasScroll ? (
          <div className={styles.verticalButtons}>
            <button
              className={styles.small}
              onClick={goTop}
              aria-label="Ir para o topo"
            >
              <ChevronUp />
            </button>
            <button
              className={styles.small}
              onClick={goBottom}
              aria-label="Ir para o final"
            >
              <ChevronDown />
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
        <button className={styles.filter} aria-label="Filtros">
          <Filter />
        </button>
      </div>
    </div>
  );
}
