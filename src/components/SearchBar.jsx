import { ArrowDownAZ, ArrowUpDown } from "lucide-react";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  value,
  onChange,
  sort,
  onRecentClick,
  onAlphaClick,
}) {
  return (
    <div className={styles.searchBar}>
      <div className={styles.left}>
        <button
          className={styles.iconBtn}
          aria-label="Ordenar por mais recentes"
          onClick={() => onRecentClick?.()}
        >
          <ArrowUpDown />
        </button>
      </div>

      <div className={styles.center}>
        <input
          className={styles.input}
          placeholder="Procurar por apelido ou espécie"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>

      <div className={styles.right}>
        <button
          className={styles.iconBtn}
          aria-label="Ordenar alfabeticamente"
          onClick={() => onAlphaClick?.()}
        >
          <ArrowDownAZ />
        </button>
      </div>
    </div>
  );
}
